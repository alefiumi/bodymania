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
  `gate.js` (schermata di avvio), `account.js`, `badges.js`, `social.js` (scheda Amici), `install.js` (pannello "Installa e usa offline": istruzioni per browser, stato della copia offline).
- Figura: barra `.tbar` sopra il disegno (moduli a sinistra, zoom a destra), mai sovrapposta; l'svg occupa
  tutta la larghezza e mantiene le proporzioni (con lo zoom si vede anche ciò che sta ai lati).
  Zoom: pulsanti, rotella, pizzico a due dita con eventi touch (su iPhone gli eventi pointer a due dita
  vengono annullati dal sistema); un dito sposta la figura quando è ingrandita.
- Puzzle: `slotAt(x,y,id)` in `figure.js` sceglie il posto vuoto più vicino entro `SLOT_PX` (28 px), anche se
  coperto da altre ossa, con precedenza al pezzo in mano; altrimenti l'osso sotto il dito (errore).
  Il pezzo trascinato è disegnato alla scala della figura, con il centro 42 px sopra il dito. I pezzi sono la sagoma intera
  del lato principale della vista (`sf`, riquadro `sb`), anche delle parti coperte da altre ossa: una costa si vede intera.
  Il pezzo in mano vince se il suo posto è entro 8 px dal posto più vicino.
