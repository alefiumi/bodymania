/* Stato condiviso dell'app e salvataggio locale. */
import {$} from './util.js';

// Modulo e partita correnti. MODS e NC arrivano da content/ all'avvio.
export const app={MODS:{},NC:[],MOD:null,B:[],M:[],CASES:[],VB:{x:0,y:0,w:300,h:640},tab:'explore',sel:null,G:null};
export const bone=id=>app.B.find(b=>b.id===id);

const KEY='bodymania-v1';
// stats: partite finite (per i badge); badges: {id: data}; prof: profilo locale (nome, ruolo, bio, foto, t = ultima modifica)
export const S={xp:0,streak:0,last:'',mastery:{},ok:0,ko:0,stats:{games:0,perfect:0,modes:{},mods:{}},badges:{},prof:{}};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
// dopo ogni salvataggio l'account (se c'è) invia i progressi: account.js registra la funzione, qui niente import circolari
const afterSave=[];export const onSave=f=>{afterSave.push(f);};
export const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}afterSave.forEach(f=>f());};
// partite finite in attesa di invio al server (solo con un account; senza account restano qui e non vanno da nessuna parte)
const QKEY='bodymania-queue';
export const queue={
 all(){try{return JSON.parse(localStorage.getItem(QKEY)||'[]');}catch(e){return [];}},
 set(a){try{localStorage.setItem(QKEY,JSON.stringify(a.slice(-500)));}catch(e){}},
 add(r){recordGame(r);const a=queue.all();a.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random(),played_at:new Date().toISOString(),...r});queue.set(a);}
};
// statistiche delle partite finite, per i badge (js/badges.js)
function recordGame(r){
 const s=S.stats;s.games=(s.games||0)+1;if(r.total>0&&r.score===r.total)s.perfect=(s.perfect||0)+1;
 const k=r.module==='3d'?'3d:'+r.mode:r.mode;(s.modes||(s.modes={}))[k]=(s.modes[k]||0)+1;(s.mods||(s.mods={}))[r.module]=1;
}
const ymd=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
export function touchStreak(){const t=ymd(new Date());if(S.last===t)return;S.streak=(S.last===ymd(new Date(Date.now()-864e5)))?S.streak+1:1;S.last=t;}
const TITLES=['Matricola','Tirocinante','Studente di fisio','Terapista junior','Terapista esperto','Maestro di anatomia'];
export const level=()=>{const L=Math.floor(Math.sqrt(S.xp/30))+1;return {L,title:TITLES[Math.min(TITLES.length-1,L-1)]};};
export function head(){const {L,title}=level(),a=30*(L-1)**2,b=30*L**2;
 $('lv').textContent='Liv. '+L+' · '+title;
 $('xpb').style.width=((S.xp-a)/(b-a)*100)+'%';$('st').textContent='🔥 '+S.streak+'  ⭐ '+S.xp;}
export const bump=(id,d)=>{if(!id)return;S.mastery[id]=Math.max(0,Math.min(3,(S.mastery[id]||0)+d));};
