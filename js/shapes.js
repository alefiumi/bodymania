/* Trasforma le descrizioni delle forme dei file content/*.json in SVG.
   Ogni forma è un oggetto con una sola chiave, per esempio {"poly":"M10 10 L20 20Z"} o {"ln":[x1,y1,x2,y2,spessore]}. */
const ln=(x1,y1,x2,y2,w)=>`<line class="l" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/><line class="hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w+14}"/>`;
const pth=(d,w)=>`<path class="l" d="${d}" stroke-width="${w}"/><path class="hit" d="${d}" stroke-width="${w+12}"/>`;
const ell=(cx,cy,rx,ry)=>`<ellipse class="f" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><ellipse class="hitf" cx="${cx}" cy="${cy}" rx="${rx+6}" ry="${ry+6}"/>`;
const poly=d=>`<path class="f" d="${d}"/>`;
const stack=(x,y,w,h,n)=>{let s='';const g=1.2,hh=(h-g*(n-1))/n;for(let i=0;i<n;i++)s+=`<rect class="f" x="${x}" y="${(y+i*(hh+g)).toFixed(1)}" width="${w}" height="${hh.toFixed(1)}" rx="2"/>`;return s;};
const circle=(cx,cy,r)=>`<circle class="f" cx="${cx}" cy="${cy}" r="${r}"/>`;
const hole=(cx,cy,rx,ry)=>`<ellipse class="hole" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;

const KINDS={ln,pth,ell,poly,stack,circle,hole};

export function renderShape(list){
 return list.map(o=>{
  const [k,v]=Object.entries(o)[0],f=KINDS[k];
  if(!f)throw new Error('Forma sconosciuta: '+k);
  return Array.isArray(v)?f(...v):f(v);
 }).join('');
}
