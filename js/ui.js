/* Cambio di modulo e di tab, gestione dei clic su figura, pannello e barra in basso. */
import {$} from './util.js';
import {app,S,save,saveGrp,head,touchStreak,bump,queue,itemOf} from './state.js';
import {buildFig,boneAt,slotAt,clearMarks,refreshMastery,resetZoom,zoomAt,showMuscle,muscleHtml,takePan,setView,focusItem,baseView,viewMenu,closeViewMenu} from './figure.js';
import {renderExplore,showNc,selectBone} from './explore.js';
import {renderMenu,clearGhosts,startGame,nextQ,answerFind,answerMusc,answerBridge,answerFunc,answerNc,answerCase,bridgePrompt,casePanel} from './game.js';
import {placeAttempt} from './puzzle.js';
import {renderProg} from './progress.js';
import {renderSocial,loadSocial,setSocialOpen} from './social.js';
import {showInstall,promptInstall,installNow} from './install.js';

export function useMod(id){
 const MOD=app.MODS[id];if(!MOD)return;
 app.MOD=MOD;app.B=MOD.B;app.GR=MOD.GR;app.M=MOD.M;app.CASES=MOD.CASES;app.VB={x:0,y:0,w:MOD.W,h:MOD.H};app.G=null;app.sel=null;
 buildFig();setTab(app.tab);
}
// L'atlante 3D è una pagina a sé (atlante/index.html) in un iframe: si carica la prima volta che si apre la
// scheda e resta in memoria, così passando da una scheda all'altra non si perde la vista.
function showAtlas(on){
 $('fig').hidden=$('pw').hidden=on;$('atlas').hidden=!on;
 if(on&&!$('atlas').firstChild)$('atlas').innerHTML='<iframe src="atlante/index.html" title="Atlante 3D" allow="fullscreen"></iframe>';
}
// Giochi 3D: la partita si svolge nell'atlante, che rimanda qui ogni risposta per XP, serie e maestria.
let atlasReady=false,pending3d=null;
const atlasWin=()=>$('atlas').querySelector('iframe')?.contentWindow;
// casi clinici e nervi cranici stanno nei contenuti dell'app: viaggiano con il messaggio
const gameMsg=set=>({bm:1,type:'game',set,cases:(app.MODS.corpo&&app.MODS.corpo.CASES)||[],nc:app.NC});
function play3d(set){
 setTab('atlas');
 if(atlasReady)atlasWin().postMessage(gameMsg(set),location.origin);else pending3d=set;
}
window.addEventListener('message',e=>{
 const d=e.data;if(e.origin!==location.origin||!d||!d.bm||e.source!==atlasWin())return;
 if(d.type==='ready'){atlasReady=true;if(pending3d){atlasWin().postMessage(gameMsg(pending3d),location.origin);pending3d=null;}}
 else if(d.type==='res'){touchStreak();if(d.ok){S.xp+=10;S.ok++;bump(d.key,1);}else{S.ko++;bump(d.key,-1);}save();head();}
 else if(d.type==='end'){if(d.done)S.xp+=20;queue.add({module:'3d',mode:d.set,score:d.score|0,total:d.total|0,xp:d.gain|0});save();head();}
 else if(d.type==='menu')setTab('play');
});
function setTab(t){
 app.tab=t;document.body.classList.toggle('pg',t==='prog'||t==='soc'); // profilo e amici usano tutto lo schermo, senza figura
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 showAtlas(t==='atlas');if(t==='atlas')return;
 clearGhosts();clearMarks();baseView();resetZoom(false);refreshMastery();({explore:renderExplore,play:renderMenu,prog:renderProg,soc:renderSocial})[t]();if(t==='soc')loadSocial();
}
setSocialOpen(()=>app.tab==='soc');
/* Freccia sul bordo della scheda sotto la figura: la abbassa (resta una striscia con l'inizio del testo, la figura si allarga)
   e la rialza. La scelta resta salvata (bodymania-fold). */
