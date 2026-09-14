-- =========================================================
-- BANGLA DUB HUB (BDH) — Portfolio v4 Supabase setup
-- Run this ONCE in Supabase Dashboard → SQL Editor.
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id bigint primary key default 1 check (id = 1),
  tagline text not null default 'A creative home for Bengali fan dubbing, voice artists and storytellers.',
  facebook text not null default 'https://www.facebook.com/',
  logo_url text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'BDH Admin',
  role text not null default 'Admin',
  bio text not null default '',
  photo_url text not null default '',
  facebook text not null default '',
  instagram text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Voice Artist',
  bio text not null default '',
  photo_url text not null default '',
  facebook text not null default '',
  instagram text not null default '',
  videos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Anime • Bengali Fan Dub',
  url text not null default '',
  created_at timestamptz not null default now()
);

-- First account created through the website becomes the first BDH admin.
-- After one admin exists, later sign-ups are NOT made admins.
create or replace function public.create_first_bdh_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins) then
    insert into public.admins (id, name, role, bio)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1), 'BDH Admin'),
      'Founder / Admin',
      'BDH Administrator'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bdh on auth.users;
create trigger on_auth_user_created_bdh
after insert on auth.users
for each row execute procedure public.create_first_bdh_admin();

create or replace function public.is_bdh_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

alter table public.site_settings enable row level security;
alter table public.admins enable row level security;
alter table public.members enable row level security;
alter table public.works enable row level security;

drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings" on public.site_settings for select using (true);
drop policy if exists "admins write site settings" on public.site_settings;
create policy "admins write site settings" on public.site_settings for all using (public.is_bdh_admin()) with check (public.is_bdh_admin());

drop policy if exists "public read admins" on public.admins;
create policy "public read admins" on public.admins for select using (true);
drop policy if exists "admins write admins" on public.admins;
create policy "admins write admins" on public.admins for all using (public.is_bdh_admin()) with check (public.is_bdh_admin());

drop policy if exists "public read members" on public.members;
create policy "public read members" on public.members for select using (true);
drop policy if exists "admins write members" on public.members;
create policy "admins write members" on public.members for all using (public.is_bdh_admin()) with check (public.is_bdh_admin());

drop policy if exists "public read works" on public.works;
create policy "public read works" on public.works for select using (true);
drop policy if exists "admins write works" on public.works;
create policy "admins write works" on public.works for all using (public.is_bdh_admin()) with check (public.is_bdh_admin());

-- Storage bucket for BDH logo/member/admin photos.
insert into storage.buckets (id, name, public) values ('bdh-assets','bdh-assets',true)
on conflict (id) do update set public=true;

drop policy if exists "public read bdh assets" on storage.objects;
create policy "public read bdh assets" on storage.objects for select using (bucket_id='bdh-assets');
drop policy if exists "admins upload bdh assets" on storage.objects;
create policy "admins upload bdh assets" on storage.objects for insert with check (bucket_id='bdh-assets' and public.is_bdh_admin());
drop policy if exists "admins update bdh assets" on storage.objects;
create policy "admins update bdh assets" on storage.objects for update using (bucket_id='bdh-assets' and public.is_bdh_admin()) with check (bucket_id='bdh-assets' and public.is_bdh_admin());
drop policy if exists "admins delete bdh assets" on storage.objects;
create policy "admins delete bdh assets" on storage.objects for delete using (bucket_id='bdh-assets' and public.is_bdh_admin());

-- Optional starter records. Delete these INSERTs if you want an empty site.
insert into public.members (name,role,bio) select 'Member Name 01','Voice Artist','BDH member.' where not exists (select 1 from public.members);
insert into public.members (name,role,bio) select 'Member Name 02','Voice Artist','BDH member.' where (select count(*) from public.members)=1;
insert into public.works (title,type) select 'Featured Dubbing Project','Anime • Bengali Fan Dub' where not exists (select 1 from public.works);

-- IMPORTANT:
-- Supabase Dashboard → Authentication → Providers → Email
-- For easiest first-time setup, you may turn OFF "Confirm email" while creating
-- the first admin. You can turn it back ON afterwards if desired.
