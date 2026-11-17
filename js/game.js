/* Tab Gioca: menu, quiz, Tendine-ponte, Caso clinico, fine partita. */
import {$,shuffle,pick} from './util.js';
import {app,S,bone,save,touchStreak,head,bump} from './state.js';
import {clearMarks,mark,refreshMastery,resetZoom,showMuscle,muscleHtml} from './figure.js';
import {startPuzzle} from './puzzle.js';

export function renderMenu(){
 app.G=null;clearGhosts();const body=app.MOD.id==='corpo';
 const mb=(m,t,x)=>`<button class="mode" data-mode="${m}"><b>${t}</b><small>${x}</small></button>`;
 $('panel').innerHTML=`<div class="h">Scegli una sfida</div><p class="mut">3 cuori a round. Ogni risposta giusta dà XP e fa salire la maestria (da beige a oro).</p><div class="sub">Puzzle</div>`+
  mb('puzzle','🧩 Ricomponi','Rimetti al posto i pezzi mancanti (trascina o tocca)')+
  (body?mb('bridge','🌉 Tendine-ponte',"Collega l'osso di origine a quello di inserzione"):'')+
  mb('case','🩺 Caso clinico','Indizi progressivi: meno indizi usi, più XP')+
  '<div class="sub">Quiz</div>'+mb('find','🎯 Trova la struttura','Tocca quella giusta sulla figura')+
  (body?mb('musc','💪 Origine e inserzione','Collega ogni muscolo al suo osso'):mb('func','🧠 Funzione → struttura','Quale struttura svolge questa funzione?')+mb('nc','🔢 Nervi cranici','Nome, numero e funzione dei 12 nervi'))+
  mb('mix','🔀 Misto',"Un po' di tutto")+
  // giochi sul modello 3D: si giocano nella scheda Atlante 3D (vedi play3d in ui.js)
  '<div class="sub">Sul modello 3D</div>'+mb('3d-ossa','🦴 Trova l\'osso','Tocca l\'osso giusto sul modello 3D')+
  mb('3d-muscoli','💪 Trova il muscolo','Tocca il muscolo giusto tra quelli visibili')+
  mb('3d-reperi','📍 Trova il repere','Tocca il repere osseo giusto (SIAS, epicondili…)')+
  mb('3d-oi','🎯 Origine e inserzione','Tocca sull\'osso il punto esatto dove il muscolo si attacca');
}
export const clearGhosts=()=>document.querySelectorAll('.bone.ghost').forEach(g=>g.classList.remove('ghost'));
export function startGame(mode){
 app.G={mode,q:0,total:mode==='case'?6:8,hearts:3,score:0,gain:0,last:null,cur:null,locked:false,used:[],att:0,left:[]};
 if(mode==='puzzle')return startPuzzle();
 nextQ();
}
export const gh=()=>{const G=app.G;return `<div class="gh"><span>${'❤️'.repeat(G.hearts)}${'🖤'.repeat(3-G.hearts)}</span><span>${Math.min(G.q+1,G.total)}/${G.total}</span></div>`;};
export function nextQ(){
 const G=app.G,{B,M,CASES,NC}=app;
 clearMarks();
 if(G.hearts<=0||G.q>=G.total)return endGame();
 const t=G.mode==='mix'?pick(app.MOD.id==='corpo'?['find','musc','bridge']:['find','func','nc']):G.mode;G.locked=false;resetZoom(true);
 if(t==='find'){
  let b;do{b=pick(B);}while(b.id===G.last);G.last=b.id;G.cur={t,id:b.id};
  $('panel').innerHTML=gh()+`<div class="q">Tocca sulla figura:<br><b>${b.n}</b> <i>${b.l}</i></div>`;
 }else if(t==='func'){
  let b;do{b=pick(B);}while(b.id===G.last);G.last=b.id;
  const opts=shuffle([...shuffle(B.filter(x=>x.id!==b.id)).slice(0,3).map(x=>x.id),b.id]);G.cur={t,id:b.id};
  $('panel').innerHTML=gh()+`<div class="q"><small>Funzione</small><br><b>${b.q}</b><br>Quale struttura?</div>`+opts.map(id=>`<button class="opt" data-id="${id}">${bone(id).n}</button>`).join('');
 }else if(t==='nc'){
  const n=pick(NC),dir=Math.random()<.5,opts=shuffle([...shuffle(NC.filter(x=>x!==n)).slice(0,3),n]);G.cur={t,n};
  $('panel').innerHTML=gh()+(dir?`<div class="q"><small>Nervo cranico</small><br><b>${n.n} – ${n.nm}</b><br>Qual è la sua funzione?</div>`+opts.map(o=>`<button class="opt" data-k="${o.n}">${o.f}</button>`).join(''):`<div class="q"><small>Funzione</small><br><b>${n.f}</b><br>Quale nervo cranico?</div>`+opts.map(o=>`<button class="opt" data-k="${o.n}">${o.n} – ${o.nm}</button>`).join(''));
 }else if(t==='bridge'){
  G.cur={t,m:pick(M),step:0,first:null};bridgePrompt();
 }else if(t==='case'){
  let c;do{c=pick(CASES);}while(G.used.includes(c.id)&&G.used.length<CASES.length);G.used.push(c.id);
  G.cur={t,c,clues:1,opts:shuffle(c.opts)};casePanel();
 }else{
  const m=pick(M),role=Math.random()<.5?'o':'i',ans=m[role],bad=new Set([ans,...(m[role+'a']||[])]);
  const opts=shuffle([...shuffle(B.filter(b=>!bad.has(b.id))).slice(0,3).map(b=>b.id),ans]);
  G.cur={t,m,role,ans};
  $('panel').innerHTML=gh()+`<div class="q"><small>Muscolo</small><br><b>${m.n}</b><br>Qual è la sua ${role==='o'?'origine':'inserzione'}?</div>`+opts.map(id=>`<button class="opt" data-id="${id}">${bone(id).n}</button>`).join('');
 }
}
function settle(ok,target,extra,xp=10){
 const G=app.G;
 G.locked=true;touchStreak();
 if(ok){G.score++;G.gain+=xp;S.xp+=xp;S.ok++;bump(target,1);}else{G.hearts--;S.ko++;bump(target,-1);}
 G.q++;save();head();refreshMastery();
 const last=G.hearts<=0||G.q>=G.total;
 $('panel').innerHTML=gh()+`<div class="h">${ok?'✅ Esatto! +'+xp+' XP':'❌ Non proprio'}</div>${extra}<button class="next">${last?'Vedi risultato':'Avanti'}</button>`;
}
export function answerFind(id){
 const G=app.G;
 if(G.locked)return;const t=bone(G.cur.id),ok=id===t.id;
 mark(id,ok?'ok':'bad');if(!ok)mark(t.id,'ok');
 settle(ok,t.id,`<p>${ok?'':'Hai toccato: <b>'+bone(id).n+'</b>. '}<b>${t.n}</b> – ${t.f}</p><p class="tip">🩺 ${t.k}</p>`);
}
export function answerMusc(id){
 const G=app.G;
 if(G.locked)return;const c=G.cur,ok=id===c.ans;
 showMuscle(c.m);
 settle(ok,c.ans,(ok?'':`<p>Hai scelto: <b>${bone(id).n}</b>.</p>`)+muscleHtml(c.m));
}
export function endGame(){
 const G=app.G;
 clearGhosts();clearMarks();
 const pz=G.mode==='puzzle',n=pz?G.att:G.q,done=G.hearts>0&&(pz?!G.left.length:G.q>=G.total),bonus=done?20:0;S.xp+=bonus;G.gain+=bonus;save();head();
 const acc=n?G.score/n:0,st=acc>=.9?3:acc>=.6?2:1;
 $('panel').innerHTML=`<div class="res"><div class="big">${'⭐'.repeat(st)}${'☆'.repeat(3-st)}</div><div class="h">${G.score}/${n} corrette</div><p>+${G.gain} XP${done?' (bonus round +20)':''}</p>${G.hearts<=0?'<p class="mut">Cuori finiti: ripassa nella sezione Esplora e riprova.</p>':''}<button class="btn again">Rigioca</button><button class="btn alt menu">Cambia sfida</button></div>`;
}