- Menu della figura: un pulsante per modulo ("🦴 Corpo · Anteriore ▾", "🧠 Cervello ▾") apre l'elenco delle viste del modulo
  (`viewMenu()` in `figure.js`, `#vmenu`); la vista scelta per ogni modulo è in `app.bases`, salvata in `bodymania-2d` con `grp`.
  Viste (`views` e nomi `vnames` nei contenuti): corpo `a` `p` `ld` `ls` `s` `i` (anteriore, posteriore, laterale destra e
  sinistra, dall'alto, dal basso); cervello `ls` `ld` (emisferi), `m` (sagittale: faccia mediale del destro), `f` frontale, `s`, `i`.
  Tutte le viste di un modulo stanno nello stesso spazio 300×H (stessa scala, ognuna centrata); cambiando vista e con ⟲ la
  figura si adatta al disegno della vista (`resetZoom`), il riquadro può essere più largo della figura (`maxW`, `clampT`).
- Viste di zona (`zviews` in `corpo.json`): `mp`/`md` mano palmare e dorsale, `pd`/`pp` piede dall'alto e dalla pianta, solo il
  lato destro. I gruppi `cranio` (vista `ld`), mano e piede hanno `zv` (vista preferita): Ricomponi li gioca lì e Trova chiede lì
  le loro ossa, con `setView(v,true)` (temporanea, non cambia `app.bases`); nel menu compare anche la coppia della zona.
  `baseView()` torna alla vista del menu a ogni domanda, al menu dei giochi e al cambio di scheda.
- `vis[v]`: quota della sagoma visibile in quella vista. Giochi e puzzle usano solo strutture con almeno il 25% visibile
  (`visibleIn`, `MIN_VIS`): niente pisiforme da dietro. Lo zoom sulla zona usa le proporzioni del riquadro sullo schermo.
- Safari a volte non ridisegna l'svg quando cambia altezza (scheda abbassata) e mostra la figura due volte: un ResizeObserver
  in `figure.js` lo costringe a ridisegnare. Non provato su Safari vero dall'AI.
- Scheda sotto la figura dentro `#pw`: la freccia `#fold` sul bordo in alto a destra la abbassa (striscia di due righe
  scorrevole, in gioco resta la domanda) e la rialza; scelta in `bodymania-fold`. Stessa freccia nell'atlante 3D (`bodymania-fold3d`).
- Spunta verde in alto a destra (`#off`) quando la copia offline è pronta; il pulsante "Installa l'app"
  in Esplora compare solo fuori dall'app installata.
- `content/`: `index.json` (versione globale, ordine dei moduli), `corpo.json`, `cervello.json`,
  `neuro-strutture.json` (testi dei gruppi del cervello), `nervi-cranici.json`. Ogni file ha `version`.
  Le forme sono descrizioni come `{"poly":"M…"}`, `{"ln":[x1,y1,x2,y2,spessore]}`, `{"stack":[x,y,w,h,n]}`
  (tipi in `js/shapes.js`). Quando cambi un contenuto, aumenta la `version` del file e quella di `index.json`.
- Serve un server locale (`python3 -m http.server`): con il doppio clic su `index.html` (`file://`) moduli e JSON non si caricano.
  Non usare `npx serve`: reindirizza `/atlante/index.html` → `/atlante` e il service worker rifiuta le risposte reindirizzate
  (atlante vuoto, app che non si apre offline). GitHub Pages non reindirizza.
- PWA: `manifest.webmanifest`, icone in `icons/` (PNG generate da uno script, non nel repo), `sw.js`.
  Il service worker copia in cache l'elenco `APP_FILES` all'installazione e serve l'app dalla cache; all'installazione
  scarica anche i contenuti se la versione è cambiata (una versione nuova dell'app può richiedere il formato nuovo).
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
- Moduli 2D: `corpo` (121 ossa singole in 26 gruppi, sei viste; 208 muscoli) e `cervello` (106 strutture in sei viste; fino al
  18/11/2026 erano due moduli, `lat` e `sag`: gli id `b.*` e la maestria sono gli stessi), 12 nervi cranici.
- Disegni 2D ricavati dal modello 3D (non più a mano): `node atlante/build/proietta_2d.mjs <tmp.json>` (gira anche nel cloud:
  legge solo i `.glb` del repository, pochi secondi) proietta ossa, viste di zona di mano e piede (assi principali delle loro ossa),
  sagome intere delle singole ossa, encefalo e aree di origine e inserzione (z-buffer in software, contorni dei pixel visibili → tracciati SVG; senza pacchetti
  npm), poi `python3 atlante/build/contenuti_2d.py <tmp.json>` scrive `content/corpo.json` e `cervello.json` con nomi
  (TA2), descrizioni (`desc` di `dati.json`), gruppi, muscoli e casi (testi dei gruppi di ossa e casi in `atlante/build/testi_2d.json`,
  gruppi del cervello in `content/neuro-strutture.json`). Ogni struttura ha `s.<vista>` (forme per vista: ogni lato è
  un tracciato a sé, il primo è il lato principale della vista: destro, sinistro guardando da sinistra; nel cervello il sinistro
  nelle viste con i due emisferi), `c`, `sf`/`sb`/`vis` e `g` (gruppo); i gruppi hanno `m` (membri). Nel cervello i
  gruppi sono i lobi (partizione) più aree che si sovrappongono (`area: true`: Broca, Wernicke, giro precentrale, talamo…).
  Esclusi dal 2D: ossicini, cellule etmoidali, seni, cartilagini di naso e laringe, sesamoidi; denti e cartilagini costali
  sono una voce ciascuno; nel cervello i nuclei profondi (si vedrebbero attraverso gli spazi tra le superfici).
- Muscoli 2D: ossa di origine e inserzione dall'osso più vicino alle aree della fonte; dove la fonte non ha l'area, dal testo
  della scheda (`src: 'testo'`, segnalato nel pannello). 154 muscoli hanno origine e inserzione (usati nei giochi).
  Aree segnate dalla parte sbagliata nella fonte: `SPOSTA` in `build/descrizioni.py` (es. capo breve del bicipite femorale).
- Figura: menu Corpo/Cervello con le viste (vedi sopra) e "Ossa singole/Gruppi" ("Giri e solchi/Lobi e aree" nel cervello),
  scelte salvate in `bodymania-2d`. Le viste sono nell'svg insieme (una sola visibile), le marcature valgono in tutte.
  Con i gruppi tutti i giochi usano i gruppi (`items()`, `itemOf()` in `state.js`); la risposta è giusta se si tocca un membro.
  Trova: con le singole si sceglie prima il gruppo, e per le ossa piccole la figura si ingrandisce sulla zona. Ricomponi: con le
  singole i pezzi sono le ossa di un gruppo (zona ingrandita), con i gruppi sono gruppi interi. Maestria: chiavi diverse per
  singole (`o.femur`, `b.precentral-gyrus`) e gruppi (gli id dei vecchi 22 gruppi: `femore`, `carpo`… e dei lobi).
- Modalità: Ricomponi (puzzle con trascinamento), Tendine-ponte, Caso clinico (indizi progressivi),
  Trova la struttura, Origine e inserzione, Funzione → struttura, Nervi cranici, Misto.
- Zoom e pan sulla figura (pulsanti, pizzico, rotella), XP, livelli, serie di giorni, maestria per struttura.
- Salvataggio locale: `localStorage`, chiave `bodymania-v1`. **L'account è facoltativo**: senza account si gioca e si
  esplora tutto come prima e i progressi restano solo sul dispositivo.
- Schermata di avvio (`js/gate.js`, `#gate` in `index.html`): l'app si prepara sotto. Con rete controlla se c'è una
  versione nuova del service worker (`reg.update()`; se si installa, attende `controllerchange` e ricarica una volta,
  guardia in `sessionStorage` `bm-upd`), ricarica anche se arrivano contenuti nuovi mentre è aperta, poi sincronizza.
  Senza rete entra subito (tutto in locale). Se non c'è un account chiede di accedere (vista Accedi, sotto "Registrati"
  e "Continua senza account"; la scelta ospite si ricorda in `bodymania-guest`). Dopo la prima registrazione chiede il nome.
- Account (`js/account.js`): email e password o Google (Supabase Auth, flusso PKCE). La libreria `vendor/supabase.js`
  (supabase-js 2.118.0, UMD) si carica solo se c'è una sessione o si apre l'accesso. Configurazione in `js/config.js`
  (indirizzo del progetto e chiave pubblica; vuoti = solo locale). `startAccount()` restituisce ok / offline / expired / none.
  `bodymania-acct` ricorda l'ultimo account usato e `dirty` (progressi salvati qui e non ancora inviati, es. giocando
  offline): se la sessione non vale più, all'avvio con rete si chiede di accedere di nuovo con un avviso; chi continua
  senza accedere trova nel profilo "Accedi e sincronizza". Uscendo con "Esci" l'account si dimentica.
  All'accesso i progressi locali si uniscono al server tenendo il valore più alto (XP, risposte, maestria per voce;
  per la serie vale il giorno più recente; profilo: vince la modifica più recente, `profile_at`), poi dopo ogni `save()`
  parte un invio (3 s). Le partite finite vanno in `bodymania-queue` e si inviano con upsert che ignora i doppioni.
