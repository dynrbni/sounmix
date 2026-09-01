create extension if not exists pgcrypto;

create type public.music_platform as enum ('SPOTIFY', 'APPLE_MUSIC');
create type public.operation_status as enum ('PENDING', 'RUNNING', 'ANALYZING', 'MATCHING', 'TRANSFERRING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');
create type public.operation_type as enum ('TRANSFER', 'DUPLICATE_SCAN', 'DUPLICATE_REMOVE', 'MOVE_TRACKS', 'MERGE_PLAYLISTS');
create type public.match_status as enum ('MATCHED', 'LIKELY_MATCH', 'NEEDS_REVIEW', 'UNMATCHED', 'SKIPPED', 'FAILED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.music_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform public.music_platform not null,
  platform_user_id text,
  display_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.music_accounts(id) on delete cascade,
  platform public.music_platform not null,
  platform_playlist_id text not null,
  name text not null,
  description text,
  image_url text,
  track_count integer not null default 0 check (track_count >= 0),
  owner_name text,
  is_public boolean not null default false,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, platform_playlist_id)
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  spotify_id text,
  apple_music_id text,
  isrc text,
  title text not null,
  artist text not null,
  album text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  release_date date,
  explicit boolean not null default false,
  normalized_title text,
  normalized_artist text,
  normalized_album text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  platform_track_id text,
  position integer not null check (position >= 0),
  added_at timestamptz,
  created_at timestamptz not null default now(),
  unique (playlist_id, track_id, position)
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.operation_type not null,
  status public.operation_status not null default 'PENDING',
  source_platform public.music_platform,
  destination_platform public.music_platform,
  source_playlist_id uuid references public.playlists(id) on delete set null,
  destination_playlist_id uuid references public.playlists(id) on delete set null,
  total_tracks integer not null default 0 check (total_tracks >= 0),
  successful_tracks integer not null default 0 check (successful_tracks >= 0),
  failed_tracks integer not null default 0 check (failed_tracks >= 0),
  idempotency_key text,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.transfer_jobs (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique references public.operations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_platform public.music_platform not null,
  destination_platform public.music_platform not null,
  source_playlist_id uuid references public.playlists(id) on delete set null,
  destination_playlist_id uuid references public.playlists(id) on delete set null,
  status public.operation_status not null default 'PENDING',
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_total integer not null default 0 check (progress_total >= 0),
  matched_tracks integer not null default 0 check (matched_tracks >= 0),
  uncertain_tracks integer not null default 0 check (uncertain_tracks >= 0),
  unmatched_tracks integer not null default 0 check (unmatched_tracks >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_job_id uuid not null references public.transfer_jobs(id) on delete cascade,
  source_track_id uuid references public.tracks(id) on delete set null,
  destination_track_id uuid references public.tracks(id) on delete set null,
  status public.match_status not null default 'UNMATCHED',
  confidence_score integer check (confidence_score is null or confidence_score between 0 and 100),
  match_reason text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.duplicate_groups (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations(id) on delete cascade,
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  duplicate_reason text not null,
  created_at timestamptz not null default now()
);

create table public.duplicate_group_items (
  id uuid primary key default gen_random_uuid(),
  duplicate_group_id uuid not null references public.duplicate_groups(id) on delete cascade,
  playlist_track_id uuid not null references public.playlist_tracks(id) on delete cascade,
  keep boolean not null default false,
  created_at timestamptz not null default now(),
  unique (duplicate_group_id, playlist_track_id)
);

create index music_accounts_user_id_idx on public.music_accounts(user_id);
create index playlists_user_id_idx on public.playlists(user_id);
create index playlists_account_id_idx on public.playlists(account_id);
create index tracks_isrc_idx on public.tracks(isrc) where isrc is not null;
create index tracks_normalized_idx on public.tracks(normalized_artist, normalized_title);
create index playlist_tracks_playlist_id_idx on public.playlist_tracks(playlist_id);
create index operations_user_id_created_at_idx on public.operations(user_id, created_at desc);
create index transfer_jobs_user_id_idx on public.transfer_jobs(user_id);
create index transfer_items_job_id_idx on public.transfer_items(transfer_job_id);

alter table public.profiles enable row level security;
alter table public.music_accounts enable row level security;
alter table public.playlists enable row level security;
alter table public.tracks enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.operations enable row level security;
alter table public.transfer_jobs enable row level security;
alter table public.transfer_items enable row level security;
alter table public.duplicate_groups enable row level security;
alter table public.duplicate_group_items enable row level security;

create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can manage own music accounts" on public.music_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own playlists" on public.playlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read tracks through own playlists" on public.tracks for select using (exists (select 1 from public.playlist_tracks pt join public.playlists p on p.id = pt.playlist_id where pt.track_id = tracks.id and p.user_id = auth.uid()));
create policy "Users can manage tracks" on public.tracks for all using (true) with check (true);
create policy "Users can manage own playlist tracks" on public.playlist_tracks for all using (exists (select 1 from public.playlists p where p.id = playlist_tracks.playlist_id and p.user_id = auth.uid())) with check (exists (select 1 from public.playlists p where p.id = playlist_tracks.playlist_id and p.user_id = auth.uid()));
create policy "Users can manage own operations" on public.operations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own transfer jobs" on public.transfer_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own transfer items" on public.transfer_items for all using (exists (select 1 from public.transfer_jobs j where j.id = transfer_items.transfer_job_id and j.user_id = auth.uid())) with check (exists (select 1 from public.transfer_jobs j where j.id = transfer_items.transfer_job_id and j.user_id = auth.uid()));
create policy "Users can manage own duplicate groups" on public.duplicate_groups for all using (exists (select 1 from public.operations o where o.id = duplicate_groups.operation_id and o.user_id = auth.uid())) with check (exists (select 1 from public.operations o where o.id = duplicate_groups.operation_id and o.user_id = auth.uid()));
create policy "Users can manage own duplicate group items" on public.duplicate_group_items for all using (exists (select 1 from public.duplicate_groups g join public.operations o on o.id = g.operation_id where g.id = duplicate_group_items.duplicate_group_id and o.user_id = auth.uid())) with check (exists (select 1 from public.duplicate_groups g join public.operations o on o.id = g.operation_id where g.id = duplicate_group_items.duplicate_group_id and o.user_id = auth.uid()));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger music_accounts_set_updated_at before update on public.music_accounts for each row execute function public.set_updated_at();
create trigger playlists_set_updated_at before update on public.playlists for each row execute function public.set_updated_at();
create trigger tracks_set_updated_at before update on public.tracks for each row execute function public.set_updated_at();
create trigger operations_set_updated_at before update on public.operations for each row execute function public.set_updated_at();
create trigger transfer_jobs_set_updated_at before update on public.transfer_jobs for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
