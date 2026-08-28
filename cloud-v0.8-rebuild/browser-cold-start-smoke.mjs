import assert from 'node:assert/strict';

const wsUrl=process.env.CM_CDP_WS;
assert.ok(wsUrl,'CM_CDP_WS ontbreekt');
const ws=new WebSocket(wsUrl);
let nextId=1;
const pending=new Map();
const exceptions=[];

function send(method,params={},timeoutMs=5000){
  return new Promise((resolve,reject)=>{
    const id=nextId++;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout bij ${method}`))},timeoutMs);
    pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

ws.addEventListener('message',event=>{
  const message=JSON.parse(String(event.data||'{}'));
  if(message.id&&pending.has(message.id)){
    const {resolve,reject}=pending.get(message.id);pending.delete(message.id);
    if(message.error)reject(new Error(`${message.error.code}: ${message.error.message}`));else resolve(message.result);
    return;
  }
  if(message.method==='Runtime.exceptionThrown'){
    const detail=message.params?.exceptionDetails;
    exceptions.push(detail?.exception?.description||detail?.text||'Onbekende browserexception');
  }
});
await Promise.race([
  new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})}),
  new Promise((_,reject)=>setTimeout(()=>reject(new Error('CDP WebSocket opende niet binnen 5s')),5000))
]);
await send('Runtime.enable');

const expression=`(()=>{
  const status=document.getElementById('v08Status');
  const auth=document.getElementById('authPanel');
  const app=document.getElementById('appPanel');
  const boot=window.__ClubMatchShellBoot||{};
  const resources=performance.getEntriesByType('resource');
  const js=resources.filter(entry=>/\\.js(?:\\?|$)/.test(entry.name));
  return {
    readyState:document.readyState,
    status:String(status?.textContent||''),
    statusClass:String(status?.className||''),
    authVisible:!!auth&&!auth.classList.contains('hidden'),
    appVisible:!!app&&!app.classList.contains('hidden'),
    shellBuild:String(boot.build||''),
    resourceErrors:Array.isArray(boot.resourceErrors)?boot.resourceErrors:[],
    loadedScripts:js.length,
    totalScripts:[...document.scripts].filter(script=>script.src).length
  };
})()`;

const started=Date.now();
let last=null;
while(Date.now()-started<20000){
  const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},3000);
  last=response?.result?.value||null;
  console.log('BROWSER',JSON.stringify(last));
  if(last?.resourceErrors?.length)throw new Error(`Browser resourcefout: ${last.resourceErrors.join(', ')}`);
  if(/start mislukt|module kon niet laden|startfout/i.test(last?.status||''))throw new Error(`Browser bootstrapfout: ${last.status}`);
  if(/ClubMatch Cloud v0\.8 gereed\./i.test(last?.status||'')){
    assert.equal(last.shellBuild,'20260829.0026','cold-start shell build mismatch');
    assert.equal(last.authVisible,true,'uitgelogde cold-start moet login pas na bootstrap tonen');
    assert.equal(last.appVisible,false,'uitgelogde cold-start mag app niet tonen');
    assert.equal(last.loadedScripts,last.totalScripts,'niet alle browsermodules zijn geladen');
    console.log(`PASS browser-cold-start-smoke: ${last.loadedScripts}/${last.totalScripts} scripts, echte Chromium DOM gereed`);
    ws.close();
    process.exit(0);
  }
  await delay(300);
}
ws.close();
throw new Error(`Cold-start timeout na 20s. Laatste DOM-status: ${JSON.stringify(last)}. Browserexceptions: ${JSON.stringify(exceptions.slice(-5))}`);