- Profilo (scheda "👤 Profilo", `js/progress.js`, a tutto schermo senza figura): foto (ritagliata a 128×128 JPEG e salvata
  come testo `data:` in `profiles.avatar`, così si vede offline), nome (con account: unico, regola `NAME_RE`), ruolo,
  presentazione; statistiche, badge, riquadro Account (sincronizza, cambia password, esci) e maestria, con la scelta tra corpo
  e cervello (toccando una voce si apre in Esplora nel suo modulo).
  Profilo locale in `S.prof`; funziona anche senza account.
- Badge (`js/badges.js`): 20, calcolati sul dispositivo dopo ogni `save()` (avviso "Nuovo badge"); `S.badges` {id: data},
  statistiche delle partite in `S.stats` (aggiornate da `queue.add`). Con l'account vanno in `badge_assertions`.
  Gli id e i testi devono coincidere con `badge_classes` nel secondo file SQL (`20261117120000_profilo_badge.sql`,
  che aggiunge anche le colonne avatar, role, bio, profile_at e la foto nella classifica).
- Sfondo chiaro o scuro: senza scelta segue il sistema; il pulsante 🌙/☀️ nell'intestazione (e nella barra dell'atlante
  aperto da solo) mette `data-theme` su `<html>` e lo salva in `localStorage` (`bodymania-theme`). Uno script in testa a
  `index.html` e `atlante/index.html` lo applica prima di disegnare; l'atlante nell'iframe segue l'app con l'evento `storage`.

