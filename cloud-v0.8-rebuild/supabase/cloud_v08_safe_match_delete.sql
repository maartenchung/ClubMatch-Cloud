create or replace function public.delete_match_v08(
  p_match_id uuid,
  p_confirmation text
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
  v_opponent text;
  v_match_date date;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_match_id is null then raise exception 'match_id is required'; end if;
  if p_confirmation is distinct from 'DELETE' then raise exception 'Explicit DELETE confirmation is required'; end if;

  select m.club_id,m.status,m.opponent_name,m.match_date
    into v_club_id,v_status,v_opponent,v_match_date
  from public.matches m where m.id=p_match_id for update;
  if not found then raise exception 'Match not found or inaccessible'; end if;
  if not (select private.can_manage_club(v_club_id)) then raise exception 'Club administrator permission is required to delete a match'; end if;
  if v_status in ('live','halftime') then raise exception 'Active matches must be finished before deletion'; end if;

  delete from public.matches m where m.id=p_match_id and m.club_id=v_club_id;
  if not found then raise exception 'Match deletion failed'; end if;

  return jsonb_build_object('ok',true,'deleted_match_id',p_match_id,'status_before',v_status,'opponent_name',v_opponent,'match_date',v_match_date);
end;
$function$;

revoke all on function public.delete_match_v08(uuid,text) from public;
revoke all on function public.delete_match_v08(uuid,text) from anon;
grant execute on function public.delete_match_v08(uuid,text) to authenticated;
