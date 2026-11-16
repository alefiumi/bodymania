/* Stato condiviso dell'app e salvataggio locale. */
import {$} from './util.js';

// Modulo e partita correnti. MODS e NC arrivano da content/ all'avvio.
export const app={MODS:{},NC:[],MOD:null,B:[],M:[],CASES:[],VB:{x:0,y:0,w:300,h:640},tab:'explore',sel:null,G:null};
export const bone=id=>app.B.find(b=>b.id===id);

const KEY='bodymania-v1';
export const S={xp:0,streak:0,last:'',mastery:{},ok:0,ko:0};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
export const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
const ymd=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
export function touchStreak(){const t=ymd(new Date());if(S.last===t)return;S.streak=(S.last===ymd(new Date(Date.now()-864e5)))?S.streak+1:1;S.last=t;}
const TITLES=['Matricola','Tirocinante','Studente di fisio','Terapista junior','Terapista esperto','Maestro di anatomia'];
export function head(){const L=Math.floor(Math.sqrt(S.xp/30))+1,a=30*(L-1)**2,b=30*L**2;
 $('lv').textContent='Liv. '+L+' · '+TITLES[Math.min(TITLES.length-1,L-1)];
 $('xpb').style.width=((S.xp-a)/(b-a)*100)+'%';$('st').textContent='🔥 '+S.streak+'  ⭐ '+S.xp;}
export const bump=(id,d)=>{if(!id)return;S.mastery[id]=Math.max(0,Math.min(3,(S.mastery[id]||0)+d));};