Mai provato su un dispositivo reale dall'AI: il tocco e il trascinamento li ha provati solo l'autore.

## Atlante 3D (scheda "🧍 Atlante 3D" dell'app)
`atlante/` è un atlante 3D ruotabile in stile cartoon, a strati sovrapponibili (three.js in `atlante/vendor/`,
logica in `atlante/atlante.js`). È una pagina a sé (`atlante/index.html`, si apre anche da sola) che l'app mostra in un
iframe nella quarta scheda: `showAtlas()` in `js/ui.js` la carica la prima volta che si apre la scheda e la tiene in
memoria (nascosta non disegna). Dentro l'iframe la pagina toglie la propria intestazione (classe `emb`).

Offline (in `sw.js`): pagina, `atlante.js` e `dati.json` stanno in `APP_FILES`; motore three.js e modelli `.glb` in una
cache a parte (`MODEL_CACHE`, versione `MODEL_VERSION`, da aumentare quando cambi `vendor/` o un `.glb`). All'installazione
si salva la base (motore e `ossa.glb`, circa 3 MB in più), ogni altro strato la prima volta che si apre con la rete.
Nel pannello Strati si vede quanti strati sono salvati e c'è "Scarica tutto per offline".

Fonte: **Z-Anatomy** (CC BY-SA 4.0, derivato da BodyParts3D), scelto al posto di BodyParts3D perché ha nello
stesso modello coerente ossa, muscoli completi, legamenti, sistema nervoso centrale e periferico, vasi, visceri,
le aree di origine e inserzione dei muscoli e le etichette dei reperi già posizionate. Nomi italiani e latini
dalla Terminologia Anatomica 2 (`build/TA2.csv`). Crediti e licenze in `atlante/CREDITI.md`: i file derivati
vanno distribuiti con la stessa licenza CC BY-SA 4.0. Rene e orecchio interno (licenza non commerciale nella
fonte) sono esclusi.

