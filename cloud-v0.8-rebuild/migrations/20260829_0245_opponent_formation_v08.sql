-- ClubMatch Cloud v0.8 - Cloud-persistent opponent formation for live analyst workspace
alter table public.matches add column if not exists opponent_formation_code text not null default '4-3-3';

do $$ begin
  alter table public.matches add constraint matches_opponent_formation_code_v08_check check (opponent_formation_code in ('4-3-3','4-2-3-1','4-4-2','3-5-2','3-4-3','5-3-2'));
exception when duplicate_object then null; end $$;

create or replace function public.set_opponent_formation_v08(p_match_id uuid,p_formation_code text)
returns jsonb language plpgsql set search_path to '' as $function$
declare v_uid uuid := (select auth.uid());v_club_id uuid;v_status text;v_version bigint;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if p_formation_code not in ('4-3-3','4-2-3-1','4-4-2','3-5-2','3-4-3','5-3-2') then raise exception 'Unsupported opponent formation'; end if;
 select m.club_id,m.status into v_club_id,v_status from public.matches m where m.id=p_match_id for update;
 if not found then raise exception 'Match not found'; end if;
 if not (select private.can_edit_matches(v_club_id)) then raise exception 'Not allowed to manage this match'; end if;
 update public.matches set opponent_formation_code=p_formation_code,updated_at=clock_timestamp() where id=p_match_id;
 update public.match_state set state_version=state_version+1,updated_at=clock_timestamp(),updated_by=v_uid where match_id=p_match_id returning state_version into v_version;
 return jsonb_build_object('ok',true,'match_id',p_match_id,'opponent_formation_code',p_formation_code,'status',v_status,'state_version',v_version);
end;$function$;
grant execute on function public.set_opponent_formation_v08(uuid,text) to authenticated;

create or replace function public.get_match_snapshot(p_match_id uuid)
returns jsonb language plpgsql stable security definer set search_path to '' as $function$
declare v_snapshot jsonb;v_events jsonb;v_formation text;
begin
 v_snapshot := public.get_match_snapshot_base_v08(p_match_id);
 select m.opponent_formation_code into v_formation from public.matches m where m.id=p_match_id;
 v_snapshot := jsonb_set(v_snapshot,'{match,opponent_formation_code}',to_jsonb(coalesce(v_formation,'4-3-3')),true);
 select coalesce(jsonb_agg(case when exists(select 1 from public.match_events vx where vx.match_id=p_match_id and vx.target_event_id=(item.event->>'id')::uuid and vx.event_type='analyst_action_voided') then jsonb_set(item.event,'{event_type}',to_jsonb((item.event->>'event_type')||'_voided_original'),true) else item.event end order by item.ord),'[]'::jsonb)
 into v_events from jsonb_array_elements(coalesce(v_snapshot->'events','[]'::jsonb)) with ordinality as item(event,ord);
 return jsonb_set(v_snapshot,'{events}',v_events,true);
end;$function$;
