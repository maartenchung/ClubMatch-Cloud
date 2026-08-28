/* ClubMatch Cloud v0.8 - isolated top-level workspaces */
(function(global){
'use strict';
function createWorkspaceManager(options={}){
  const doc=options.document||global.document,app=options.app||doc?.getElementById?.('appPanel');
  if(!doc||!app)throw new Error('Appscherm ontbreekt voor workspaces');
  let saved=null,activeName='matches',activePanel=null,observer=null;
  function apply(){
    if(!saved||!activePanel)return;
    [...app.children].forEach(el=>{
      if(el===activePanel){el.classList.remove('hidden');return}
      if(!saved.has(el))saved.set(el,el.classList.contains('hidden'));
      el.classList.add('hidden');
    });
    app.dataset.workspace=activeName;
  }
  function enter(name,panel){
    if(!panel)throw new Error('Workspacepaneel ontbreekt');
    if(saved)exit(false);
    saved=new Map([...app.children].map(el=>[el,el.classList.contains('hidden')]));
    activeName=String(name||'workspace');activePanel=panel;apply();
    if(global.MutationObserver){observer=new global.MutationObserver(apply);observer.observe(app,{childList:true,attributes:true,subtree:false,attributeFilter:['class']})}
    return activeName;
  }
  function exit(restore=true){
    observer?.disconnect();observer=null;
    if(restore&&saved){saved.forEach((wasHidden,el)=>{if(!el?.classList)return;el.classList.toggle('hidden',!!wasHidden)})}
    saved=null;activePanel=null;activeName='matches';delete app.dataset.workspace;return activeName;
  }
  function is(name){return activeName===name}
  return Object.freeze({enter,exit,is,get active(){return activeName}})
}
let singleton=null;
function get(){if(!singleton)singleton=createWorkspaceManager();return singleton}
global.ClubMatchV08Workspace={createWorkspaceManager,get};
})(typeof window!=='undefined'?window:globalThis);
