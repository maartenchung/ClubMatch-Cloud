/* ClubMatch Cloud v0.8 - isolated top-level workspaces with persistent hub */
(function(global){
'use strict';
function createWorkspaceManager(options={}){
  const doc=options.document||global.document,app=options.app||doc?.getElementById?.('appPanel');
  if(!doc||!app)throw new Error('Appscherm ontbreekt voor workspaces');
  let saved=null,activeName='matches',activePanel=null,observer=null;
  const isPersistent=el=>el?.hasAttribute?.('data-workspace-persistent');
  function apply(){
    if(!saved||!activePanel)return;
    [...app.children].forEach(el=>{
      if(el===activePanel||isPersistent(el)){el.classList.remove('hidden');return}
      if(!saved.has(el))saved.set(el,el.classList.contains('hidden'));
      el.classList.add('hidden');
    });
    app.dataset.workspace=activeName;
  }
  function exit(restore=true){
    observer?.disconnect();observer=null;
    if(restore&&saved){saved.forEach((wasHidden,el)=>{if(!el?.classList)return;el.classList.toggle('hidden',!!wasHidden)})}
    saved=null;activePanel=null;activeName='matches';delete app.dataset.workspace;return activeName;
  }
  function enter(name,panel){
    if(!panel)throw new Error('Workspacepaneel ontbreekt');
    /* Always restore the previous workspace first. Otherwise History opened from Dashboard
       stores Dashboard's hidden state as its return target and Back appears to do nothing. */
    if(saved)exit(true);
    saved=new Map([...app.children].map(el=>[el,el.classList.contains('hidden')]));
    activeName=String(name||'workspace');activePanel=panel;apply();
    if(global.MutationObserver){observer=new global.MutationObserver(apply);observer.observe(app,{childList:true,attributes:true,subtree:false,attributeFilter:['class']})}
    return activeName;
  }
  function is(name){return activeName===name}
  function backToMatches(){return exit(true)}
  return Object.freeze({enter,exit,backToMatches,is,get active(){return activeName}})
}
let singleton=null;
function get(){if(!singleton)singleton=createWorkspaceManager();return singleton}
global.ClubMatchV08Workspace={createWorkspaceManager,get};
})(typeof window!=='undefined'?window:globalThis);