File (ogni strato si scarica solo quando viene acceso; `ossa.glb` all'avvio):
- `ossa.glb` (277 parti), `muscoli.glb` (464 muscoli più 205 fasce, tendini e borse), `legamenti.glb`,
  `inserzioni.glb` (705 aree di origine e inserzione), `encefalo.glb`, `midollo.glb`, `nervi.glb`,
  `meningi.glb`, `sensi.glb` (occhio e orecchio), `vasi.glb`, `visceri.glb`. In tutto circa 8 MB.
- `dati.json`: `names` (nome inglese senza lato → [italiano, latino]), `objs` (nome della parte → [strato,
  materiale della fonte, gruppo]), `lm` (606 reperi: nome, parte a cui appartiene, punto, direzione verso fuori),
  `mus` (208 muscoli per radice del nome: parti, aree di origine `o` e inserzione `e`, gruppo funzionale,
  e `card` con origine, inserzione, azione e innervazione per tutti i 208 muscoli).
- Nei nomi delle parti il suffisso indica il lato (`.r` destro, `.l` sinistro) e, per le aree, `.o…`/`.e…`
  origine/inserzione. three.js toglie punti e spazi da `mesh.name`: il nome vero è in `mesh.userData.name`.
- Assi: Y in alto, +Z davanti, −X lato destro del corpo. Il modello è simmetrico: i reperi di destra
  valgono a sinistra cambiando segno alla X.

Come si rigenera (serve Blender; i passaggi stanno in `atlante/build/`):
1. `Blender -b Startup.blend --python build/za_export.py -- <cartella>` esporta gli strati grezzi e `za_meta.json`
   (`Startup.blend` è dentro `Z-Anatomy.zip` del repository Z-Anatomy/Models-of-human-anatomy).
2. `node build/za_optimize.mjs <cartella> <uscita>` semplifica e comprime (pacchetti npm `@gltf-transform/*`, `meshoptimizer`).
3. `python3 build/za_dati.py <cartella>/za_meta.json atlante/dati.json` unisce metadati, TA2, `build/schede.json`
   e le descrizioni di `build/descrizioni.py` (chiave `desc`). Per aggiornare solo le descrizioni senza Blender:
   `python3 build/descrizioni.py atlante/dati.json`.

Funzioni dell'atlante (in `atlante.js`):
- Pulsante ⟲ all'inizio della barra (`homeView()`): torna alla vista iniziale, tutto il corpo da davanti.
- Muscolo: tre viste, "Forma e aree", "Punti e linee" (pallino blu al centro di ogni area di origine, arancione
  per l'inserzione, linea viola che li unisce, sempre in primo piano) ed "Entrambe"; reperi della fonte entro 2,5 cm dai punti.
- Gruppi (`COMBO`): zampa d'oca, ischiocrurali, cuffia dei rotatori, tricipite della sura, quadricipite.
- Ricerca senza accenti, con abbreviazioni e nomi comuni (`SYN`: SIAS, SIPS, zampa d'oca, Broca…).
- Encefalo (pulsante 🧠): sezioni assiale, coronale e sagittale con cursore (piano di taglio su tutta la scena;
  durante il taglio il contorno è spento e le superfici sono a due facce) e scomposizione in 9 strati (`ST`), dalla
  dura madre ai ventricoli. Dura madre e aracnoide craniche non sono nella fonte: `makeShells()` le genera
  avvolgendo la corteccia, forma schematica dichiarata nel pannello.

Correzione all'esportazione: `Ciliary body-curve.l` in `sensi.glb` esce con una trasformazione sbagliata (anello di 2 m
dietro lo scheletro); `atlante.js` lo sostituisce al caricamento con la copia speculare del destro (`MIRROR_FIX`).

Correzioni alla fonte: in 12 muscoli Z-Anatomy ha origine e inserzione scambiate (piccolo pettorale, dentato anteriore,
trapezio, scaleni anteriore e medio, tiroioideo, retto dell'addome, retti e obliquo inferiore della testa; capo
sternocostale del grande pettorale). `correggi_aree()` in `build/descrizioni.py` le scambia; il pannello lo segnala.
I "muscoli qui vicino" di un repere contano solo le aree il cui osso più vicino è quello del repere.

Cosa viene dalla fonte e cosa no: forme, posizioni dei reperi, aree di origine e inserzione e nomi vengono
dalla fonte. Scritti dall'AI a memoria, da verificare su un atlante: i testi dei muscoli in `build/schede.json`
(57 muscoli) e `build/schede2.py` (gli altri 151: ora tutti i 208 hanno la scheda), le descrizioni di `build/descrizioni.py` (tutte le ossa, tutti i 606 reperi,
quasi tutte le strutture dell'encefalo) e i testi di gruppi e strati in `atlante.js`.
Giochi sul modello 3D (si rifanno uno alla volta; quelli 2D restano come sono). Fatto: **Trova la struttura** in tre
serie (ossa, muscoli, reperi), nel menu Gioca sotto "Sul modello 3D". Il menu chiama `play3d()` in `js/ui.js`, che apre la
scheda e manda all'iframe `{bm:1,type:'game',set}` (anche in attesa del messaggio `ready` se l'atlante non è ancora carico);
l'atlante gioca (`startGame`, `gameTap`, `gamePanel` in `atlante.js`) e rimanda `res` (ogni risposta: XP, serie, maestria
con chiave `3d:<serie>:<nome>`), `end` (bonus) e `menu`. XP e salvataggio restano solo nell'app.
Si chiede solo ciò che si vede da fuori ruotando il modello: `seenFrom()` disegna la scena da 26 direzioni con un colore
per candidato e conta i pixel (ossa e muscoli ≥ 4 su 200×400, reperi come pallini di 5 mm ≥ 4 su 300×600). Restano 131 ossa
(esclusi denti, ossicini, cellule etmoidali, seni, cartilagini di naso e laringe), 131 muscoli (esclusi i profondi, es.
sovraspinato) e 470 reperi. Le domande si scelgono prima per famiglia (`famOf`: coste, falangi, vertebre…).
Fatto anche: **Origine e inserzione** (serie `oi`): si chiede l'origine o l'inserzione di un muscolo e si tocca l'osso; la
risposta è giusta se il punto toccato dista al massimo 1,2 cm (`OI_TOL`) da un'area di quel tipo della fonte (distanza dai
triangoli, `distToArea`). Se sbagliata, il pannello dice se lì c'è l'area di un altro muscolo. Dopo la risposta si vedono
le aree e la linea del muscolo sul lato toccato (vista `mv:'areas'`, senza la forma) e il testo della scheda (dell'AI).
Domande: 120 origini e 83 inserzioni con almeno un'area visibile da fuori (conteggio a 400×800, le aree di mano e piede
sono piccole). Refusi della traduzione italiana di TA2 corretti in `REFUSI` di `build/descrizioni.py`.
Fatti anche (18/11/2026): **Ricomponi** (`ricomponi`: le ossa di una zona di `ZONES` diventano trasparenti, si sceglie un pezzo
e si tocca il suo posto; il raggio cerca solo tra i posti vuoti, anche dietro altre ossa), **Tendine-ponte** (`ponte`: osso di
origine e poi di inserzione, ossa = osso più vicino alle aree della fonte, come nel 2D; 76 muscoli), **Caso clinico** (`caso`:
indizi progressivi, si tocca il muscolo; casi di `content/corpo.json` mandati dall'app nel messaggio del gioco, solo quelli con
un muscolo visibile da fuori) e **Nervi cranici** (`nervi`: encefalo e solo i 12 nervi cranici accesi, ossa trasparenti; si
chiede il nome o la funzione da `nervi-cranici.json`, anche questi mandati dall'app; `crNum()` riconosce anche i rami di V,
VII, VIII). Funzione → struttura resta solo 2D: in 3D più muscoli hanno la stessa azione e il tocco sarebbe ambiguo.
I casi clinici del corpo sono 21 (12 nuovi in `testi_2d.json`, scritti dall'AI: da verificare), validi anche nel 2D.
Badge "Esploratore 3D": quattro sfide 3D diverse (testo aggiornato in `20261118150000_badge_3d.sql`, facoltativo).

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
3. ~~Supabase: schema e regole in file SQL versionati (`supabase/migrations/`)~~ (scritti; da applicare al progetto).
4. ~~Registrazione e login~~ (email e password, Google ancora da attivare su Supabase), ~~pagina profilo~~.
5. ~~Sincronizzazione~~: coda locale (in localStorage invece di IndexedDB), invio idempotente, unione dei progressi.
6. ~~Amici (richiesta, accettazione) e due classifiche: tutti gli iscritti e solo amici~~ (scheda "🏆 Amici", `js/social.js`;
   terzo file SQL `20261118090000_amici_classifiche.sql`: una sola amicizia per coppia, serie a zero se non si gioca da più
   di un giorno, foto nella classifica amici; l'ultima classifica resta in `bodymania-social` per vederla offline). Toccando un
   nome in classifica si apre sotto la riga "Chiedi l'amicizia" (o lo stato della richiesta).
   Badge "Giramondo": corpo, cervello e 3D (testo in `20261119090000_badge_moduli.sql`, facoltativo).
7. ~~Badge e traguardi mostrati nel profilo~~ (20 badge; altri trofei si aggiungono in `badges.js` e nel file SQL).
8. Pubblicazione su GitHub Pages.

Idee rimandate: livello tendini
e legamenti, puzzle a strati, sfida a tempo, duello 1 contro 1, sfida del giorno, altre ghiandole.

## Modello dati (bozza)
- `profiles` (id = utente, username, xp, serie di giorni)
- `friendships` (user_id, friend_id, stato: in attesa / accettata)
- `game_results` (id generato dal client, user_id, modulo, modalità, punteggio, totale, xp, giocata_il)
- `mastery` (user_id, item_id, livello 0–3, aggiornato_il)
- `badge_classes` (id, nome, descrizione, criterio, immagine)
- `badge_assertions` (id, user_id, badge_id, assegnato_il)
- Viste: classifica globale e classifica amici.

## Privacy (GDPR) e sicurezza (19/11/2026)
- Database (`20261119100000_privacy_sicurezza.sql`, da applicare): ognuno legge solo il proprio profilo; degli altri si vedono
  nome utente, foto, XP e serie solo dalle viste `leaderboard`, `leaderboard_friends`, `public_profiles` (security definer, solo
  quelle colonne, solo per chi ha una sessione). Email solo in `auth.users` (mai leggibile dall'app: la vedono gli amministratori
  del progetto nel pannello di Supabase). Colonne modificabili del profilo elencate nel `grant update`; nelle amicizie si cambia
  solo `status` (prima chi riceveva una richiesta poteva cambiare `user_id`); badge visibili solo a chi li ha; limiti su lunghezze,
  XP e formato della foto (JPEG/PNG/WebP base64). Nessun ruolo di amministratore nelle tabelle.
  Cancellazione: `delete_my_account()` (cascata su profilo, partite, maestria, amicizie, badge).
  Le regole sono state provate su PostgreSQL 16 con un finto schema `auth` (utenti A, B, C che provano a leggere e scrivere i dati
  altrui): da rifare se si cambiano le policy.
- App: l'app non scrive SQL (PostgREST passa i valori come parametri); gli id che finiscono in un filtro `.or()` passano da
  `UUID` in `social.js`; tutto il testo degli utenti passa da `esc()`. Content-Security-Policy in `<meta>` di `index.html`,
  `atlante/index.html` e `privacy.html`: niente script in linea (tema in `js/tema.js`, pagina dell'atlante in `atlante/pagina.js`),
  solo la mappa degli import dell'atlante con l'impronta sha256 (se la cambi, ricalcola l'impronta), rete solo verso Supabase.
- Informativa: `privacy.html` (titolare Alessandro Fiumicelli, dati su Supabase in UE, Parigi).
  Registrazione con spunta obbligatoria (informativa letta, almeno 14 anni) e versione `PRIVACY_V` salvata nei metadati
  dell'utente; per Google un avviso sotto il pulsante. Profilo → "Privacy e dati": scarica i miei dati (JSON con dispositivo e
  server, `myData()`), cancella i dati da questo dispositivo, elimina l'account. Password di almeno 8 caratteri nell'app.

## Vincoli
- Nel frontend va solo la chiave pubblica di Supabase. La chiave `service_role` non entra mai
  nel repository né nel codice del browser.
- I punteggi sono calcolati sul dispositivo, quindi falsificabili: accettato per l'uso tra amici.
- Testi anatomici, casi clinici e disegni sono stati scritti dall'AI a memoria: sono da verificare
  su un atlante o con un professionista. Non presentarli come fonte validata.
- Lingua dell'interfaccia e dei contenuti: italiano.