/* ---------- Tendine-ponte ---------- */
export function bridgePrompt(){
 const c=app.G.cur;
 $('panel').innerHTML=gh()+`<div class="q"><small>Costruisci il ponte</small><br><b>${c.m.n}</b><br>${c.step===0?'Tocca l\'osso di <b style="color:#2563eb">ORIGINE</b>':'Ora tocca l\'osso di <b style="color:#ea580c">INSERZIONE</b>'}</div>`+(c.step?'<button class="btn alt undo">Annulla</button>':'');
}
export function answerBridge(id){
 const G=app.G;
 const c=G.cur;if(G.locked)return;
 if(c.step===0){c.first=id;c.step=1;clearMarks();mark(id,'org');bridgePrompt();return;}
 if(id===c.first)return;
 const m=c.m,okO=[m.o,...(m.oa||[])].includes(c.first),okI=[m.i,...(m.ia||[])].includes(id),ok=okO&&okI;
 bump(m.i,ok?1:-1);showMuscle(m);
 if(!okO&&c.first!==m.o&&c.first!==m.i)mark(c.first,'bad');
 if(!okI&&id!==m.o&&id!==m.i)mark(id,'bad');
 const alt=a=>a&&a.length?` <small>(valido anche: ${a.map(x=>bone(x).n).join(', ')})</small>`:'';
 settle(ok,m.o,`<div class="sol"><div><span class="tg o">ORIGINE</span> <b>${bone(m.o).n}</b>${alt(m.oa)} ${okO?'✅':'❌ tu: '+bone(c.first).n}</div><div><span class="tg i">INSERZIONE</span> <b>${bone(m.i).n}</b>${alt(m.ia)} ${okI?'✅':'❌ tu: '+bone(id).n}</div></div>`+muscleHtml(m)+(ok?'':'<p class="mut">Sulla figura: blu = origine corretta, arancione = inserzione corretta, rosso = tua scelta sbagliata.</p>'));
}
export function answerFunc(id){
 const G=app.G;
 if(G.locked)return;const t=bone(G.cur.id),ok=id===t.id;
 mark(t.id,'ok');if(!ok)mark(id,'bad');
 settle(ok,t.id,`<p>${ok?'':'Hai scelto: <b>'+bone(id).n+'</b>. '}<b>${t.n}</b> – ${t.f}</p><p class="tip">🩺 ${t.k}</p>`);
}
export function answerNc(k){
 const G=app.G;
 if(G.locked)return;const n=G.cur.n,ok=k===n.n;
 settle(ok,null,`<p><b>${n.n} – ${n.nm}</b> (${n.t}): ${n.f}.</p>`);
}

/* ---------- Caso clinico (scenari didattici: da verificare su fonti cliniche) ---------- */
export function casePanel(){
 const c=app.G.cur,cs=c.c;
 $('panel').innerHTML=gh()+`<div class="q"><small>Caso clinico</small><br>Chi o cosa è coinvolto?</div>`+cs.clues.slice(0,c.clues).map((x,i)=>`<div class="clue"><b>Indizio ${i+1}.</b> ${x}</div>`).join('')+c.opts.map(o=>`<button class="opt" data-o="${o}">${o}</button>`).join('')+(c.clues<cs.clues.length?'<button class="btn alt more">Altro indizio (−5 XP)</button>':'');
}
export function answerCase(o){
 const G=app.G;
 const c=G.cur,cs=c.c;if(G.locked)return;
 const ok=o===cs.a,xp=[0,15,10,5][c.clues],m=cs.mid?app.M.find(x=>x.id===cs.mid):null;
 if(m)showMuscle(m);else mark(cs.bid,'ok');
 settle(ok,m?m.o:cs.bid,`<p><b>${cs.a}</b>. ${cs.r}</p>`+(m?muscleHtml(m):''),ok?xp:0);
}
