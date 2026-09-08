-- ClubMatch Cloud v0.8 - provider-neutral video analysis readiness
-- Intentionally does not create a Storage bucket: current storage provider may be Supabase, S3 or Stannet.

create table if not exists public.match_videos (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  match_id uuid not null,
  storage_provider text not null default 'external' check (storage_provider in ('supabase','s3','stannet','external')),
  bucket_name text,
  object_key text not null,
  original_filename text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  width_px integer check (width_px is null or width_px > 0),
  height_px integer check (height_px is null or height_px > 0),
  fps numeric(8,3) check (fps is null or fps > 0),
  codec text,
  camera_angle text,
  checksum_sha256 text,
  upload_status text not null default 'pending' check (upload_status in ('pending','uploading','uploaded','failed','deleted')),
  retention_until timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(storage_provider,bucket_name,object_key),
  foreign key (match_id,club_id) references public.matches(id,club_id) on delete cascade
);

create table if not exists public.video_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  match_video_id uuid not null references public.match_videos(id) on delete cascade,
  pipeline_version text not null default 'v0',
  status text not null default 'queued' check (status in ('queued','claimed','processing','review','completed','failed','cancelled')),
  requested_outputs jsonb not null default '{}'::jsonb,
  progress_pct numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  worker_provider text,
  worker_job_ref text,
  attempt integer not null default 0 check (attempt >= 0),
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (club_id) references public.clubs(id) on delete cascade
);

create table if not exists public.video_analysis_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  match_id uuid not null,
  match_video_id uuid not null references public.match_videos(id) on delete cascade,
  analysis_job_id uuid references public.video_analysis_jobs(id) on delete cascade,
  event_type text not null,
  video_start_ms bigint not null check (video_start_ms >= 0),
  video_end_ms bigint check (video_end_ms is null or video_end_ms >= video_start_ms),
  subject_player_id uuid references public.players(id) on delete set null,
  related_player_id uuid references public.players(id) on delete set null,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  start_x numeric(6,3) check (start_x is null or start_x between 0 and 100),
  start_y numeric(6,3) check (start_y is null or start_y between 0 and 100),
  end_x numeric(6,3) check (end_x is null or end_x between 0 and 100),
  end_y numeric(6,3) check (end_y is null or end_y between 0 and 100),
  linked_match_event_id uuid references public.match_events(id) on delete set null,
  review_status text not null default 'candidate' check (review_status in ('candidate','accepted','rejected','corrected')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (match_id,club_id) references public.matches(id,club_id) on delete cascade
);

create index if not exists match_videos_match_idx on public.match_videos(match_id,created_at desc);
create index if not exists match_videos_club_idx on public.match_videos(club_id,created_at desc);
create index if not exists video_analysis_jobs_video_idx on public.video_analysis_jobs(match_video_id,status,queued_at);
create index if not exists video_analysis_jobs_status_idx on public.video_analysis_jobs(status,queued_at);
create index if not exists video_analysis_events_match_idx on public.video_analysis_events(match_id,video_start_ms);
create index if not exists video_analysis_events_video_idx on public.video_analysis_events(match_video_id,video_start_ms);
create index if not exists video_analysis_events_review_idx on public.video_analysis_events(review_status,confidence desc);

alter table public.match_videos enable row level security;
alter table public.video_analysis_jobs enable row level security;
alter table public.video_analysis_events enable row level security;

drop policy if exists match_videos_select_v08 on public.match_videos;
create policy match_videos_select_v08 on public.match_videos for select to authenticated using ((select private.has_club_access(club_id)));
drop policy if exists match_videos_insert_v08 on public.match_videos;
create policy match_videos_insert_v08 on public.match_videos for insert to authenticated with check ((select private.has_club_access(club_id)));
drop policy if exists match_videos_update_v08 on public.match_videos;
create policy match_videos_update_v08 on public.match_videos for update to authenticated using ((select private.has_club_access(club_id))) with check ((select private.has_club_access(club_id)));
drop policy if exists match_videos_delete_v08 on public.match_videos;
create policy match_videos_delete_v08 on public.match_videos for delete to authenticated using ((select private.can_manage_club(club_id)));

drop policy if exists video_analysis_jobs_select_v08 on public.video_analysis_jobs;
create policy video_analysis_jobs_select_v08 on public.video_analysis_jobs for select to authenticated using ((select private.has_club_access(club_id)));
drop policy if exists video_analysis_jobs_insert_v08 on public.video_analysis_jobs;
create policy video_analysis_jobs_insert_v08 on public.video_analysis_jobs for insert to authenticated with check ((select private.has_club_access(club_id)));
drop policy if exists video_analysis_jobs_update_v08 on public.video_analysis_jobs;
create policy video_analysis_jobs_update_v08 on public.video_analysis_jobs for update to authenticated using ((select private.has_club_access(club_id))) with check ((select private.has_club_access(club_id)));
drop policy if exists video_analysis_jobs_delete_v08 on public.video_analysis_jobs;
create policy video_analysis_jobs_delete_v08 on public.video_analysis_jobs for delete to authenticated using ((select private.can_manage_club(club_id)));

drop policy if exists video_analysis_events_select_v08 on public.video_analysis_events;
create policy video_analysis_events_select_v08 on public.video_analysis_events for select to authenticated using ((select private.has_club_access(club_id)));
drop policy if exists video_analysis_events_insert_v08 on public.video_analysis_events;
create policy video_analysis_events_insert_v08 on public.video_analysis_events for insert to authenticated with check ((select private.has_club_access(club_id)));
drop policy if exists video_analysis_events_update_v08 on public.video_analysis_events;
create policy video_analysis_events_update_v08 on public.video_analysis_events for update to authenticated using ((select private.has_club_access(club_id))) with check ((select private.has_club_access(club_id)));
drop policy if exists video_analysis_events_delete_v08 on public.video_analysis_events;
create policy video_analysis_events_delete_v08 on public.video_analysis_events for delete to authenticated using ((select private.can_manage_club(club_id)));

grant select,insert,update,delete on public.match_videos to authenticated;
grant select,insert,update,delete on public.video_analysis_jobs to authenticated;
grant select,insert,update,delete on public.video_analysis_events to authenticated;
