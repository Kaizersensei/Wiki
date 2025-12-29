const fs = require('fs');
const data = JSON.parse(fs.readFileSync('pages/retraissance/densetsu/universe/lexicon-data.json','utf8'));
const order=['overview','world','locations','concepts','cultures','events','characters','creatures','enemies','factions','artifacts'];
const groups={};
const seenHref=new Set();
for (const e of data){
  if(!e.Href) continue;
  if(e.Href.includes('..')) continue;
  if(!e.Href.includes('/')) continue; // skip root singles like index
  if(seenHref.has(e.Href)) continue; // dedupe
  seenHref.add(e.Href);
  const top=e.Href.split('/')[0]||'misc';
  (groups[top]=groups[top]||[]).push(e);
}
const seen=new Set();
const title=s=>s.replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const lines=[];
const add=(cat,list)=>{
  lines.push(`        <h3>${title(cat)}</h3>`);
  lines.push('        <ul>');
  list.sort((a,b)=>(a.Name||'').localeCompare(b.Name||''));
  for (const e of list){
    lines.push(`          <li><a href="densetsu/universe/${e.Href}">${e.Name||e.Href}</a></li>`);
  }
  lines.push('        </ul>');
};
for (const cat of order){
  if(groups[cat]){ seen.add(cat); add(cat,groups[cat]); delete groups[cat]; }
}
for (const cat of Object.keys(groups).sort()){
  add(cat,groups[cat]);
}
fs.writeFileSync('temp_sitemap_block.txt', lines.join('\n'));
