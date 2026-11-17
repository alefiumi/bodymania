/* Account facoltativo (Supabase): senza account si gioca come sempre e tutto resta sul dispositivo.
   Con l'account i progressi locali si uniscono a quelli del server (si tiene il valore più alto) e le partite finite
   partono dalla coda locale (state.queue) quando c'è rete. La libreria si carica solo se serve. */
import {$} from './util.js';
import {S,save,head,onSave,queue} from './state.js';
import {SUPABASE_URL,SUPABASE_KEY} from './config.js';

export const configured=!!(SUPABASE_URL&&SUPABASE_KEY);
const A={sb:null,user:null,profile:null,busy:false,msg:'',err:'',view:'',lastSync:null,syncing:false};
let onChange=()=>{};
export const account=A;
export const setAccountListener=f=>{onChange=f;};

// la sessione salvata da supabase-js: se c'è (o si torna dal login con Google) si carica subito la libreria
const ref=configured?new URL(SUPABASE_URL).hostname.split('.')[0]:'';
const hasSession=()=>{try{return !!localStorage.getItem('sb-'+ref+'-auth-token');}catch(e){return false;}};
const backFromOAuth=()=>/[?&#](code|access_token|error_description)=/.test(location.search+location.hash);

function loadLib(){
 if(window.supabase)return Promise.resolve();
 return new Promise((ok,ko)=>{const s=document.createElement('script');s.src='vendor/supabase.js';s.onload=ok;s.onerror=()=>ko(new Error('libreria non caricata'));document.head.appendChild(s);});
}
async function client(){
 if(A.sb)return A.sb;
 await loadLib();
 A.sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
 A.sb.auth.onAuthStateChange((ev,session)=>{
  if(ev==='PASSWORD_RECOVERY'){A.view='pw';A.msg='Scegli la nuova password.';}
  const u=session?session.user:null,changed=(u&&u.id)!==(A.user&&A.user.id);A.user=u;
  if(!u){A.profile=null;onChange();return;}
  if(changed)setTimeout(()=>sync(true),0); // fuori dalla callback, come chiede supabase-js
 });
 return A.sb;
}
export async function initAccount(){
 if(!configured)return;
 onSave(()=>syncSoon());
 addEventListener('online',()=>syncSoon(0));
 if(hasSession()||backFromOAuth()){
  try{const sb=await client();const {data}=await sb.auth.getSession();A.user=data.session?data.session.user:null;}
  catch(e){A.err='Account non raggiungibile: si continua in locale.';}
  // toglie dall'indirizzo il codice del ritorno da Google
  if(backFromOAuth())history.replaceState(null,'',location.pathname);
  if(A.user)sync(true);else onChange();
 }
}

/* ---------- accesso ---------- */
const ERR={'Invalid login credentials':'Email o password sbagliate.','Email not confirmed':'Conferma prima l\'email: ti abbiamo mandato un link.',
 'User already registered':'Questa email è già registrata: accedi.','Password should be at least 6 characters.':'La password deve avere almeno 6 caratteri.'};
const it=e=>ERR[e&&e.message]||(!navigator.onLine?'Serve la connessione.':/fetch|network|load failed/i.test(e&&e.message||'')?'Server non raggiungibile: riprova tra poco.':(e&&e.message)||'Errore');
async function run(f){A.busy=true;A.err='';A.msg='';onChange();try{await f();}catch(e){A.err=it(e);}A.busy=false;onChange();}
export const signIn=(email,pw)=>run(async()=>{const {error}=await (await client()).auth.signInWithPassword({email,password:pw});if(error)throw error;A.view='';});
export const signUp=(email,pw)=>run(async()=>{
 const {data,error}=await (await client()).auth.signUp({email,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;
 if(!data.session)A.msg='Ti abbiamo mandato un\'email: tocca il link per confermare, poi accedi qui.';A.view=data.session?'':'login';
});
export const google=()=>run(async()=>{const {error}=await (await client()).auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;});
export const resetPw=email=>run(async()=>{const {error}=await (await client()).auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;A.msg='Se l\'email è registrata, ti arriva un link per scegliere una nuova password.';});
export const signOut=()=>run(async()=>{await (await client()).auth.signOut({scope:'local'});A.user=null;A.profile=null;A.view='';A.msg='Sei uscito: i progressi restano su questo dispositivo.';});
export const setUsername=name=>run(async()=>{
 if(!/^[A-Za-z0-9_.]{3,20}$/.test(name))throw new Error('Da 3 a 20 caratteri: lettere, numeri, punto e trattino basso.');
 const {error}=await A.sb.from('profiles').update({username:name}).eq('id',A.user.id);
 if(error)throw new Error(error.code==='23505'?'Questo nome è già preso.':error.message);
 A.profile.username=name;
});
export const setNewPassword=pw=>run(async()=>{const {error}=await A.sb.auth.updateUser({password:pw});if(error)throw error;A.msg='Password cambiata.';A.view='';});

/* ---------- sincronizzazione ---------- */
let timer=null;
export function syncSoon(ms=3000){if(!A.user)return;clearTimeout(timer);timer=setTimeout(()=>sync(false),ms);}
const later=(a,b)=>!a?b:!b?a:(a>b?a:b);
const ymdIso=s=>{if(!s)return null;const [y,m,d]=s.split('-').map(Number);return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;};
const ymdApp=s=>{if(!s)return '';const [y,m,d]=s.split('-').map(Number);return `${y}-${m}-${d}`;}; // formato di state.js
// full: all'accesso legge anche il server e unisce; poi basta inviare
export async function sync(full){
 if(!A.user||A.syncing||!navigator.onLine)return;
 A.syncing=true;
 try{
  const sb=A.sb,uid=A.user.id;
  if(full||!A.profile){
   const [{data:p,error:e1},{data:ms,error:e2}]=await Promise.all([sb.from('profiles').select('*').eq('id',uid).single(),sb.from('mastery').select('item_id,level')]);
   if(e1)throw e1;if(e2)throw e2;
   A.profile=p;
   // unione: si tiene il valore più alto (o il giorno più recente per la serie)
   S.xp=Math.max(S.xp,p.xp);S.ok=Math.max(S.ok,p.ok);S.ko=Math.max(S.ko,p.ko);
   const srv=ymdIso(p.last_day),loc=ymdIso(S.last);
   if(srv&&(!loc||srv>loc)){S.last=ymdApp(p.last_day);S.streak=p.streak;}else if(srv===loc)S.streak=Math.max(S.streak,p.streak);
   for(const m of ms||[])S.mastery[m.item_id]=Math.max(S.mastery[m.item_id]||0,m.level);
   try{localStorage.setItem('bodymania-v1',JSON.stringify(S));}catch(e){} // senza save(): non deve ripartire un invio
   head();
  }
  const prof={xp:S.xp,streak:S.streak,last_day:ymdIso(S.last),ok:S.ok,ko:S.ko,updated_at:new Date().toISOString()};
  const {error:e3}=await sb.from('profiles').update(prof).eq('id',uid);if(e3)throw e3;Object.assign(A.profile,prof);
  const rows=Object.entries(S.mastery).map(([item_id,level])=>({user_id:uid,item_id,level,updated_at:new Date().toISOString()}));
  if(rows.length){const {error:e4}=await sb.from('mastery').upsert(rows,{onConflict:'user_id,item_id'});if(e4)throw e4;}
  const q=queue.all();
  if(q.length){
   const {error:e5}=await sb.from('game_results').upsert(q.map(r=>({id:r.id,user_id:uid,module:r.module,mode:r.mode,score:r.score,total:r.total,xp:r.xp,played_at:r.played_at})),{onConflict:'id',ignoreDuplicates:true});
   if(e5)throw e5;
   const sent=new Set(q.map(r=>r.id));queue.set(queue.all().filter(r=>!sent.has(r.id)));
  }
  A.lastSync=new Date();A.err='';
 }catch(e){A.err='Sincronizzazione non riuscita: riprovo più tardi. ('+(e.message||e)+')';}
 A.syncing=false;onChange();
}

/* ---------- pannello Account (in Progressi) ---------- */
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function accountHtml(){
 if(!configured)return `<div class="acc"><div class="sub">Account</div><p class="mut">Stai giocando senza account: i progressi restano su questo dispositivo.</p></div>`;
 const note=(A.err?`<p class="err">${esc(A.err)}</p>`:'')+(A.msg?`<p class="okm">${esc(A.msg)}</p>`:'');
 if(A.user&&A.profile&&!A.profile.username)
  return `<div class="acc"><div class="sub">Account</div><p>Scegli il nome che vedranno gli amici nelle classifiche.</p>${note}
   <form data-acc="name"><input name="u" placeholder="Nome utente" autocomplete="username" maxlength="20" required><button class="btn"${A.busy?' disabled':''}>Salva</button></form></div>`;
 if(A.user)
  return `<div class="acc"><div class="sub">Account</div><p><b>${esc(A.profile?A.profile.username:'…')}</b> <span class="mut">${esc(A.user.email||'')}</span></p>${note}
   <p class="mut">${A.syncing?'Sincronizzo…':A.lastSync?'Progressi salvati anche online alle '+A.lastSync.toLocaleTimeString('it',{hour:'2-digit',minute:'2-digit'})+'.':navigator.onLine?'':'Senza connessione: invio appena torna la rete.'}${queue.all().length?' Partite in attesa di invio: '+queue.all().length+'.':''}</p>
   ${A.view==='pw'?`<form data-acc="newpw"><input name="p" type="password" placeholder="Nuova password" autocomplete="new-password" minlength="6" required><button class="btn"${A.busy?' disabled':''}>Cambia</button></form>`:''}
   <div class="chips"><button class="chip" data-acc="sync">Sincronizza ora</button><button class="chip" data-acc="pw">Cambia password</button><button class="chip" data-acc="out">Esci</button></div></div>`;
 const form=A.view==='login'||A.view==='signup'||A.view==='reset';
 return `<div class="acc"><div class="sub">Account</div>
  <p class="mut">Stai giocando senza account: i progressi restano su questo dispositivo. Con un account li ritrovi su altri dispositivi e potrai entrare nelle classifiche con gli amici.</p>${note}
  ${!form?`<div class="chips"><button class="chip on" data-acc="signup">Registrati</button><button class="chip" data-acc="login">Accedi</button><button class="chip" data-acc="google">Accedi con Google</button></div>`:
  `<form data-acc="${A.view}"><input name="e" type="email" placeholder="Email" autocomplete="email" required>
   ${A.view!=='reset'?`<input name="p" type="password" placeholder="Password${A.view==='signup'?' (almeno 6 caratteri)':''}" autocomplete="${A.view==='signup'?'new-password':'current-password'}" minlength="6" required>`:''}
   <button class="btn"${A.busy?' disabled':''}>${A.view==='signup'?'Crea account':A.view==='login'?'Accedi':'Mandami il link'}</button></form>
   <div class="chips">${A.view==='login'?'<button class="chip" data-acc="reset">Password dimenticata?</button>':''}<button class="chip" data-acc="google">Accedi con Google</button><button class="chip" data-acc="back">Annulla</button></div>
   <p class="note">I progressi già fatti su questo dispositivo si uniscono a quelli dell'account.</p>`}</div>`;
}
// clic e invio dei moduli nel pannello (delegati: il pannello si ridisegna spesso)
export function wireAccount(panel){
 panel.addEventListener('click',e=>{
  const b=e.target.closest('button[data-acc]');if(!b||b.closest('form'))return;const k=b.dataset.acc;
  A.err='';A.msg='';
  if(k==='google')google();
  else if(k==='out')signOut();
  else if(k==='sync')sync(true);
  else if(k==='back'){A.view='';onChange();}
  else{A.view=A.view==='pw'&&k==='pw'?'':k;onChange();}
 });
 panel.addEventListener('submit',e=>{
  const f=e.target.closest('form[data-acc]');if(!f)return;e.preventDefault();const v=n=>(f.elements[n]?f.elements[n].value:'').trim(),k=f.dataset.acc;
  if(k==='login')signIn(v('e'),f.elements.p.value);
  else if(k==='signup')signUp(v('e'),f.elements.p.value);
  else if(k==='reset')resetPw(v('e'));
  else if(k==='name')setUsername(v('u'));
  else if(k==='newpw')setNewPassword(f.elements.p.value);
 });
}