const FOLD='bodymania-fold';
function setFold(f){$('pw').classList.toggle('fold',f);const t=f?'Rialza la scheda':'Abbassa la scheda';$('fold').title=t;$('fold').setAttribute('aria-label',t);try{localStorage.setItem(FOLD,f?'1':'');}catch(e){}}
try{setFold(!!localStorage.getItem(FOLD));}catch(e){setFold(false);}
$('fold').addEventListener('click',()=>setFold(!$('pw').classList.contains('fold')));
document.addEventListener('click',e=>{if(!e.target.closest('#vmenu,[data-mm]'))closeViewMenu();});
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.t);});
$('fig').addEventListener('click',e=>{
 const zb=e.target.closest('.zc button');
 if(zb){const k=zb.dataset.z,VB=app.VB;if(k==='reset')resetZoom(true);else zoomAt(k==='in'?1.5:1/1.5,VB.x+VB.w/2,VB.y+VB.h/2);return;}
 // menu Corpo / Cervello: si apre con il pulsante del modulo, la voce scelta cambia modulo e vista
 const mmb=e.target.closest('[data-mm]');if(mmb){viewMenu(mmb.dataset.mm,mmb);return;}
 const vm=e.target.closest('[data-vm]');
 if(vm){closeViewMenu();const [id,v]=vm.dataset.vm.split(':');
  if(id!==app.MOD.id){app.bases[id]=v;saveGrp();useMod(id);return;}
  setView(v);if(!(app.tab==='play'&&app.G&&app.G.focus))resetZoom(true);
  if(app.tab==='explore'&&app.sel)selectBone(app.sel);
  // in gioco, con la figura ingrandita su una zona, la si ritrova anche nell'altra vista (la mano dorsale è speculare)
  else if(app.tab==='play'&&app.G&&app.G.focus)setTimeout(()=>focusItem(app.G.focus,app.G.mode==='puzzle'?10:14,true),30);return;}
 if(e.target.closest('#vmenu'))return;
 closeViewMenu();
 // singole o gruppi: cambia le voci dei giochi, quindi la partita in corso ricomincia dal menu
 if(e.target.closest('[data-fg]')){app.grp=!app.grp;saveGrp();const t=app.tab;buildFig();setTab(t);return;}
 if(e.target.closest('.tbar'))return;
 if(takePan())return;
 // sid: struttura singola toccata; con i gruppi la voce è il suo gruppo
 const G=app.G,g=app.tab==='play'&&G&&G.mode==='puzzle'&&G.sel?slotAt(e.clientX,e.clientY,G.sel):boneAt(e.clientX,e.clientY);if(!g)return;const sid=g.dataset.id;
 if(app.tab==='explore')selectBone(itemOf(sid));
 else if(app.tab==='play'&&G){
  if(G.mode==='puzzle')placeAttempt(itemOf(sid));
  else if(G.cur&&G.cur.t==='find')answerFind(sid);
  else if(G.cur&&G.cur.t==='bridge')answerBridge(sid);
 }
});
$('panel').addEventListener('click',e=>{
 const t=e.target.closest('button,.row');if(!t)return;
 const G=app.G;
 if(t.classList.contains('mc')&&t.dataset.sb){selectBone(t.dataset.sb);focusItem(t.dataset.sb,20);}
 else if(t.classList.contains('mc')){const m=app.M.find(x=>x.id===t.dataset.m);const ok=showMuscle(m);$('mdet').innerHTML=muscleHtml(m)+(ok?'':'<p class="mut">Da questa vista i punti di attacco non si vedono: prova l\'altra vista.</p>');}
 else if(t.classList.contains('mode')){const m=t.dataset.mode;if(m.startsWith('3d-'))play3d(m.slice(3));else startGame(m);}
 else if(t.classList.contains('opt')&&G&&G.cur.t==='musc')answerMusc(t.dataset.id);
 else if(t.classList.contains('opt')&&G&&G.cur.t==='func')answerFunc(t.dataset.id);
 else if(t.classList.contains('opt')&&G&&G.cur.t==='nc')answerNc(t.dataset.k);
 else if(t.classList.contains('act')){const a=t.dataset.act;if(a==='ncl')showNc();else if(a==='inst')installNow();else if(a==='insthelp')showInstall();else if(a==='prompt')promptInstall();else renderExplore();}
 else if(t.classList.contains('opt')&&G&&G.cur.t==='case')answerCase(t.dataset.o);
 else if(t.classList.contains('more')&&G&&G.cur.t==='case'){G.cur.clues++;casePanel();}
 else if(t.classList.contains('undo')&&G&&G.cur.t==='bridge'){G.cur.step=0;G.cur.first=null;clearMarks();bridgePrompt();}
 else if(t.classList.contains('next'))nextQ();
 else if(t.classList.contains('again'))startGame(G.mode);
 else if(t.classList.contains('menu'))renderMenu();
 else if(t.classList.contains('row')){if(t.dataset.mod&&t.dataset.mod!==app.MOD.id){app.tab='explore';useMod(t.dataset.mod);}setTab('explore');selectBone(t.dataset.id);}
});
