/* Cambio di modulo e di tab, gestione dei clic su figura, pannello e barra in basso. */
import {$} from './util.js';
import {app} from './state.js';
import {buildFig,boneAt,clearMarks,refreshMastery,resetZoom,zoomAt,showMuscle,muscleHtml,takePan} from './figure.js';
import {renderExplore,showNc,selectBone} from './explore.js';
import {renderMenu,clearGhosts,startGame,nextQ,answerFind,answerMusc,answerBridge,answerFunc,answerNc,answerCase,bridgePrompt,casePanel} from './game.js';
import {placeAttempt} from './puzzle.js';
import {renderProg} from './progress.js';

export function useMod(id){
 const MOD=app.MODS[id];
 app.MOD=MOD;app.B=MOD.B;app.M=MOD.M;app.CASES=MOD.CASES;app.VB={x:0,y:0,w:MOD.W,h:MOD.H};app.G=null;app.sel=null;
 buildFig();setTab(app.tab);
}
function setTab(t){
 app.tab=t;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 clearGhosts();clearMarks();resetZoom(false);refreshMastery();({explore:renderExplore,play:renderMenu,prog:renderProg})[t]();
}
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.t);});
$('fig').addEventListener('click',e=>{
 const zb=e.target.closest('.zc button');
 if(zb){const k=zb.dataset.z,VB=app.VB;if(k==='reset')resetZoom(true);else zoomAt(k==='in'?1.5:1/1.5,VB.x+VB.w/2,VB.y+VB.h/2);return;}
 const mb=e.target.closest('.mods button');
 if(mb){useMod(mb.dataset.mod);return;}
 if(takePan())return;
 const g=boneAt(e.clientX,e.clientY);if(!g)return;const id=g.dataset.id,G=app.G;
 if(app.tab==='explore')selectBone(id);
 else if(app.tab==='play'&&G){
  if(G.mode==='puzzle')placeAttempt(id);
  else if(G.cur&&G.cur.t==='find')answerFind(id);
  else if(G.cur&&G.cur.t==='bridge')answerBridge(id);
 }
});
$('panel').addEventListener('click',e=>{
 const t=e.target.closest('button,.row');if(!t)return;
 const G=app.G;
 if(t.classList.contains('mc')){const m=app.M.find(x=>x.id===t.dataset.m);showMuscle(m);$('mdet').innerHTML=muscleHtml(m);}
 else if(t.classList.contains('mode'))startGame(t.dataset.mode);
 else if(t.classList.contains('opt')&&G&&G.cur.t==='musc')answerMusc(t.dataset.id);
 else if(t.classList.contains('opt')&&G&&G.cur.t==='func')answerFunc(t.dataset.id);
 else if(t.classList.contains('opt')&&G&&G.cur.t==='nc')answerNc(t.dataset.k);
 else if(t.classList.contains('act')){if(t.dataset.act==='ncl')showNc();else renderExplore();}
 else if(t.classList.contains('opt')&&G&&G.cur.t==='case')answerCase(t.dataset.o);
 else if(t.classList.contains('more')&&G&&G.cur.t==='case'){G.cur.clues++;casePanel();}
 else if(t.classList.contains('undo')&&G&&G.cur.t==='bridge'){G.cur.step=0;G.cur.first=null;clearMarks();bridgePrompt();}
 else if(t.classList.contains('next'))nextQ();
 else if(t.classList.contains('again'))startGame(G.mode);
 else if(t.classList.contains('menu'))renderMenu();
 else if(t.classList.contains('row')){setTab('explore');selectBone(t.dataset.id);}
});
