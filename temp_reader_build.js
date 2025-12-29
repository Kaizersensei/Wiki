const fs=require('fs'), path=require('path');
const root=process.cwd();
const base=path.join(root,'pages','retraissance','densetsu');
const startCandidates=[
  '/pages/retraissance/densetsu/universe/overview/index.html',
  '/pages/retraissance/densetsu/universe/index.html',
  '/pages/retraissance/densetsu/index.html'
];
const hrefRe=/href=["']([^"']+)/ig;
const adj={};
const all=[];
function walk(dir){
  const entries=fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name));
  for(const ent of entries){
    if(ent.name.startsWith('.')) continue;
    const full=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(full);
    else if(ent.isFile() && ent.name.toLowerCase().endsWith('.html')){
      const rel=path.relative(path.join(root,'pages'), full).replace(/\\/g,'/');
      const web='/pages/'+rel;
      all.push(web);
      const text=fs.readFileSync(full,'utf8');
      const links=[];
      let m;
      hrefRe.lastIndex=0;
      while((m=hrefRe.exec(text))){
        let href=m[1].trim();
        if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) continue;
        if(href.startsWith('/pages/')){ links.push(href); continue; }
        if(href.startsWith('/')){ links.push('/pages'+href); continue; }
        const baseDir=path.posix.dirname(web);
        let norm=path.posix.normalize(path.posix.join(baseDir, href));
        if(!norm.startsWith('/')) norm='/'+norm;
        links.push(norm);
      }
      adj[web]=links;
    }
  }
}
walk(base);
const visited=new Set();
const order=[];
function dfs(node){
  if(visited.has(node)) return;
  if(!adj[node]) return;
  visited.add(node);
  order.push(node);
  for(const nxt of adj[node]) dfs(nxt);
}
for(const s of startCandidates) dfs(s);
all.sort();
for(const p of all) dfs(p);
fs.writeFileSync('pages/retraissance/reader/pages-list.json', JSON.stringify(order,null,2));
console.log('total', order.length);
