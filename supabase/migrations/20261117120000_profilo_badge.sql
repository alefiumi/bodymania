-- BodyMania: profilo modificabile (foto, ruolo, presentazione) ed elenco dei badge.
-- Si applica una volta dopo il primo file: SQL Editor → incolla tutto il file → Run.

-- ---------- profilo ----------
-- avatar: foto piccola (128×128 JPEG) salvata come testo data:image/…, così si vede anche offline e non serve uno Storage.
-- profile_at: ultima modifica di nome, foto, ruolo e presentazione (all'accesso vince la modifica più recente
-- tra dispositivo e server; updated_at invece cambia a ogni sincronizzazione).
alter table public.profiles
  add column if not exists avatar     text check (avatar is null or (avatar like 'data:image/%' and length(avatar) <= 60000)),
  add column if not exists role       text check (role is null or char_length(role) <= 40),
  add column if not exists bio        text check (bio is null or char_length(bio) <= 160),
  add column if not exists profile_at timestamptz;

-- le classifiche mostrano anche la foto
create or replace view public.leaderboard with (security_invoker = true) as
  select id, username, xp, streak, avatar from public.profiles where username is not null;

-- ---------- badge ----------
-- Calcolati sul dispositivo (js/badges.js): stessi id e testi. criteria = descrizione del requisito, image = emoji.
insert into public.badge_classes (id, name, description, criteria, image) values
  ('primo', 'Primo passo', 'Finisci la prima partita', 'Finisci la prima partita', '🎬'),
  ('g10', 'Allenamento', 'Finisci 10 partite', 'Finisci 10 partite', '🎮'),
  ('g100', 'Instancabile', 'Finisci 100 partite', 'Finisci 100 partite', '🏋️'),
  ('perfetto', 'Round perfetto', 'Rispondi giusto a tutte le domande di un round', 'Rispondi giusto a tutte le domande di un round', '💯'),
  ('perfetti10', 'Cecchino', 'Fai 10 round perfetti', 'Fai 10 round perfetti', '🎯'),
  ('s3', 'Tre di fila', 'Gioca 3 giorni di seguito', 'Gioca 3 giorni di seguito', '🔥'),
  ('s7', 'Una settimana', 'Gioca 7 giorni di seguito', 'Gioca 7 giorni di seguito', '📅'),
  ('s30', 'Un mese intero', 'Gioca 30 giorni di seguito', 'Gioca 30 giorni di seguito', '🗓️'),
  ('xp500', '500 XP', 'Raccogli 500 XP', 'Raccogli 500 XP', '⭐'),
  ('xp2000', '2000 XP', 'Raccogli 2000 XP', 'Raccogli 2000 XP', '🌟'),
  ('xp10000', '10000 XP', 'Raccogli 10000 XP', 'Raccogli 10000 XP', '💫'),
  ('ok100', 'Cento risposte giuste', 'Dai 100 risposte giuste', 'Dai 100 risposte giuste', '✅'),
  ('ok1000', 'Mille risposte giuste', 'Dai 1000 risposte giuste', 'Dai 1000 risposte giuste', '🧠'),
  ('m10', 'Dieci in oro', 'Porta 10 strutture alla maestria piena', 'Porta 10 strutture alla maestria piena', '🥉'),
  ('m50', 'Cinquanta in oro', 'Porta 50 strutture alla maestria piena', 'Porta 50 strutture alla maestria piena', '🥈'),
  ('m150', 'Centocinquanta in oro', 'Porta 150 strutture alla maestria piena', 'Porta 150 strutture alla maestria piena', '🥇'),
  ('d3', 'In tre dimensioni', 'Finisci una partita sul modello 3D', 'Finisci una partita sul modello 3D', '🧍'),
  ('d3tutti', 'Esploratore 3D', 'Gioca tutte e quattro le sfide sul modello 3D', 'Gioca tutte e quattro le sfide sul modello 3D', '🌐'),
  ('casi5', 'Occhio clinico', 'Finisci 5 casi clinici', 'Finisci 5 casi clinici', '🩺'),
  ('moduli', 'Giramondo', 'Gioca in tutti i moduli: corpo, cervello laterale e sagittale, 3D', 'Gioca in tutti i moduli: corpo, cervello laterale e sagittale, 3D', '🗺️'),
  ('corpo', 'sag', '3d', '3d', 'lat')
on conflict (id) do update set name = excluded.name, description = excluded.description,
  criteria = excluded.criteria, image = excluded.image;
