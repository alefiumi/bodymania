/* Tab Esplora: scheda della struttura e nervi cranici. */
import {$} from './util.js';
import {app,bone} from './state.js';
import {clearMarks,mark} from './figure.js';

export function renderExplore(){
 app.sel=null;const body=app.MOD.id==='corpo';
 $('panel').innerHTML=`<div class="h">${body?'Esplora lo scheletro':'Esplora il cervello'}</div><p class="mut">${body?'Tocca un osso per vedere nome, funzione, note cliniche e muscoli collegati. Tocca un muscolo per vedere origine (O) e inserzione (I) sulla figura.':'Tocca una struttura per vedere nome, funzione e note cliniche. Cambia vista in alto a sinistra.'} Usa ＋ − o pizzica per ingrandire.</p>`+(body?'':'<button class="btn alt act" data-act="ncl">📖 Nervi cranici</button>')+`<div class="leg">Colori: beige/pastello = da studiare · verde = in corso · oro = padroneggiato</div>`;
}
export function showNc(){
 clearMarks();
 $('panel').innerHTML=`<div class="h">I 12 nervi cranici</div>`+app.NC.map(n=>`<div class="nrow" style="display:flex;justify-content:space-between;padding-top:8px"><span><b>${n.n}</b> ${n.nm}</span><span class="mut">${n.t}</span></div><div class="mut" style="padding-bottom:6px;border-bottom:1px solid var(--line)">${n.f}</div>`).join('')+'<button class="btn alt act" data-act="back">Indietro</button>';
}
export function selectBone(id){
 app.sel=id;clearMarks();mark(id,'sel');const b=bone(id);
 const ms=app.M.filter(m=>[m.o,m.i,...(m.oa||[]),...(m.ia||[])].includes(id));
 const role=m=>{const o=m.o===id||(m.oa||[]).includes(id),i=m.i===id||(m.ia||[]).includes(id);return o&&i?'origine · inserzione':o?'origine':'inserzione';};
 $('panel').innerHTML=`<div class="h">${b.n} <i>${b.l}</i></div><div class="mut">${b.r}</div><p>${b.f}</p><p class="tip">🩺 ${b.k}</p>`+
 (ms.length?`<div class="sub">Muscoli collegati (tocca)</div><div class="chips">${ms.map(m=>`<button class="mc" data-m="${m.id}">${m.n} <small>${role(m)}</small></button>`).join('')}</div>`:'')+`<div id="mdet"></div>`;
}
