-- BodyMania: schema iniziale e regole di accesso per riga (RLS).
-- Si applica una volta dal pannello di Supabase: SQL Editor → incolla tutto il file → Run.
-- Chi gioca senza account non tocca mai il database: i suoi progressi restano solo sul dispositivo.

-- ---------- profili ----------
-- Uno per utente, creato in automatico alla registrazione (trigger più sotto).
-- XP e serie sono calcolati sul dispositivo (falsificabili: accettato per l'uso tra amici).
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique check (username ~ '^[A-Za-z0-9_.]{3,20}$'),
  xp          integer not null default 0 check (xp >= 0),
  streak      integer not null default 0 check (streak >= 0),
  last_day    date,
  ok          integer not null default 0,
  ko          integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
-- tutti gli iscritti vedono nome, XP e serie degli altri (servono per classifiche e ricerca amici)
create policy "profili visibili agli iscritti" on public.profiles
  for select to authenticated using (true);
create policy "ognuno modifica il proprio profilo" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- profilo vuoto alla registrazione (il nome utente si sceglie dopo, nell'app)
create function public.nuovo_profilo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;
create trigger nuovo_profilo after insert on auth.users
  for each row execute function public.nuovo_profilo();

-- ---------- partite finite ----------
-- L'id è generato sul dispositivo: reinviare la stessa partita non la duplica.
create table public.game_results (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references public.profiles on delete cascade,
  module     text not null,
  mode       text not null,
  score      integer not null check (score >= 0),
  total      integer not null check (total >= 0),
  xp         integer not null default 0 check (xp >= 0),
  played_at  timestamptz not null
);
create index on public.game_results (user_id, played_at desc);
alter table public.game_results enable row level security;
create policy "ognuno vede le proprie partite" on public.game_results
  for select to authenticated using (user_id = auth.uid());
create policy "ognuno registra le proprie partite" on public.game_results
  for insert to authenticated with check (user_id = auth.uid());

-- ---------- maestria per struttura (0–3) ----------
create table public.mastery (
  user_id     uuid not null default auth.uid() references public.profiles on delete cascade,
  item_id     text not null,
  level       smallint not null check (level between 0 and 3),
  updated_at  timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.mastery enable row level security;
create policy "ognuno legge la propria maestria" on public.mastery
  for select to authenticated using (user_id = auth.uid());
create policy "ognuno scrive la propria maestria" on public.mastery
  for insert to authenticated with check (user_id = auth.uid());
create policy "ognuno aggiorna la propria maestria" on public.mastery
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- amici ----------
-- user_id chiede l'amicizia a friend_id; friend_id accetta (status = 'accepted'); uno dei due può toglierla.
create table public.friendships (
  user_id     uuid not null references public.profiles on delete cascade,
  friend_id   uuid not null references public.profiles on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friendships enable row level security;
create policy "amicizie visibili ai due" on public.friendships
  for select to authenticated using (auth.uid() in (user_id, friend_id));
create policy "richiesta solo a proprio nome" on public.friendships
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "accetta solo chi riceve" on public.friendships
  for update to authenticated using (friend_id = auth.uid()) with check (friend_id = auth.uid() and status = 'accepted');
create policy "uno dei due la toglie" on public.friendships
  for delete to authenticated using (auth.uid() in (user_id, friend_id));

-- ---------- badge (struttura compatibile con Open Badges: emittente, classe, assegnazione) ----------
create table public.badge_classes (
  id           text primary key,
  name         text not null,
  description  text not null,
  criteria     text not null,
  image        text
);
alter table public.badge_classes enable row level security;
create policy "badge visibili a tutti" on public.badge_classes
  for select to anon, authenticated using (true);

create table public.badge_assertions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles on delete cascade,
  badge_id    text not null references public.badge_classes,
  issued_at   timestamptz not null default now(),
  unique (user_id, badge_id)
);
alter table public.badge_assertions enable row level security;
create policy "badge assegnati visibili agli iscritti" on public.badge_assertions
  for select to authenticated using (true);
create policy "ognuno registra i propri badge" on public.badge_assertions
  for insert to authenticated with check (user_id = auth.uid());

-- ---------- classifiche ----------
-- Le viste usano i permessi di chi le legge (security_invoker): valgono le regole qui sopra.
create view public.leaderboard with (security_invoker = true) as
  select id, username, xp, streak from public.profiles where username is not null;

create view public.leaderboard_friends with (security_invoker = true) as
  select p.id, p.username, p.xp, p.streak
  from public.profiles p
  where p.username is not null and (
    p.id = auth.uid() or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.user_id = auth.uid() and f.friend_id = p.id) or (f.friend_id = auth.uid() and f.user_id = p.id))));

-- ---------- permessi ----------
revoke all on public.profiles, public.game_results, public.mastery, public.friendships,
  public.badge_classes, public.badge_assertions, public.leaderboard, public.leaderboard_friends from anon;
grant select on public.badge_classes to anon;
grant select, update on public.profiles to authenticated;
grant select, insert on public.game_results to authenticated;
grant select, insert, update on public.mastery to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select on public.badge_classes to authenticated;
grant select, insert on public.badge_assertions to authenticated;
grant select on public.leaderboard, public.leaderboard_friends to authenticated;
