-- ClubMatch Cloud build 1800: late/guest players from same club + same season.
-- Production migration equivalent of late_guest_players_same_club_season_v08 + v10 contract.

create or replace function public.get_late_arrival_candidates_v08(p_match_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $$
declare
  v_club_id uuid; v_team_season_id uuid; v_season_id uuid; v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select m.club_id,m.team_season_id,ts.season_id into v_club_id,v_team_season_id,v_season_id
  from public.matches m join public.team_seasons ts on ts.id=m.team_season_id where m.id=p_match_id;
  if not found then raise exception 'Match not found'; end if;
  if not (select private.can_edit_matches(v_club_id)) then raise exception 'Not allowed to manage this match'; end if;
  with candidates as (
    select distinct on (p.id)
      p.id player_id,p.full_name,p.display_name,coalesce(tp.season_shirt_number,p.default_shirt_number) shirt_number,
      p.preferred_positions,ts.id source_team_season_id,t.name source_team_name,(ts.id=v_team_season_id) own_team
    from public.team_players tp
    join public.players p on p.id=tp.player_id
    join public.team_seasons ts on ts.id=tp.team_season_id
    join public.teams t on t.id=ts.team_id
    where ts.club_id=v_club_id and ts.season_id=v_season_id and ts.is_active and t.is_active and tp.is_active and p.is_active
      and not exists(select 1 from public.match_players mp where mp.match_id=p_match_id and mp.player_id=p.id and mp.selected)
    order by p.id,(ts.id=v_team_season_id) desc,coalesce(tp.season_shirt_number,p.default_shirt_number,999),t.name
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'player_id',player_id,'full_name',full_name,'display_name',display_name,'shirt_number',shirt_number,
    'preferred_positions',preferred_positions,'source_team_season_id',source_team_season_id,'source_team_name',source_team_name,
    'own_team',own_team,'guest_player',not own_team
  ) order by own_team desc,coalesce(shirt_number,999),full_name),'[]'::jsonb) into v_result from candidates;
  return v_result;
end;
$$;

create or replace function public.add_late_player_to_match_v08(p_match_id uuid,p_player_id uuid,p_reason text,p_client_event_id uuid)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_uid uuid:=(select auth.uid()); v_club_id uuid; v_team_season_id uuid; v_season_id uuid; v_status text;
  v_clock text; v_elapsed int; v_running_since timestamptz; v_effective int; v_now timestamptz:=clock_timestamp();
  v_shirt int; v_source_team_season_id uuid; v_source_team_name text; v_own_team boolean;
  v_event_id uuid; v_state_version bigint; v_existing uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_client_event_id is null then raise exception 'client_event_id is required'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'Reason for late arrival is required'; end if;
  select m.club_id,m.team_season_id,ts.season_id,m.status into v_club_id,v_team_season_id,v_season_id,v_status
  from public.matches m join public.team_seasons ts on ts.id=m.team_season_id where m.id=p_match_id for update of m;
  if not found then raise exception 'Match not found'; end if;
  if not (select private.can_edit_matches(v_club_id)) then raise exception 'Not allowed to manage this match'; end if;
  if v_status not in ('live','halftime') then raise exception 'Late/guest player can only be added during a live match or halftime'; end if;
  select e.id into v_existing from public.match_events e where e.match_id=p_match_id and e.client_event_id=p_client_event_id limit 1;
  if v_existing is not null then return jsonb_build_object('ok',true,'idempotent',true,'event_id',v_existing); end if;
  select ts.id,t.name,(ts.id=v_team_season_id),coalesce(tp.season_shirt_number,p.default_shirt_number)
    into v_source_team_season_id,v_source_team_name,v_own_team,v_shirt
  from public.team_players tp
  join public.players p on p.id=tp.player_id
  join public.team_seasons ts on ts.id=tp.team_season_id
  join public.teams t on t.id=ts.team_id
  where tp.player_id=p_player_id and ts.club_id=v_club_id and ts.season_id=v_season_id
    and ts.is_active and t.is_active and tp.is_active and p.is_active
  order by (ts.id=v_team_season_id) desc,coalesce(tp.season_shirt_number,p.default_shirt_number,999),t.name limit 1;
  if v_source_team_season_id is null then raise exception 'Player is not active in this club/season'; end if;
  select ms.clock_status,ms.elapsed_seconds,ms.running_since into v_clock,v_elapsed,v_running_since from public.match_state ms where ms.match_id=p_match_id for update;
  if not found then raise exception 'Match state missing'; end if;
  v_effective:=v_elapsed;
  if v_clock='running' then v_effective:=v_elapsed+greatest(0,floor(extract(epoch from(v_now-v_running_since)))::int); end if;
  perform set_config('clubmatch.atomic_rpc','on',true);
  insert into public.match_players(club_id,match_id,player_id,attendance_status,selected,is_starter,starting_position,current_position,shirt_number_snapshot,is_on_field,accumulated_play_seconds,accumulated_bench_seconds,state_changed_elapsed_seconds,state_changed_at)
  values(v_club_id,p_match_id,p_player_id,'late',true,false,null,null,v_shirt,false,0,0,v_effective,v_now)
  on conflict(match_id,player_id) do update set attendance_status='late',selected=true,is_starter=false,starting_position=null,current_position=null,
    shirt_number_snapshot=coalesce(excluded.shirt_number_snapshot,public.match_players.shirt_number_snapshot),is_on_field=false,
    accumulated_play_seconds=0,accumulated_bench_seconds=0,state_changed_elapsed_seconds=v_effective,state_changed_at=v_now,updated_at=v_now;
  insert into public.match_events(club_id,match_id,event_type,match_minute,match_second,actor_user_id,subject_player_id,client_event_id,payload,occurred_at)
  values(v_club_id,p_match_id,'late_player_added',floor(v_effective/60.0)::int,mod(v_effective,60),v_uid,p_player_id,p_client_event_id,
    jsonb_build_object('reason',btrim(p_reason),'arrival_second',v_effective,'source_team_season_id',v_source_team_season_id,'source_team_name',v_source_team_name,'guest_player',not v_own_team),v_now)
  returning id into v_event_id;
  update public.match_state set elapsed_seconds=v_effective,running_since=case when v_clock='running' then v_now else null end,
    last_event_at=v_now,updated_by=v_uid,state_version=state_version+1 where match_id=p_match_id returning state_version into v_state_version;
  return jsonb_build_object('ok',true,'event_id',v_event_id,'player_id',p_player_id,'arrival_second',v_effective,'state_version',v_state_version,
    'source_team_season_id',v_source_team_season_id,'source_team_name',v_source_team_name,'guest_player',not v_own_team);
end;
$$;

create or replace function public.get_late_arrival_candidates_v10(p_match_id uuid)
returns jsonb language sql stable set search_path to '' as $$ select public.get_late_arrival_candidates_v08(p_match_id); $$;
create or replace function public.add_late_player_to_match_v10(p_match_id uuid,p_player_id uuid,p_reason text,p_client_event_id uuid)
returns jsonb language sql set search_path to '' as $$ select public.add_late_player_to_match_v08(p_match_id,p_player_id,p_reason,p_client_event_id); $$;

grant execute on function public.get_late_arrival_candidates_v08(uuid) to authenticated;
grant execute on function public.add_late_player_to_match_v08(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.get_late_arrival_candidates_v10(uuid) to authenticated;
grant execute on function public.add_late_player_to_match_v10(uuid,uuid,text,uuid) to authenticated;
