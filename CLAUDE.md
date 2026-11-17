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
  `game.js`, `puzzle.js`, `progress.js`, `ui.js` (cambio di modulo e tab, clic),
  `install.js` (pannello "Installa e usa offline": istruzioni per browser, stato della copia offline).
- Figura: barra `.tbar` sopra il disegno (moduli a sinistra, zoom a destra), mai sovrapposta; l'svg occupa
  tutta la larghezza e mantiene le proporzioni (con lo zoom si vede anche ciò che sta ai lati).
  Zoom: pulsanti, rotella, pizzico a due dita con eventi touch (su iPhone gli eventi pointer a due dita
  vengono annullati dal sistema); un dito sposta la figura quando è ingrandita.
- Puzzle: `slotAt(x,y,id)` in `figure.js` sceglie il posto vuoto più vicino entro `SLOT_PX` (28 px), anche se
  coperto da altre ossa, con precedenza al pezzo in mano; altrimenti l'osso sotto il dito (errore).
  Il pezzo trascinato è disegnato alla scala della figura, con il centro 42 px sopra il dito.
- Spunta verde in alto a destra (`#off`) quando la copia offline è pronta; il pulsante "Installa l'app"
  in Esplora compare solo fuori dall'app installata.
- `content/`: `index.json` (versione globale, ordine dei moduli), `corpo.json`, `lat.json`, `sag.json`,
  `neuro-strutture.json` (testi in comune tra `lat` e `sag`), `nervi-cranici.json`. Ogni file ha `version`.
  Le forme sono descrizioni come `{"poly":"M…"}`, `{"ln":[x1,y1,x2,y2,spessore]}`, `{"stack":[x,y,w,h,n]}`
  (tipi in `js/shapes.js`). Quando cambi un contenuto, aumenta la `version` del file e quella di `index.json`.
- Serve un server locale (`npx serve .`): con il doppio clic su `index.html` (`file://`) moduli e JSON non si caricano.
- PWA: `manifest.webmanifest`, icone in `icons/` (PNG generate da uno script, non nel repo), `sw.js`.
  Il service worker copia in cache l'elenco `APP_FILES` all'installazione e serve l'app dalla cache.
  **Quando modifichi o aggiungi un file dell'app, aumenta `APP_VERSION` in `sw.js`** (e aggiorna `APP_FILES`
  se aggiungi o togli file), altrimenti chi ha l'app installata continua a usare la versione vecchia.
  I contenuti stanno in una cache separata per versione: a ogni avvio con rete il service worker legge
  `content/index.json` e, se `version` è cambiata, scarica tutto il set (moduli, `nc` e `files`) e lo usa
  dall'apertura successiva, mostrando un avviso. `content.js` chiede i file con `?v=<versione>` così una pagina
  aperta non mescola versioni diverse. Un file di contenuto nuovo che non è un modulo va elencato in `files`.
- Durante lo sviluppo il service worker serve i file vecchi finché `APP_VERSION` non cambia: per vedere subito
  le modifiche usa una finestra in incognito, oppure "Update on reload" negli strumenti per sviluppatori.
- Su iPhone l'app installata può avere una memoria separata da Safari: va aperta dall'icona una volta con la
  rete. L'app avvisa con "Pronta: da ora funziona anche senza connessione" e lo stato è nel pannello di installazione.
- Browser: iPhone con Safari, Chrome, Edge e Firefox (iOS 16.4+, voce "Aggiungi alla schermata Home");
  Android con Chrome, Firefox, Samsung Internet, Edge. Provati dall'AI solo Chrome desktop ed emulazione mobile.

Contenuto del gioco:
- Moduli: `corpo` (22 gruppi di ossa, 26 muscoli con origine e inserzione), `lat` e `sag`
  (cervello in vista laterale e sagittale), 12 nervi cranici.
- Modalità: Ricomponi (puzzle con trascinamento), Tendine-ponte, Caso clinico (indizi progressivi),
  Trova la struttura, Origine e inserzione, Funzione → struttura, Nervi cranici, Misto.
- Zoom e pan sulla figura (pulsanti, pizzico, rotella), XP, livelli, serie di giorni, maestria per struttura.
- Salvataggio solo locale: `localStorage`, chiave `bodymania-v1`.

Mai provato su un dispositivo reale dall'AI: il tocco e il trascinamento li ha provati solo l'autore.

## Prototipo 3D (in valutazione)
`proto3d/` è una pagina di prova separata dall'app: un atlante 3D ruotabile in stile cartoon, a strati
sovrapponibili (three.js in `proto3d/vendor/`, logica in `proto3d/atlante.js`).

Fonte: **Z-Anatomy** (CC BY-SA 4.0, derivato da BodyParts3D), scelto al posto di BodyParts3D perché ha nello
stesso modello coerente ossa, muscoli completi, legamenti, sistema nervoso centrale e periferico, vasi, visceri,
le aree di origine e inserzione dei muscoli e le etichette dei reperi già posizionate. Nomi italiani e latini
dalla Terminologia Anatomica 2 (`build/TA2.csv`). Crediti e licenze in `proto3d/CREDITI.md`: i file derivati
vanno distribuiti con la stessa licenza CC BY-SA 4.0. Rene e orecchio interno (licenza non commerciale nella
fonte) sono esclusi.

