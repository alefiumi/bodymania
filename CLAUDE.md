# BodyMania – impara l'anatomia giocando

App web gamificata per studiare anatomia muscolo-scheletrica e neurologia di base
(pubblico: fisioterapisti e studenti). Uso previsto: l'autore e i suoi amici, tutto su piani gratuiti.

## Decisioni prese
- **Frontend**: web app statica su GitHub Pages, repo `alefiumi/bodymania`
  (indirizzo `alefiumi.github.io/bodymania`). Niente framework finché non serve.
- **Backend**: Supabase (Postgres + login). Il frontend parla direttamente con Supabase;
  ogni tabella ha le regole di accesso per riga (RLS) attive.
- **Offline-first (PWA)**: l'app si installa e si gioca senza rete. Le partite finite vanno in una
  coda locale e si inviano quando torna la connessione. Contenuti e classifiche si aggiornano online.
- **Badge e trofei**: salvati nel DB con struttura compatibile con Open Badges
  (emittente, classe del badge, assegnazione). La firma Open Badges 3.0 è rimandata.
- **Setup minimale**: `requisiti.txt` + `setup.sh`. Non aggiungere altri file di configurazione
  o documentazione senza motivo.

## Stato attuale
Prototipo diviso in:
- `index.html` (solo struttura), `css/style.css`.
- `js/`: moduli ES. `main.js` avvia, `content.js` carica i JSON, `shapes.js` trasforma le forme in SVG,
  `state.js` (stato condiviso `app`, salvataggio), `figure.js` (figura, zoom, pan), `explore.js`,
  `game.js`, `puzzle.js`, `progress.js`, `ui.js` (cambio di modulo e tab, clic).
- `content/`: `index.json` (versione globale, ordine dei moduli), `corpo.json`, `lat.json`, `sag.json`,
  `neuro-strutture.json` (testi in comune tra `lat` e `sag`), `nervi-cranici.json`. Ogni file ha `version`.
  Le forme sono descrizioni come `{"poly":"M…"}`, `{"ln":[x1,y1,x2,y2,spessore]}`, `{"stack":[x,y,w,h,n]}`
  (tipi in `js/shapes.js`). Quando cambi un contenuto, aumenta la `version` del file e quella di `index.json`.
- Serve un server locale (`npx serve .`): con il doppio clic su `index.html` (`file://`) moduli e JSON non si caricano.

Contenuto del gioco:
- Moduli: `corpo` (22 gruppi di ossa, 26 muscoli con origine e inserzione), `lat` e `sag`
  (cervello in vista laterale e sagittale), 12 nervi cranici.
- Modalità: Ricomponi (puzzle con trascinamento), Tendine-ponte, Caso clinico (indizi progressivi),
  Trova la struttura, Origine e inserzione, Funzione → struttura, Nervi cranici, Misto.
- Zoom e pan sulla figura (pulsanti, pizzico, rotella), XP, livelli, serie di giorni, maestria per struttura.
- Salvataggio solo locale: `localStorage`, chiave `bodymania-v1`.

Mai provato su un dispositivo reale dall'AI: il tocco e il trascinamento li ha provati solo l'autore.

## Da fare, in ordine
1. ~~Dividere `index.html` in contenuti JSON versionati e moduli JS~~ (fatto).
2. PWA: `manifest.webmanifest`, service worker che mette in cache app e contenuti,
   controllo delle versioni dei contenuti quando c'è rete.
3. Supabase: schema e regole in file SQL versionati (`supabase/migrations/`).
4. Registrazione e login (il primo accesso richiede la rete), pagina profilo.
5. Sincronizzazione: coda locale in IndexedDB, invio idempotente (ogni partita ha un id
   generato sul dispositivo), unione dei progressi locali con quelli del server.
6. Amici (richiesta, accettazione) e due classifiche: tutti gli iscritti e solo amici.
7. Badge, trofei e achievement mostrati nel profilo.
8. Pubblicazione su GitHub Pages.

Idee rimandate: modello 3D (serve un modello con licenza adatta, es. Z-Anatomy), livello tendini
e legamenti, puzzle a strati, sfida a tempo, duello 1 contro 1, sfida del giorno, altre ghiandole.

## Modello dati (bozza)
- `profiles` (id = utente, username, xp, serie di giorni)
- `friendships` (user_id, friend_id, stato: in attesa / accettata)
- `game_results` (id generato dal client, user_id, modulo, modalità, punteggio, totale, xp, giocata_il)
- `mastery` (user_id, item_id, livello 0–3, aggiornato_il)
- `badge_classes` (id, nome, descrizione, criterio, immagine)
- `badge_assertions` (id, user_id, badge_id, assegnato_il)
- Viste: classifica globale e classifica amici.

## Vincoli
- Nel frontend va solo la chiave pubblica di Supabase. La chiave `service_role` non entra mai
  nel repository né nel codice del browser.
- I punteggi sono calcolati sul dispositivo, quindi falsificabili: accettato per l'uso tra amici.
- Testi anatomici, casi clinici e disegni sono stati scritti dall'AI a memoria: sono da verificare
  su un atlante o con un professionista. Non presentarli come fonte validata.
- Lingua dell'interfaccia e dei contenuti: italiano.
