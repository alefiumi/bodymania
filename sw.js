/* Service worker di BodyMania.
   - App (HTML, CSS, JS, icone): copiate in cache all'installazione e servite dalla cache.
     Quando cambi uno di questi file, aumenta APP_VERSION: il browser scarica di nuovo tutto l'elenco.
   - Contenuti (content/): serviti dalla cache. A ogni avvio, se c'è rete, si controlla content/index.json:
     se la versione è cambiata si scarica l'intero set in una cache nuova e lo si usa dall'avvio successivo. */
const APP_VERSION = '2';
const APP_CACHE = 'bodymania-app-' + APP_VERSION;
const CONTENT_PREFIX = 'bodymania-content-';
const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/util.js', 'js/state.js', 'js/content.js', 'js/shapes.js', 'js/figure.js',
  'js/explore.js', 'js/game.js', 'js/puzzle.js', 'js/progress.js', 'js/ui.js', 'js/install.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const abs = p => new URL(p, self.registration.scope).href;

/* ---------- contenuti ---------- */
// Versioni dei contenuti in cache, dalla più recente. Si tiene anche la precedente, perché una pagina
// aperta prima dell'aggiornamento continua a chiedere i file della sua versione (parametro ?v=).
const contentVersions = async () => (await caches.keys()).filter(k => k.startsWith(CONTENT_PREFIX))
  .map(k => k.slice(CONTENT_PREFIX.length)).sort((a, b) => Number(b) - Number(a));
const contentCacheName = async v => {
  const vs = await contentVersions();
  const pick = v != null && vs.includes(v) ? v : vs[0];
  return pick == null ? null : CONTENT_PREFIX + pick;
};
const cachedVersion = async () => (await contentVersions())[0] ?? null;

// Scarica tutti i file dei contenuti; li mette in cache solo se arrivano tutti (mai un set a metà).
async function downloadContent(idx) {
  const files = new Set(['index.json', ...idx.modules.map(id => id + '.json'), idx.nc, ...(idx.files || [])]);
  const res = await Promise.all([...files].map(async f => {
    const r = await fetch(abs('content/' + f), {cache: 'no-store'});
    if (!r.ok) throw new Error('content/' + f + ': HTTP ' + r.status);
    return [f, r];
  }));
  const name = CONTENT_PREFIX + idx.version, cache = await caches.open(name);
  await Promise.all(res.map(([f, r]) => cache.put(abs('content/' + f), r)));
  for (const v of (await contentVersions()).slice(2)) await caches.delete(CONTENT_PREFIX + v);
}
const fetchIndex = async () => {
  const r = await fetch(abs('content/index.json'), {cache: 'no-store'});
  if (!r.ok) throw new Error('content/index.json: HTTP ' + r.status);
  return r.json();
};
let checking = null;
// Controllo delle versioni (solo con rete). Se scarica un set nuovo, avvisa le pagine aperte.
function checkContent() {
  return checking ||= (async () => {
    try {
      const idx = await fetchIndex(), old = await cachedVersion();
      if (String(idx.version) === old) return;
      await downloadContent(idx);
      if (old !== null) for (const c of await self.clients.matchAll()) c.postMessage({type: 'content-updated', version: idx.version});
    } catch (e) { /* offline o server irraggiungibile: si continua con la cache */ }
    finally { checking = null; }
  })();
}

/* ---------- ciclo di vita ---------- */
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(APP_FILES.map(f => new Request(abs(f), {cache: 'reload'})));
    if (!(await contentCacheName())) await downloadContent(await fetchIndex());
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('bodymania-app-') && k !== APP_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

/* ---------- richieste ---------- */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  const rel = new URL(req.url).pathname.slice(new URL(self.registration.scope).pathname.length);
  if (rel.startsWith('content/')) {
    if (rel === 'content/index.json') e.waitUntil(checkContent());
    e.respondWith((async () => {
      const n = await contentCacheName(new URL(req.url).searchParams.get('v'));
      const hit = n && await (await caches.open(n)).match(req, {ignoreSearch: true});
      return hit || fetch(req);
    })());
    return;
  }
  e.respondWith((async () => {
    const cache = await caches.open(APP_CACHE);
    const hit = await cache.match(req.mode === 'navigate' ? abs('index.html') : req, {ignoreSearch: true});
    return hit || fetch(req);
  })());
});
