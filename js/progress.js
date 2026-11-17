/* Tab Progressi. */
import {$} from './util.js';
import {app,S} from './state.js';
import {accountHtml} from './account.js';

export function renderProg(){
 const B=app.B;
 const mastered=B.filter(b=>(S.mastery[b.id]||0)>=3).length,tot=S.ok+S.ko;
 const rows=B.slice().sort((a,b)=>a.c[1]-b.c[1]).map(b=>{const m=S.mastery[b.id]||0;return `<div class="row" data-id="${b.id}"><span>${b.n}</span><span class="dots">${'●'.repeat(m)}<span style="color:var(--line)">${'●'.repeat(3-m)}</span></span></div>`;}).join('');
 $('panel').innerHTML=accountHtml()+`<div class="h">${mastered}/${B.length} ossa padroneggiate</div><p class="mut">${tot?`Precisione: ${Math.round(S.ok/tot*100)}% su ${tot} risposte · Serie: ${S.streak} giorni`:'Gioca un round per iniziare a riempire i progressi.'}</p>${rows}`;
}
