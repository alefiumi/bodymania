/* Scheda Profilo: foto, nome, ruolo e presentazione (modificabili), statistiche, badge, account, maestria. */
import {$,toast} from './util.js';
import {app,S,level,items} from './state.js';
import {account as A,accountHtml,saveProfile,NAME_RE,NAME_RULE,esc} from './account.js';
import {BADGES} from './badges.js';

let editing=false,draft=null;
const ROLES=['Studente di fisioterapia','Fisioterapista','Studente di medicina','Medico','Studente di scienze motorie','Chinesiologo','Altro'];
const avatar=(src,name,cls='av')=>src?`<img class="${cls}" src="${esc(src)}" alt="">`:`<div class="${cls}">${esc((name||'?').trim().charAt(0).toUpperCase()||'?')}</div>`;
const day=iso=>new Date(iso).toLocaleDateString('it',{day:'numeric',month:'short',year:'numeric'});

export function renderProg(){
 const p=S.prof,{L,title}=level(),B=app.B,tot=S.ok+S.ko,st=S.stats||{};
 const name=p.name||(A.user?'':'Ospite'),got=BADGES.filter(b=>S.badges[b.id]);
 const card=editing?editHtml():`<div class="pf">${avatar(p.avatar,name)}<div class="pfi"><div class="h">${esc(name)||'<span class="mut">Senza nome</span>'}</div>
   <div class="mut">Liv. ${L} · ${title}${p.role?' · '+esc(p.role):''}</div>${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}
   <button class="chip" data-pf="edit">✏️ Modifica profilo</button></div></div>`;
 const stat=(v,l)=>`<div><b>${v}</b><span>${l}</span></div>`;
 const stats=`<div class="stats">${stat(S.xp,'XP')}${stat(S.streak,'giorni di fila')}${stat(tot?Math.round(S.ok/tot*100)+'%':'–','precisione')}${stat(st.games||0,'partite')}</div>`;
 const badges=`<div class="sub">Badge e traguardi · ${got.length}/${BADGES.length}</div><div class="bdg">`+
  BADGES.map(b=>{const d=S.badges[b.id];return `<div class="b${d?'':' lock'}" title="${esc(b.desc)}"><i>${b.icon}</i><b>${esc(b.name)}</b><small>${d?day(d):esc(b.desc)}</small></div>`;}).join('')+'</div>';
 const IL=items().filter(b=>!b.area),mastered=IL.filter(b=>(S.mastery[b.id]||0)>=3).length;
 // in ordine di gruppo (dalla testa ai piedi per le ossa, per lobo nel cervello)
 const ord=Object.fromEntries(app.GR.map((g,i)=>[g.id,i]));
 const rows=IL.slice().sort((a,b)=>(ord[a.group?a.id:a.g]??99)-(ord[b.group?b.id:b.g]??99)).map(b=>{const m=S.mastery[b.id]||0;return `<div class="row" data-id="${b.id}"><span>${b.n}</span><span class="dots">${'●'.repeat(m)}<span style="color:var(--line)">${'●'.repeat(3-m)}</span></span></div>`;}).join('');
 $('panel').innerHTML=card+stats+badges+accountHtml()+
  `<div class="sub">Maestria · ${esc(app.MOD.label||app.MOD.id)}</div><p class="mut">${mastered}/${IL.length} ${app.grp?'gruppi':'strutture'} padroneggiat${app.grp?'i':'e'}. ${tot?'':'Gioca un round per iniziare a riempire i progressi.'}</p>${rows}`;
}

function editHtml(){
 const d=draft,login=!!A.user;
 return `<form class="pfe" data-pf="save"><div class="pf">${avatar(d.avatar,d.name)}<div class="pfi">
   <label class="chip">📷 ${d.avatar?'Cambia foto':'Aggiungi foto'}<input type="file" accept="image/*" data-pf="photo" hidden></label>
   ${d.avatar?'<button type="button" class="chip" data-pf="nophoto">Togli foto</button>':''}</div></div>
  <label>Nome${login?' utente':''}<input name="name" value="${esc(d.name)}" maxlength="20" ${login?'pattern="[A-Za-z0-9_.]{3,20}" required':''} autocomplete="nickname"></label>
  ${login?`<p class="note">${NAME_RULE} Deve essere libero: è quello che vedono gli amici.</p>`:''}
  <label>Ruolo<input name="role" value="${esc(d.role)}" maxlength="40" list="roles" placeholder="Es. Studente di fisioterapia"></label>
  <datalist id="roles">${ROLES.map(r=>`<option value="${r}">`).join('')}</datalist>
  <label>Presentazione<textarea name="bio" maxlength="160" rows="2" placeholder="Due righe su di te (facoltativo)">${esc(d.bio)}</textarea></label>
  ${A.err?`<p class="err">${esc(A.err)}</p>`:''}
  <button class="btn"${A.busy?' disabled':''}>${A.busy?'Salvo…':'Salva'}</button><button type="button" class="btn alt" data-pf="cancel">Annulla</button>
  ${login?'':'<p class="note">Senza account il profilo resta su questo dispositivo.</p>'}</form>`;
}

// foto: ritaglio quadrato al centro, 128×128 JPEG (circa 5–10 KB), così sta nel profilo e si vede anche offline
function shrink(file){
 return new Promise((ok,ko)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const s=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=128;
   c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,128,128);URL.revokeObjectURL(url);ok(c.toDataURL('image/jpeg',.82));};
  img.onerror=()=>{URL.revokeObjectURL(url);ko(new Error('Immagine non leggibile.'));};img.src=url;
 });
}
const formVals=()=>{const f=$('panel').querySelector('form.pfe');if(f){draft.name=f.elements.name.value.trim();draft.role=f.elements.role.value.trim();draft.bio=f.elements.bio.value.trim();}};

export function wireProfile(panel){
 panel.addEventListener('click',e=>{
  const b=e.target.closest('[data-pf]');if(!b||b.tagName==='FORM'||b.tagName==='INPUT')return;const k=b.dataset.pf;
  if(k==='edit'){editing=true;A.err='';A.msg='';draft={name:S.prof.name||'',role:S.prof.role||'',bio:S.prof.bio||'',avatar:S.prof.avatar||''};renderProg();}
  else if(k==='cancel'){editing=false;A.err='';renderProg();}
  else if(k==='nophoto'){formVals();draft.avatar='';renderProg();}
 });
 panel.addEventListener('change',async e=>{
  const i=e.target.closest('input[data-pf="photo"]');if(!i||!i.files[0])return;
  formVals();try{draft.avatar=await shrink(i.files[0]);}catch(x){toast(x.message);}renderProg();
 });
 panel.addEventListener('submit',async e=>{
  const f=e.target.closest('form[data-pf="save"]');if(!f)return;e.preventDefault();formVals();
  if(A.user&&!NAME_RE.test(draft.name)){A.err=NAME_RULE;renderProg();return;}
  await saveProfile({...draft});
  if(!A.err){editing=false;toast('Profilo salvato.');}
  renderProg();
 });
}
// il profilo si ridisegna quando cambia l'account: durante la modifica si tengono i campi già scritti
export function refreshProg(){if(app.tab!=='prog')return;if(editing)formVals();renderProg();}
