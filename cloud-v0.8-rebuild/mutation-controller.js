/* ClubMatch Cloud v0.8 - confirmed-state mutation controller */
(function(global){
'use strict';

function invariant(condition,message,code){
  if(condition)return;
  const error=new Error(message);
  error.code=code||'CLUBMATCH_VALIDATION';
  throw error;
}

function defaultIdFactory(){
  if(global.crypto?.randomUUID)return global.crypto.randomUUID();
  return `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function unwrapRpc(result,name){
  if(result?.error){
    const error=result.error instanceof Error?result.error:new Error(result.error.message||String(result.error));
    error.rpc=name;
    throw error;
  }
  return Object.prototype.hasOwnProperty.call(result||{},'data')?result.data:result;
}

function createMutationController(options){
  invariant(options&&typeof options.rpc==='function','rpc is required','CLUBMATCH_CONFIG');
  invariant(typeof options.deriveSnapshot==='function','deriveSnapshot is required','CLUBMATCH_CONFIG');

  const rpc=options.rpc;
  const deriveSnapshot=options.deriveSnapshot;
  const renderConfirmed=typeof options.renderConfirmed==='function'?options.renderConfirmed:()=>{};
  const idFactory=options.idFactory||defaultIdFactory;
  let queue=Promise.resolve();
  let pendingCount=0;

  async function callRpc(name,params){
    return unwrapRpc(await rpc(name,params),name);
  }

  async function readConfirmed(matchId){
    invariant(matchId,'matchId is required');
    const snapshot=await callRpc('get_match_snapshot',{p_match_id:matchId});
    invariant(snapshot?.match&&snapshot?.state,'Confirmed match snapshot is incomplete','CLUBMATCH_SNAPSHOT');
    const liveState=deriveSnapshot(snapshot);
    invariant(liveState&&liveState.players,'Derived live state is incomplete','CLUBMATCH_SNAPSHOT');
    return {snapshot,liveState};
  }

  function enqueue(task){
    pendingCount++;
    const run=queue.then(task,task);
    queue=run.catch(()=>{}).finally(()=>{pendingCount--});
    return run;
  }

  async function execute(spec){
    return enqueue(async()=>{
      const before=await readConfirmed(spec.matchId);
      const clientEventId=spec.clientEventId||idFactory();
      invariant(clientEventId,'client_event_id could not be created','CLUBMATCH_CLIENT_EVENT_ID');
      const mutation=spec.build(before.liveState,clientEventId,before.snapshot);
      invariant(mutation?.rpc&&mutation?.params,'Mutation specification is incomplete','CLUBMATCH_CONFIG');

      const mutationResult=await callRpc(mutation.rpc,mutation.params);
      const after=await readConfirmed(spec.matchId);
      const beforeVersion=Number(before.snapshot.state.state_version||0);
      const afterVersion=Number(after.snapshot.state.state_version||0);
      invariant(afterVersion>=beforeVersion,'Confirmed state version moved backwards','CLUBMATCH_STATE_VERSION');
      renderConfirmed(after.snapshot,after.liveState,{
        action:spec.action,
        clientEventId,
        mutationResult,
        beforeVersion,
        afterVersion
      });
      return {
        action:spec.action,
        clientEventId,
        mutationResult,
        before,
        after
      };
    });
  }

  function substitute(input){
    return execute({
      action:'SUBSTITUTION',matchId:input.matchId,clientEventId:input.clientEventId,
      build(state,clientEventId){
        const out=state.players[input.outId],inn=state.players[input.inId];
        invariant(out&&inn&&input.outId!==input.inId,'Two different match players are required');
        invariant(out.currentRole==='FIELD','Outgoing player is not on the confirmed field');
        invariant(inn.currentRole==='BENCH','Incoming player is not on the confirmed bench');
        const position=(input.position||out.currentPosition||'').trim();
        invariant(position,'Incoming position is required');
        return {rpc:'record_substitution',params:{
          p_match_id:input.matchId,
          p_player_out_id:input.outId,
          p_player_in_id:input.inId,
          p_new_position:position,
          p_client_event_id:clientEventId
        }};
      }
    });
  }

  function changePosition(input){
    return execute({
      action:'POSITION_CHANGED',matchId:input.matchId,clientEventId:input.clientEventId,
      build(state,clientEventId){
        const player=state.players[input.playerId];
        const position=String(input.position||'').trim();
        invariant(player?.currentRole==='FIELD','Player is not on the confirmed field');
        invariant(position,'New position is required');
        invariant(position!==player.currentPosition,'Player already has this position');
        const occupied=state.fieldIds.find(id=>id!==input.playerId&&state.players[id].currentPosition===position);
        invariant(!occupied,'Position is occupied; use swapPositions for one atomic action','CLUBMATCH_POSITION_OCCUPIED');
        return {rpc:'change_player_position',params:{
          p_match_id:input.matchId,
          p_player_id:input.playerId,
          p_new_position:position,
          p_client_event_id:clientEventId
        }};
      }
    });
  }

  function swapPositions(input){
    return execute({
      action:'POSITIONS_SWAPPED',matchId:input.matchId,clientEventId:input.clientEventId,
      build(state,clientEventId){
        const first=state.players[input.playerId],second=state.players[input.otherPlayerId];
        invariant(first&&second&&input.playerId!==input.otherPlayerId,'Two different match players are required');
        invariant(first.currentRole==='FIELD'&&second.currentRole==='FIELD','Both players must be on the confirmed field');
        invariant(first.currentPosition&&second.currentPosition,'Both players need a confirmed position');
        return {rpc:'swap_player_positions',params:{
          p_match_id:input.matchId,
          p_player_a_id:input.playerId,
          p_player_b_id:input.otherPlayerId,
          p_client_event_id:clientEventId
        }};
      }
    });
  }

  function recordGoal(input){
    return execute({
      action:'GOAL',matchId:input.matchId,clientEventId:input.clientEventId,
      build(state,clientEventId){
        invariant(input.side==='for'||input.side==='against','Goal side must be for or against');
        if(input.side==='for'){
          invariant(state.players[input.scorerId]?.currentRole==='FIELD','Scorer is not on the confirmed field');
          if(input.assistId){
            invariant(input.assistId!==input.scorerId,'Scorer and assist cannot be the same player');
            invariant(state.players[input.assistId]?.currentRole==='FIELD','Assist player is not on the confirmed field');
          }
        }else invariant(!input.scorerId&&!input.assistId,'Opponent goals cannot use ClubMatch player IDs');
        return {rpc:'record_goal',params:{
          p_match_id:input.matchId,
          p_side:input.side,
          p_client_event_id:clientEventId,
          p_scorer_player_id:input.scorerId||null,
          p_assist_player_id:input.assistId||null,
          p_goal_type:input.goalType||null,
          p_note:input.note||null
        }};
      }
    });
  }

  function advanceClock(input){
    return execute({
      action:'CLOCK',matchId:input.matchId,clientEventId:input.clientEventId,
      build(state,clientEventId,snapshot){
        const allowed=['pause','resume','halftime','second_half','injury_time','finish'];
        invariant(allowed.includes(input.clockAction),'Unsupported clock action');
        if(input.clockAction==='injury_time')invariant(Number.isInteger(input.minutes)&&input.minutes>=0&&input.minutes<=60,'Injury time must be 0-60 minutes');
        invariant(snapshot.match.status!=='finished','Match is already finished');
        return {rpc:'advance_match_clock',params:{
          p_match_id:input.matchId,
          p_action:input.clockAction,
          p_client_event_id:clientEventId,
          p_minutes:input.clockAction==='injury_time'?input.minutes:null
        }};
      }
    });
  }

  function deleteMatch(input){
    return enqueue(async()=>{
      invariant(input?.matchId,'matchId is required');
      invariant(input.confirmation==='DELETE','Explicit DELETE confirmation is required','CLUBMATCH_DELETE_CONFIRMATION');
      const before=await readConfirmed(input.matchId);
      invariant(!['live','halftime'].includes(before.snapshot.match.status),'Active matches must be finished before deletion','CLUBMATCH_DELETE_ACTIVE');
      const mutationResult=await callRpc('delete_match_v08',{
        p_match_id:input.matchId,
        p_confirmation:input.confirmation
      });
      invariant(mutationResult?.ok===true,'Server did not confirm match deletion','CLUBMATCH_DELETE_FAILED');
      return {action:'MATCH_DELETED',mutationResult,before,after:null};
    });
  }

  return {
    readConfirmed,
    substitute,
    changePosition,
    swapPositions,
    recordGoal,
    advanceClock,
    deleteMatch,
    get pendingCount(){return pendingCount}
  };
}

global.ClubMatchV08MutationController={createMutationController};
})(typeof window!=='undefined'?window:globalThis);
