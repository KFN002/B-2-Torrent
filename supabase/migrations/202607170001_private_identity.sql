-- Private, user-scoped application data. Run against the self-hosted Supabase database.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  preferences jsonb not null default '{}'::jsonb,
  constraint preferences_object check (jsonb_typeof(preferences) = 'object'),
  constraint preferences_size check (pg_column_size(preferences) <= 65536)
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create or replace function public.create_private_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_private_profile();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-vault', 'private-vault', false, 52428800, array['application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = 52428800,
  allowed_mime_types = array['application/octet-stream'];

alter table storage.objects enable row level security;

drop policy if exists "vault_select_own" on storage.objects;
drop policy if exists "vault_insert_own" on storage.objects;
drop policy if exists "vault_update_own" on storage.objects;
drop policy if exists "vault_delete_own" on storage.objects;
create policy "vault_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'private-vault' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "vault_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-vault' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "vault_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'private-vault' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'private-vault' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "vault_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'private-vault' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Abandoned identities must be removed through a privileged maintenance worker
-- that calls the Storage API before Auth Admin deletion. Deleting storage.objects
-- rows directly can leave orphaned files in the local object backend.
