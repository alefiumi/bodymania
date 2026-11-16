/* Avvio: carica i contenuti, poi mostra il primo modulo. */
import {$} from './util.js';
import {app,head} from './state.js';
import {loadContent} from './content.js';
import {useMod} from './ui.js';

try{
 const c=await loadContent();
 app.MODS=c.MODS;app.NC=c.NC;
 useMod('corpo');head();
}catch(e){
 console.error(e);
 $('panel').innerHTML='<div class="h">Contenuti non disponibili</div><p class="mut">Non riesco a caricare i file in content/. Se hai aperto index.html con doppio clic, avvia un server locale (per esempio <code>npx serve .</code>) e apri l\'indirizzo che ti indica. Al primo avvio serve la connessione.</p>';
}

/* ---------- uso offline (PWA) ---------- */
function toast(msg){
 const t=document.createElement('div');t.id='toast';t.textContent=msg;
 $('toast')?.remove();document.body.appendChild(t);setTimeout(()=>t.remove(),6000);
}
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 navigator.serviceWorker.addEventListener('message',e=>{
  if(e.data&&e.data.type==='content-updated')toast('Contenuti aggiornati: li vedrai alla prossima apertura dell\'app.');
 });
 navigator.serviceWorker.register('sw.js').catch(e=>console.warn('Service worker non registrato',e));
}
