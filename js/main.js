/* Avvio: prepara l'uso offline, carica i contenuti, poi mostra il primo modulo. */
import {$} from './util.js';
import {app,head} from './state.js';
import {loadContent} from './content.js';
import {useMod} from './ui.js';
import {isStandalone,offlineReady,refreshOfflineBadge} from './install.js';

/* ---------- sfondo chiaro o scuro ---------- */
// Senza scelta segue il sistema; il pulsante salva la scelta (anche l'atlante 3D la legge, vedi atlante.js).
const THEME_KEY='bodymania-theme',root=document.documentElement,sysDark=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>root.dataset.theme?root.dataset.theme==='dark':sysDark.matches;
function themeBtn(){const d=isDark();$('theme').textContent=d?'☀️':'🌙';$('theme').title=d?'Sfondo chiaro':'Sfondo scuro';}
$('theme').addEventListener('click',()=>{
 root.dataset.theme=isDark()?'light':'dark';
 try{localStorage.setItem(THEME_KEY,root.dataset.theme);}catch(e){}
 // l'atlante nell'iframe riceve l'evento storage; il messaggio serve se localStorage non è disponibile
 document.querySelector('#atlas iframe')?.contentWindow?.postMessage({bm:1,type:'theme',theme:root.dataset.theme},location.origin);
 themeBtn();
});
sysDark.addEventListener('change',themeBtn);themeBtn();

/* ---------- uso offline (PWA) ---------- */
function toast(msg){
 const t=document.createElement('div');t.id='toast';t.textContent=msg;
 $('toast')?.remove();document.body.appendChild(t);setTimeout(()=>t.remove(),6000);
}
// Il service worker si registra subito, così la copia locale si prepara il prima possibile.
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.addEventListener('message',e=>{
  if(e.data&&e.data.type==='content-updated')toast('Contenuti aggiornati: li vedrai alla prossima apertura dell\'app.');
 });
 // Prima presa di controllo = app e contenuti sono stati copiati sul dispositivo.
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(!hadController)toast('✅ Pronta: da ora l\'app funziona anche senza connessione.');
  refreshOfflineBadge();
 });
 refreshOfflineBadge();
 // toccando la spunta si vede lo stato, senza lasciare la schermata in cui si è
 $('off').addEventListener('click',async()=>toast(await offlineReady()
  ?'✅ Disponibile offline: puoi giocare anche senza connessione. I progressi restano salvati sul dispositivo.'
  :'⏳ Copia offline in preparazione: tieni l\'app aperta con la connessione qualche secondo.'));
 navigator.serviceWorker.register('sw.js').catch(e=>console.warn('Service worker non registrato',e));
 // Nell'app installata chiede al sistema di non cancellare la copia locale per liberare spazio.
 if(isStandalone())navigator.storage?.persist?.().catch(()=>{});
}

try{
 const c=await loadContent();
 app.MODS=c.MODS;app.NC=c.NC;
 useMod('corpo');head();
}catch(e){
 console.error(e);
 $('panel').innerHTML='<div class="h">Contenuti non disponibili</div><p class="mut">Non riesco a caricare i file in content/. Se hai aperto index.html con doppio clic, avvia un server locale (per esempio <code>npx serve .</code>) e apri l\'indirizzo che ti indica. Al primo avvio serve la connessione.</p>';
}
