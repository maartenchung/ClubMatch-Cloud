create or replace function public.swap_player_positions(
  p_match_id uuid,
  p_player_a_id uuid,
  p_player_b_id uuid,
  p_client_event_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_club_id uuid;
  v_status text;
  v_event_id uuid;
  v_existing_type text;
  v_existing_payload jsonb;
  v_now timestamptz := clock_timestamp();
  v_clock text;
  v_elapsed integer;
  v_running_since timestamptz;
  v_effective integer;
  v_state_version bigint;
  v_a_on boolean;
  v_b_on boolean;
  v_a_position text;
  v_b_position text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_client_event_id is null then raise exception 'client_event_id is required'; end if;
  if p_player_a_id is null or p_player_b_id is null or p_player_a_id = p_player_b_id then
    raise exception 'Two different players are required';
  end if;

  select m.club_id, m.status
    into v_club_id, v_status
  from public.matches m
  where m.id = p_match_id
  for update;
  if not found then raise exception 'Match not found or inaccessible'; end if;
  if not (select private.can_edit_matches(v_club_id)) then
    raise exception 'Not allowed to manage this match';
  end if;

  select e.id, e.event_type, e.payload
    into v_event_id, v_existing_type, v_existing_payload
  from public.match_events e
  where e.match_id = p_match_id
    and e.client_event_id = p_client_event_id
  limit 1;
  if v_event_id is not null then
    if v_existing_type <> 'position_changed' or coalesce((v_existing_payload->>'swap')::boolean,false) is not true then
      raise exception 'client_event_id was already used for a different action';
    end if;
    select ms.state_version into v_state_version
    from public.match_state ms where ms.match_id = p_match_id;
    return jsonb_build_object(
      'ok',true,'idempotent',true,'event_id',v_event_id,'state_version',v_state_version
    );
  end if;

  if v_status <> 'live' then raise exception 'Position swaps require a live match'; end if;

  select mp.is_on_field, mp.current_position
    into v_a_on, v_a_position
  from public.match_players mp
  where mp.match_id = p_match_id and mp.player_id = p_player_a_id
  for update;
  if not found or not v_a_on then raise exception 'First player must currently be on the field'; end if;

  select mp.is_on_field, mp.current_position
    into v_b_on, v_b_position
  from public.match_players mp
  where mp.match_id = p_match_id and mp.player_id = p_player_b_id
  for update;
  if not found or not v_b_on then raise exception 'Second player must currently be on the field'; end if;

  if v_a_position is null or btrim(v_a_position) = '' or v_b_position is null or btrim(v_b_position) = '' then
    raise exception 'Both players require a confirmed position';
  end if;
  if v_a_position = v_b_position then raise exception 'Players already share the same position'; end if;

  select ms.clock_status, ms.elapsed_seconds, ms.running_since
    into v_clock, v_elapsed, v_running_since
  from public.match_state ms
  where ms.match_id = p_match_id
  for update;
  if not found then raise exception 'Match state is missing'; end if;

  v_effective := v_elapsed;
  if v_clock = 'running' then
    v_effective := v_elapsed + greatest(0,floor(extract(epoch from (v_now-v_running_since)))::integer);
  end if;

  perform set_config('clubmatch.atomic_rpc','on',true);

  update public.match_players
  set current_position = case
        when player_id = p_player_a_id then v_b_position
        when player_id = p_player_b_id then v_a_position
        else current_position
      end,
      state_changed_at = v_now
  where match_id = p_match_id
    and player_id in (p_player_a_id,p_player_b_id);

  if (select count(*) from public.match_players mp
      where mp.match_id=p_match_id and mp.player_id in (p_player_a_id,p_player_b_id)
        and ((mp.player_id=p_player_a_id and mp.current_position=v_b_position)
          or (mp.player_id=p_player_b_id and mp.current_position=v_a_position))) <> 2 then
    raise exception 'Atomic position swap verification failed';
  end if;

  insert into public.match_events(
    club_id,match_id,event_type,match_minute,match_second,actor_user_id,
    subject_player_id,related_player_id,client_event_id,payload,occurred_at
  ) values (
    v_club_id,p_match_id,'position_changed',floor(v_effective/60.0)::integer,mod(v_effective,60),v_uid,
    p_player_a_id,p_player_b_id,p_client_event_id,
    jsonb_build_object(
      'swap',true,
      'old_position',v_a_position,
      'new_position',v_b_position,
      'player_a_old_position',v_a_position,
      'player_a_new_position',v_b_position,
      'player_b_old_position',v_b_position,
      'player_b_new_position',v_a_position
    ),v_now
  ) returning id into v_event_id;

  insert into public.match_event_positions(event_id,club_id,player_id,old_position,new_position)
  values(v_event_id,v_club_id,p_player_a_id,v_a_position,v_b_position);

  update public.match_state
  set elapsed_seconds = v_effective,
      running_since = case when v_clock='running' then v_now else null end,
      last_event_at = v_now,
      updated_by = v_uid,
      state_version = state_version + 1
  where match_id = p_match_id
  returning state_version into v_state_version;

  return jsonb_build_object(
    'ok',true,
    'idempotent',false,
    'event_id',v_event_id,
    'match_second_total',v_effective,
    'player_a_id',p_player_a_id,
    'player_a_old_position',v_a_position,
    'player_a_new_position',v_b_position,
    'player_b_id',p_player_b_id,
    'player_b_old_position',v_b_position,
    'player_b_new_position',v_a_position,
    'state_version',v_state_version
  );
end;
$function$;

revoke all on function public.swap_player_positions(uuid,uuid,uuid,uuid) from public;
revoke all on function public.swap_player_positions(uuid,uuid,uuid,uuid) from anon;
grant execute on function public.swap_player_positions(uuid,uuid,uuid,uuid) to authenticated;
