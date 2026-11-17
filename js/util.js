export const $=id=>document.getElementById(id);
export const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const pick=a=>a[Math.floor(Math.random()*a.length)];
// avviso in basso per qualche secondo
export function toast(msg,ms=6000){
 const t=document.createElement('div');t.id='toast';t.textContent=msg;
 document.getElementById('toast')?.remove();document.body.appendChild(t);setTimeout(()=>t.remove(),ms);
}
