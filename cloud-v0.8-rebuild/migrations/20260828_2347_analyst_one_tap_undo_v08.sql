-- ClubMatch Cloud v0.8 build 20260828.2347
-- Audit-safe one-tap undo for analyst input.

alter table public.match_events drop constraint if exists match_events_event_type_check;
alter table public.match_events add constraint match_events_event_type_check check (event_type = any (array[
'match_started','match_paused','match_resumed','halftime_started','second_half_started','injury_time_set','match_finished','match_closed','attendance_changed','selection_changed','starter_changed','formation_changed','substitution','substitution_corrected','substitution_voided','position_changed','position_corrected','position_voided','goal_for','goal_against','goal_corrected','goal_voided','score_corrected','note','correction','automatic_deadline_stop','extra_time_started','penalties_started','penalty_attempt','player_action','team_possession','late_player_added','analyst_action_voided'
]));

-- The original snapshot implementation was renamed once in production to
-- get_match_snapshot_base_v08. The public wrapper keeps originals audit-visible
-- while presenting generically voided analyst events as non-effective event types.
create or replace function public.get_match_snapshot(p_match_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare v_snapshot jsonb;v_events jsonb;
begin
  v_snapshot:=public.get_match_snapshot_base_v08(p_match_id);
  select coalesce(jsonb_agg(case when exists(
    select 1 from public.match_events vx where vx.match_id=p_match_id
      and vx.target_event_id=(item.event->>'id')::uuid and vx.event_type='analyst_action_voided'
  ) then jsonb_set(item.event,'{event_type}',to_jsonb((item.event->>'event_type')||'_voided_original'),true)
  else item.event end order by item.ord),'[]'::jsonb)
  into v_events
  from jsonb_array_elements(coalesce(v_snapshot->'events','[]'::jsonb)) with ordinality as item(event,ord);
  return jsonb_set(v_snapshot,'{events}',v_events,true);
end;
$$;
revoke execute on function public.get_match_snapshot_base_v08(uuid) from public,anon,authenticated;
grant execute on function public.get_match_snapshot_base_v08(uuid) to postgres;
revoke execute on function public.get_match_snapshot(uuid) from public,anon;
grant execute on function public.get_match_snapshot(uuid) to authenticated,postgres;

create or replace function public.undo_last_analyst_input_v08(p_match_id uuid,p_client_event_id uuid,p_reason text default 'Snelle analistcorrectie')
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
 v_uid uuid:=(select auth.uid());v_club_id uuid;v_status text;v_group_created_at timestamptz;v_now timestamptz:=clock_timestamp();v_state_version bigint;v_existing uuid;v_used_client boolean:=false;v_count int:=0;v_goal_count int:=0;v_event_id uuid;v_label text;r record;
begin
 if v_uid is null then raise exception 'Inloggen is verplicht';end if;
 if p_client_event_id is null then raise exception 'client_event_id is verplicht';end if;
 select e.id into v_existing from public.match_events e where e.match_id=p_match_id and e.client_event_id=p_client_event_id limit 1;
 if v_existing is not null then select state_version into v_state_version from public.match_state where match_id=p_match_id;return jsonb_build_object('ok',true,'idempotent',true,'event_id',v_existing,'state_version',v_state_version);end if;
 select m.club_id,m.status into v_club_id,v_status from public.matches m where m.id=p_match_id for update;
 if not found then raise exception 'Wedstrijd niet gevonden';end if;
 if not (select private.can_edit_matches(v_club_id)) then raise exception 'Geen rechten om deze wedstrijd te beheren';end if;
 if v_status not in ('live','halftime') then raise exception 'Alleen een actieve wedstrijd kan snel worden gecorrigeerd';end if;
 select max(e.created_at) into v_group_created_at from public.match_events e
 where e.match_id=p_match_id and e.actor_user_id=v_uid
 and not exists(select 1 from public.match_events v where v.match_id=p_match_id and v.target_event_id=e.id and v.event_type in('analyst_action_voided','goal_voided'))
 and ((e.event_type='player_action' and (e.payload->>'source'='action_field' or lower(coalesce(e.payload->>'note','')) like '%analist%' or lower(coalesce(e.payload->>'note','')) like '%balstroom%' or lower(coalesce(e.payload->>'note','')) like '%snelle registratie%' or lower(coalesce(e.payload->>'note','')) like '%bal ontvangen%' or lower(coalesce(e.payload->>'note','')) like '%live actieveld%'))
 or (e.event_type in('goal_for','goal_against') and exists(select 1 from public.match_event_goals g where g.event_id=e.id and lower(coalesce(g.note,'')) like '%analist%')));
 if v_group_created_at is null then raise exception 'Geen recente analistactie gevonden om terug te draaien';end if;
 select coalesce(e.payload->>'action',e.event_type) into v_label from public.match_events e where e.match_id=p_match_id and e.actor_user_id=v_uid and e.created_at=v_group_created_at order by e.occurred_at desc,e.id desc limit 1;
 perform set_config('clubmatch.atomic_rpc','on',true);
 for r in select e.id,e.event_type,e.match_minute,e.match_second from public.match_events e where e.match_id=p_match_id and e.actor_user_id=v_uid and e.created_at=v_group_created_at and e.event_type in('player_action','team_possession','goal_for','goal_against') order by e.id loop
  if exists(select 1 from public.match_events v where v.match_id=p_match_id and v.target_event_id=r.id and v.event_type in('analyst_action_voided','goal_voided')) then continue;end if;
  if r.event_type in('goal_for','goal_against') then
   perform public.void_goal(p_match_id,r.id,case when v_used_client then gen_random_uuid() else p_client_event_id end,p_reason);v_used_client:=true;v_goal_count:=v_goal_count+1;v_count:=v_count+1;
  else
   insert into public.match_events(club_id,match_id,event_type,match_minute,match_second,actor_user_id,target_event_id,client_event_id,payload,occurred_at)
   values(v_club_id,p_match_id,'analyst_action_voided',r.match_minute,r.match_second,v_uid,r.id,case when v_used_client then gen_random_uuid() else p_client_event_id end,jsonb_build_object('reason',nullif(btrim(coalesce(p_reason,'')),''),'source','undo_last_analyst_input','original_event_type',r.event_type,'group_created_at',v_group_created_at),v_now) returning id into v_event_id;v_used_client:=true;v_count:=v_count+1;
  end if;
 end loop;
 if v_count=0 then raise exception 'Laatste analistactie was al teruggedraaid';end if;
 if v_count>v_goal_count then update public.match_state set last_event_at=v_now,updated_by=v_uid,state_version=state_version+1 where match_id=p_match_id returning state_version into v_state_version;else select state_version into v_state_version from public.match_state where match_id=p_match_id;end if;
 return jsonb_build_object('ok',true,'idempotent',false,'group_created_at',v_group_created_at,'voided_count',v_count,'goal_count',v_goal_count,'label',v_label,'state_version',v_state_version);
end;
$$;
revoke execute on function public.undo_last_analyst_input_v08(uuid,uuid,text) from public,anon;
grant execute on function public.undo_last_analyst_input_v08(uuid,uuid,text) to authenticated,postgres;