File (ogni strato si scarica solo quando viene acceso; `ossa.glb` all'avvio):
- `ossa.glb` (277 parti), `muscoli.glb` (464 muscoli più 205 fasce, tendini e borse), `legamenti.glb`,
  `inserzioni.glb` (705 aree di origine e inserzione), `encefalo.glb`, `midollo.glb`, `nervi.glb`,
  `meningi.glb`, `sensi.glb` (occhio e orecchio), `vasi.glb`, `visceri.glb`. In tutto circa 8 MB.
- `dati.json`: `names` (nome inglese senza lato → [italiano, latino]), `objs` (nome della parte → [strato,
  materiale della fonte, gruppo]), `lm` (606 reperi: nome, parte a cui appartiene, punto, direzione verso fuori),
  `mus` (208 muscoli per radice del nome: parti, aree di origine `o` e inserzione `e`, gruppo funzionale,
  e `card` con i testi scritti a mano per 57 muscoli).
- Nei nomi delle parti il suffisso indica il lato (`.r` destro, `.l` sinistro) e, per le aree, `.o…`/`.e…`
  origine/inserzione. three.js toglie punti e spazi da `mesh.name`: il nome vero è in `mesh.userData.name`.
- Assi: Y in alto, +Z davanti, −X lato destro del corpo. Il modello è simmetrico: i reperi di destra
  valgono a sinistra cambiando segno alla X.

Come si rigenera (serve Blender; i passaggi stanno in `proto3d/build/`):
1. `Blender -b Startup.blend --python build/za_export.py -- <cartella>` esporta gli strati grezzi e `za_meta.json`
   (`Startup.blend` è dentro `Z-Anatomy.zip` del repository Z-Anatomy/Models-of-human-anatomy).
2. `node build/za_optimize.mjs <cartella> <uscita>` semplifica e comprime (pacchetti npm `@gltf-transform/*`, `meshoptimizer`).
3. `python3 build/za_dati.py <cartella>/za_meta.json proto3d/dati.json` unisce metadati, TA2, `build/schede.json`
   e le descrizioni di `build/descrizioni.py` (chiave `desc`). Per aggiornare solo le descrizioni senza Blender:
   `python3 build/descrizioni.py proto3d/dati.json`.

Funzioni dell'atlante (in `atlante.js`):
- Muscolo: tre viste, "Forma e aree", "Punti e linee" (pallino blu al centro di ogni area di origine, arancione
  per l'inserzione, linea viola che li unisce, sempre in primo piano) ed "Entrambe"; reperi della fonte entro 2,5 cm dai punti.
- Gruppi (`COMBO`): zampa d'oca, ischiocrurali, cuffia dei rotatori, tricipite della sura, quadricipite.
- Ricerca senza accenti, con abbreviazioni e nomi comuni (`SYN`: SIAS, SIPS, zampa d'oca, Broca…).
- Encefalo (pulsante 🧠): sezioni assiale, coronale e sagittale con cursore (piano di taglio su tutta la scena;
  durante il taglio il contorno è spento e le superfici sono a due facce) e scomposizione in 9 strati (`ST`), dalla
  dura madre ai ventricoli. Dura madre e aracnoide craniche non sono nella fonte: `makeShells()` le genera
  avvolgendo la corteccia, forma schematica dichiarata nel pannello.

Cosa viene dalla fonte e cosa no: forme, posizioni dei reperi, aree di origine e inserzione e nomi vengono
dalla fonte. Scritti dall'AI a memoria, da verificare su un atlante: i testi dei muscoli in `build/schede.json`
(57 muscoli; per gli altri 151 mancano), le descrizioni di `build/descrizioni.py` (tutte le ossa, 341 reperi su 606,
quasi tutte le strutture dell'encefalo) e i testi di gruppi e strati in `atlante.js`.
Non c'è ancora: descrizione degli altri 265 reperi (soprattutto cranio, laringe, orecchio), giochi sul modello 3D.

Requisiti dell'autore per il 3D (16/11/2026):
- Fluidità: 60 fps fissi su iPhone 15 con il solo scheletro della prima versione. Con più strati accesi
  non è ancora stata misurata sul telefono.
- Strati sovrapponibili, come nei software di visualizzazione anatomica: scheletro, muscoli con la forma vera,
  cervello con le sue aree, sistema nervoso, ciascuno da accendere o spegnere sopra gli altri.
- Precisione scientifica in ogni modalità di gioco: l'app serve per studiare e passare gli esami.

## Da fare, in ordine
1. ~~Dividere `index.html` in contenuti JSON versionati e moduli JS~~ (fatto).
2. ~~PWA: manifest, service worker con cache di app e contenuti, controllo delle versioni~~ (fatto;
   installazione su telefono vero ancora da provare).
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
