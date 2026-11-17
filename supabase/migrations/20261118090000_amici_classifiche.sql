-- BodyMania: amici e classifiche (tutti gli iscritti e solo amici).
-- Si applica una volta dopo i primi due file: SQL Editor → incolla tutto il file → Run.

-- riga entrata per errore nell'elenco dei badge dal secondo file
delete from public.badge_classes where id = 'corpo'
  and not exists (select 1 from public.badge_assertions where badge_id = 'corpo');

-- ---------- amici ----------
-- una sola amicizia per coppia, in qualunque verso (A chiede a B e B chiede ad A sarebbero due righe)
create unique index if not exists friendships_coppia
  on public.friendships (least(user_id, friend_id), greatest(user_id, friend_id));

-- ---------- classifiche ----------
-- con la foto e la serie valida: chi non gioca da più di un giorno ha la serie a zero
-- (la serie salvata è quella dell'ultimo giorno giocato)
create or replace view public.leaderboard with (security_invoker = true) as
  select id, username, xp, avatar,
    case when last_day >= current_date - 1 then streak else 0 end as streak
  from public.profiles where username is not null;

drop view if exists public.leaderboard_friends;
create view public.leaderboard_friends with (security_invoker = true) as
  select p.id, p.username, p.xp, p.avatar,
    case when p.last_day >= current_date - 1 then p.streak else 0 end as streak
  from public.profiles p
  where p.username is not null and (
    p.id = auth.uid() or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.user_id = auth.uid() and f.friend_id = p.id) or (f.friend_id = auth.uid() and f.user_id = p.id))));

revoke all on public.leaderboard, public.leaderboard_friends from anon;
grant select on public.leaderboard, public.leaderboard_friends to authenticated;
