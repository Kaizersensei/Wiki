#!/usr/bin/env node
/**
 * Simple dev save server.
 * - POST /__save          { path, html }                 -> overwrite an existing .html file
 * - POST /__create        { path, title?, template? }    -> scaffold a new .html file + media folder
 * - POST /__delete        { path, removeMedia? }         -> delete an .html file and optional media folder
 * - POST /__update-tags   { section, slug, tags, file? } -> merge tags into tags.json (default under assets)
 *
 * CORS is open to allow file:// usage.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const TAG_FILE_DEFAULT = path.join(ROOT, 'pages', 'retraissance', 'assets', 'tags.json');

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });
  if (body !== undefined) res.end(typeof body === 'string' ? body : JSON.stringify(body));
  else res.end();
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFile = (p, content) => fs.writeFileSync(p, content, 'utf8');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

const normalizeHtmlPath = (relPath) => {
  if (!relPath) throw new Error('Missing path');
  const target = path.normalize(path.join(ROOT, relPath.replace(/^[\\/]+/, '')));
  if (!target.startsWith(ROOT)) throw new Error('Invalid path');
  if (!target.endsWith('.html')) throw new Error('Only .html allowed');
  return target;
};

const relFromBase = (fullPath) => fullPath.replace(/\\/g, '/').replace(ROOT.replace(/\\/g, '/'), '').replace(/^\/+/, '');

const computePrefixToBase = (relPath) => {
  // relPath is repo-relative (e.g., pages/retraissance/densetsu/foo/bar.html)
  const afterBase = relPath.replace(/\\/g, '/').replace(/^pages\/retraissance\/?/, '');
  const parts = afterBase.split('/').filter(Boolean);
  parts.pop(); // remove filename
  if (!parts.length) return '';
  return parts.map(() => '..').join('/') + '/';
};

const buildNav = (prefix) => `
  <header class="site-header">
    <div class="brand">
      <a href="${prefix}index.html" aria-label="Retraissance">
        <img class="nav-logo" src="${prefix}assets/res/LOGO_Retraissance.gif" alt="Retraissance" />
      </a>
    </div>
    <nav class="nav-links">
      <a class="nav-home" href="${prefix}index.html">Retraissance</a>
      <a href="${prefix}team/index.html">Team</a>
      <div class="nav-dropdown">
        <span class="nav-dropdown-toggle">Projects ▾</span>
        <div class="nav-dropdown-menu">
          <a href="${prefix}projects/index.html">Projects Index</a>
          <a href="${prefix}densetsu/index.html">Densetsu</a>
        </div>
      </div>
      <div class="nav-dropdown">
        <span class="nav-dropdown-toggle">Densetsu ▾</span>
        <div class="nav-dropdown-menu">
          <a href="${prefix}densetsu/universe/index.html">Universe</a>
          <a href="${prefix}densetsu/engine/index.html">Engine</a>
        </div>
      </div>
    </nav>
  </header>`;

const wrapPage = ({ title = 'Untitled', eyebrow = 'universe', body = '<p>TBD.</p>', prefix = '' }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="${prefix}assets/site.css" />
</head>
<body class="theme-wiki">
  ${buildNav(prefix)}
  <main class="content">
    <section class="panel">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <article class="markdown">
${body}
      </article>
    </section>
  </main>
  <script src="${prefix}assets/site.js" defer></script>
</body>
</html>
`;

const templateCharacter = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD.</p></div>
        <h2>Identity</h2>
        <div class="callout"><ul>
          <li><strong>Age:</strong> TBD</li>
          <li><strong>Origin:</strong> TBD</li>
          <li><strong>Species:</strong> TBD</li>
          <li><strong>Occupation/Role:</strong> TBD</li>
          <li><strong>Faction:</strong> TBD</li>
        </ul></div>
        <h2>Notes</h2>
        <div class="callout"><p>TBD.</p></div>
        <details class="meta-toggle"><summary>Show page info</summary>
<div class='meta-grid'>
<div class='meta-item'><span class='meta-key'>id</span><span class='meta-value'>${(title || '').toLowerCase().replace(/\\s+/g, '_')}</span></div>
<div class='meta-item'><span class='meta-key'>title</span><span class='meta-value'>${title}</span></div>
<div class='meta-item'><span class='meta-key'>type</span><span class='meta-value'>Character</span></div>
<div class='meta-item'><span class='meta-key'>status</span><span class='meta-value'>stub</span></div>
</div>
</details>`
});

const templateTeam = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'team',
  body: `        <h2>Role</h2>
        <div class="callout"><p>TBD.</p></div>
        <h2>Contributions</h2>
        <div class="callout"><p>TBD.</p></div>
        <h2>Contact</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateTool = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'tools',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD tool overview.</p></div>
        <h2>Downloads</h2>
        <div class="callout"><ul><li><a href="#">TBD link</a></li></ul></div>
        <h2>Usage</h2>
        <div class="callout"><p>TBD usage notes.</p></div>
        <h2>Notes</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateGeneric = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'page',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateEnemy = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD enemy overview.</p></div>
        <h2>Traits</h2>
        <div class="callout"><p>TBD (elemental, behavior, weaknesses).</p></div>
        <h2>Moveset</h2>
        <div class="callout"><p>TBD.</p></div>
        <h2>Rewards</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateCreature = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD creature overview.</p></div>
        <h2>Habitat</h2>
        <div class="callout"><p>TBD habitat/biome.</p></div>
        <h2>Behavior</h2>
        <div class="callout"><p>TBD behavior.</p></div>`
});

const templateLocation = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD location overview.</p></div>
        <h2>Notable NPCs</h2>
        <div class="callout"><ul><li>TBD</li></ul></div>
        <h2>Secondary NPCs</h2>
        <div class="callout"><ul><li>TBD</li></ul></div>
        <h2>Points of Interest</h2>
        <div class="callout"><ul><li>TBD</li></ul></div>`
});

const templateArtifact = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD artifact overview.</p></div>
        <h2>Properties</h2>
        <div class="callout"><p>TBD.</p></div>
        <h2>Known Holders</h2>
        <div class="callout"><ul><li>TBD</li></ul></div>`
});

const templateFaction = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD faction overview.</p></div>
        <h2>Territory / Region</h2>
        <div class="callout"><p>TBD.</p></div>
        <h2>Allies / Rivals</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateConcept = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Summary</h2>
        <div class="callout"><p>TBD concept summary.</p></div>
        <h2>Details</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateCulture = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Overview</h2>
        <div class="callout"><p>TBD culture overview.</p></div>
        <h2>Practices / Tenets</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateEvent = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Summary</h2>
        <div class="callout"><p>TBD event summary.</p></div>
        <h2>Impact</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templateWorld = ({ title, prefix }) => wrapPage({
  title,
  prefix,
  eyebrow: 'universe',
  body: `        <h2>Summary</h2>
        <div class="callout"><p>TBD world summary.</p></div>
        <h2>Notes</h2>
        <div class="callout"><p>TBD.</p></div>`
});

const templates = {
  character: templateCharacter,
  enemy: templateEnemy,
  creature: templateCreature,
  location: templateLocation,
  artifact: templateArtifact,
  faction: templateFaction,
  concept: templateConcept,
  culture: templateCulture,
  event: templateEvent,
  world: templateWorld,
  team: templateTeam,
  tool: templateTool,
  generic: templateGeneric,
};

const mediaFolderFor = (relPath) => {
  const clean = relPath.replace(/\\/g, '/');
  const withoutBase = clean.replace(/^pages\/retraissance\/?/, '');
  const parts = withoutBase.split('/');
  const file = parts.pop();
  if (/^index/i.test(file || '')) return null;
  if (!file.endsWith('.html')) return null;

  if (parts[0] === 'team') {
    return path.join(ROOT, 'pages', 'retraissance', 'assets', 'media', 'team', ...parts.slice(1), file.replace(/\.html?$/, ''));
  }
  if (parts[0] === 'densetsu') {
    return path.join(ROOT, 'pages', 'retraissance', 'assets', 'media', ...parts.slice(1), file.replace(/\.html?$/, ''));
  }
  return path.join(ROOT, 'pages', 'retraissance', 'assets', 'media', ...parts, file.replace(/\.html?$/, ''));
};

const ensureTagEntry = (section, slug) => {
  if (!section || !slug) return;
  let data = {};
  if (fs.existsSync(TAG_FILE_DEFAULT)) {
    try { data = readJson(TAG_FILE_DEFAULT); } catch (e) { data = {}; }
  }
  if (!data[section]) data[section] = {};
  if (!data[section][slug]) data[section][slug] = [];
  ensureDir(path.dirname(TAG_FILE_DEFAULT));
  writeFile(TAG_FILE_DEFAULT, JSON.stringify(data, null, 2));
};

const removeTagEntry = (section, slug) => {
  if (!section || !slug) return;
  if (!fs.existsSync(TAG_FILE_DEFAULT)) return;
  let data = {};
  try { data = readJson(TAG_FILE_DEFAULT); } catch (e) { data = {}; }
  if (data[section]) {
    delete data[section][slug];
    ensureDir(path.dirname(TAG_FILE_DEFAULT));
    writeFile(TAG_FILE_DEFAULT, JSON.stringify(data, null, 2));
  }
};

const mutateJsonBlock = (indexPath, scriptId, mutator) => {
  if (!fs.existsSync(indexPath)) return;
  let content = fs.readFileSync(indexPath, 'utf8');
  const re = new RegExp(`(<script[^>]+id=["']${scriptId}["'][^>]*>)([\\s\\S]*?)(</script>)`, 'i');
  const match = content.match(re);
  if (!match) return;
  const [, pre, jsonText, post] = match;
  let data = [];
  try { data = JSON.parse(jsonText); } catch (e) { data = []; }
  data = mutator(Array.isArray(data) ? data : []);
  const nextJson = JSON.stringify(data, null, 2);
  content = content.replace(re, `${pre}\n${nextJson}\n${post}`);
  fs.writeFileSync(indexPath, content, 'utf8');
};

const insertIntoIndex = (indexPath, constName, entryStr, href) => {
  if (!fs.existsSync(indexPath)) return;
  let content = fs.readFileSync(indexPath, 'utf8');
  if (href) {
    const hrefEsc = href.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(`href:\\s*['"]${hrefEsc}['"]`);
    if (re.test(content)) return;
  }

  const arrayStart = content.indexOf(`const ${constName} = [`);
  if (arrayStart === -1) return;
  let arrayEnd = content.indexOf('].map', arrayStart);
  if (arrayEnd === -1) arrayEnd = content.indexOf('];', arrayStart);
  if (arrayEnd === -1) return;

  const afterStart = content.slice(arrayStart).match(/\[\r?\n([ \t]+)/);
  const indent = afterStart ? afterStart[1] : '      ';
  const insertStr = `${indent}${entryStr}\n`;
  content = content.slice(0, arrayEnd) + insertStr + content.slice(arrayEnd);
  fs.writeFileSync(indexPath, content, 'utf8');
};

const removeFromIndex = (indexPath, constName, href) => {
  if (!fs.existsSync(indexPath) || !href) return;
  const hrefEsc = href.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  let lines = fs.readFileSync(indexPath, 'utf8').split(/\r?\n/);
  const startIdx = lines.findIndex(l => l.includes(`const ${constName} = [`));
  if (startIdx === -1) return;
  const endIdx = lines.findIndex((l, i) => i > startIdx && (/\]\.map/.test(l) || /\];/.test(l)));
  if (endIdx === -1) return;
  const before = lines.slice(0, startIdx + 1);
  const middle = lines.slice(startIdx + 1, endIdx).filter(l => !new RegExp(`href:\\s*["']${hrefEsc}["']`).test(l));
  const after = lines.slice(endIdx);
  const next = [...before, ...middle, ...after].join('\n');
  fs.writeFileSync(indexPath, next, 'utf8');
};

const updateIndexesForCreate = (relPath, title) => {
  const clean = relPath.replace(/\\/g, '/');
  const matchChar = clean.match(/^pages\/retraissance\/densetsu\/universe\/characters\/([^/]+)\.html$/i);
  if (matchChar && matchChar[1] !== 'index') {
    const slug = matchChar[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'characters', 'index.html');
    const letter = (title || slug).charAt(0).toUpperCase() || 'Other';
    mutateJsonBlock(indexPath, 'c-data-json', (arr) => {
      if (!arr.find(e => e && e.href === `${slug}.html`)) arr.push({ name: title || slug, href: `${slug}.html`, tags: [letter] });
      return arr;
    });
    insertIntoIndex(indexPath, 'cData', `{ name: '${title || slug}', href: '${slug}.html', tags: ['${letter}'] },`, `${slug}.html`);
    ensureTagEntry('characters', slug);
  }

  const matchTeam = clean.match(/^pages\/retraissance\/team\/([^/]+)\.html$/i);
  if (matchTeam && matchTeam[1] !== 'index') {
    const slug = matchTeam[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'team', 'index.html');
    const letter = (title || slug).charAt(0).toUpperCase() || 'Other';
    mutateJsonBlock(indexPath, 't-data-json', (arr) => {
      if (!arr.find(e => e && e.href === `${slug}.html`)) arr.push({ name: title || slug, href: `${slug}.html`, tags: [letter] });
      return arr;
    });
    insertIntoIndex(indexPath, 'tData', `{ name: '${title || slug}', href: '${slug}.html', tags: ['${letter}'] },`, `${slug}.html`);
    ensureTagEntry('team', slug);
  }

  const matchTool = clean.match(/^pages\/retraissance\/tools\/([^/]+)\.html$/i);
  if (matchTool && matchTool[1] !== 'index') {
    const slug = matchTool[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'tools', 'index.html');
    const letter = (title || slug).charAt(0).toUpperCase() || 'Other';
    mutateJsonBlock(indexPath, 'tools-data-json', (arr) => {
      if (!arr.find(e => e && e.href === `${slug}.html`)) arr.push({ name: title || slug, href: `${slug}.html`, tags: [letter] });
      return arr;
    });
    ensureTagEntry('tools', slug);
  }
  const matchEnemy = clean.match(/^pages\/retraissance\/densetsu\/universe\/enemies\/([^/]+)\.html$/i);
  if (matchEnemy && matchEnemy[1] !== 'index') {
    const slug = matchEnemy[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'enemies', 'index.html');
    insertIntoIndex(indexPath, 'eData', `{ name: "${title || slug}", href: "${slug}.html", tag: "unspecified" },`, `${slug}.html`);
  }
  const matchCreature = clean.match(/^pages\/retraissance\/densetsu\/universe\/creatures\/([^/]+)\.html$/i);
  if (matchCreature && matchCreature[1] !== 'index') {
    const slug = matchCreature[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'creatures', 'index.html');
    insertIntoIndex(indexPath, 'crData', `{ name: "${title || slug}", href: "${slug}.html", tag: "unspecified" },`, `${slug}.html`);
  }
  const matchLocation = clean.match(/^pages\/retraissance\/densetsu\/universe\/locations\/([^/]+)\.html$/i);
  if (matchLocation && matchLocation[1] !== 'index') {
    const slug = matchLocation[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'locations', 'index.html');
    insertIntoIndex(indexPath, 'lData', `{ name: '${title || slug}', href: '${slug}.html', region: 'Unspecified' },`, `${slug}.html`);
  }
  const matchArtifact = clean.match(/^pages\/retraissance\/densetsu\/universe\/artifacts\/([^/]+)\.html$/i);
  if (matchArtifact && matchArtifact[1] !== 'index') {
    const slug = matchArtifact[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'artifacts', 'index.html');
    insertIntoIndex(indexPath, 'aData', `{ name: '${title || slug}', href: '${slug}.html', tag: 'unspecified' },`, `${slug}.html`);
  }
  const matchCulture = clean.match(/^pages\/retraissance\/densetsu\/universe\/cultures\/([^/]+)\.html$/i);
  if (matchCulture && matchCulture[1] !== 'index') {
    const slug = matchCulture[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'cultures', 'index.html');
    insertIntoIndex(indexPath, 'cuData', `{ name: '${title || slug}', href: '${slug}.html', tag: 'unspecified' },`, `${slug}.html`);
  }
  const matchFaction = clean.match(/^pages\/retraissance\/densetsu\/universe\/factions\/([^/]+)\.html$/i);
  if (matchFaction && matchFaction[1] !== 'index') {
    const slug = matchFaction[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'factions', 'index.html');
    insertIntoIndex(indexPath, 'fData', `{ name: '${title || slug}', href: '${slug}.html', region: 'Unspecified' },`, `${slug}.html`);
  }
  const matchConcept = clean.match(/^pages\/retraissance\/densetsu\/universe\/concepts\/([^/]+)\.html$/i);
  if (matchConcept && matchConcept[1] !== 'index') {
    const slug = matchConcept[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'concepts', 'index.html');
    insertIntoIndex(indexPath, 'cData', `{ name: '${title || slug}', href: '${slug}.html', tag: 'concept' },`, `${slug}.html`);
  }
  const matchEvent = clean.match(/^pages\/retraissance\/densetsu\/universe\/events\/([^/]+)\.html$/i);
  if (matchEvent && matchEvent[1] !== 'index') {
    const slug = matchEvent[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'events', 'index.html');
    insertIntoIndex(indexPath, 'eData', `{ name: '${title || slug}', href: '${slug}.html', tag: 'event' },`, `${slug}.html`);
  }
  const matchWorld = clean.match(/^pages\/retraissance\/densetsu\/universe\/world\/([^/]+)\.html$/i);
  if (matchWorld && matchWorld[1] !== 'index') {
    const slug = matchWorld[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'world', 'index.html');
    insertIntoIndex(indexPath, 'wData', `{ name: '${title || slug}', href: '${slug}.html', tag: 'world' },`, `${slug}.html`);
  }
};

const updateIndexesForDelete = (relPath) => {
  const clean = relPath.replace(/\\/g, '/');
  const tryDel = (regex, indexPath, constName) => {
    const m = clean.match(regex);
    if (m && m[1] !== 'index') {
      const slug = m[1];
      removeFromIndex(indexPath, constName, `${slug}.html`);
      removeTagEntry(constName === 'cData' ? 'characters' : constName === 'tData' ? 'team' : '', slug);
      // JSON blocks for characters/team
      if (constName === 'cData') {
        mutateJsonBlock(indexPath, 'c-data-json', (arr) => arr.filter(e => e && e.href !== `${slug}.html`));
      }
      if (constName === 'tData') {
        mutateJsonBlock(indexPath, 't-data-json', (arr) => arr.filter(e => e && e.href !== `${slug}.html`));
      }
    }
  };

  tryDel(/^pages\/retraissance\/densetsu\/universe\/characters\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'characters', 'index.html'),
    'cData');
  tryDel(/^pages\/retraissance\/team\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'team', 'index.html'),
    'tData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/enemies\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'enemies', 'index.html'),
    'eData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/creatures\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'creatures', 'index.html'),
    'crData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/locations\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'locations', 'index.html'),
    'lData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/artifacts\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'artifacts', 'index.html'),
    'aData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/cultures\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'cultures', 'index.html'),
    'cuData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/factions\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'factions', 'index.html'),
    'fData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/concepts\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'concepts', 'index.html'),
    'cData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/events\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'events', 'index.html'),
    'eData');
  tryDel(/^pages\/retraissance\/densetsu\/universe\/world\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'densetsu', 'universe', 'world', 'index.html'),
    'wData');
  tryDel(/^pages\/retraissance\/tools\/([^/]+)\.html$/i,
    path.join(ROOT, 'pages', 'retraissance', 'tools', 'index.html'),
    'toolsData');
  // Remove from tools JSON block separately
  const mTool = clean.match(/^pages\/retraissance\/tools\/([^/]+)\.html$/i);
  if (mTool && mTool[1] !== 'index') {
    const slug = mTool[1];
    const indexPath = path.join(ROOT, 'pages', 'retraissance', 'tools', 'index.html');
    mutateJsonBlock(indexPath, 'tools-data-json', (arr) => arr.filter(e => e && e.href !== `${slug}.html`));
    removeTagEntry('tools', slug);
  }
};

const serveStatic = (req, res, pathname) => {
  const safePath = pathname.replace(/\.\.+/g, '').replace(/^\/+/, '');
  const target = path.normalize(path.join(ROOT, safePath || ''));
  if (!target.startsWith(ROOT)) return false;
  let stat;
  try { stat = fs.statSync(target); } catch (e) { return false; }
  let filePath = target;
  if (stat.isDirectory()) {
    filePath = path.join(target, 'index.html');
    try { stat = fs.statSync(filePath); } catch (e) { return false; }
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = CONTENT_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
  return true;
};

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = parsed;

  if (req.method === 'OPTIONS') {
    return send(res, 204);
  }

  if (req.method === 'POST' && pathname === '/__save') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(raw || '{}');
        const target = normalizeHtmlPath(payload.path);
        const html = payload.html;
        if (!html) return send(res, 400, { error: 'Missing html' });
        ensureDir(path.dirname(target));
        writeFile(target, html);
        send(res, 200, { ok: true, path: relFromBase(target) });
      } catch (err) {
        send(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/__create') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(raw || '{}');
        const relPath = payload.path;
        const templateKey = (payload.template || 'generic').toLowerCase();
        const title = payload.title || 'Untitled';
        if (!relPath) return send(res, 400, { error: 'Missing path' });
        const target = normalizeHtmlPath(relPath);
        const rel = relFromBase(target);
        const prefix = computePrefixToBase(rel);
        const tpl = templates[templateKey] || templateGeneric;

        ensureDir(path.dirname(target));
        writeFile(target, tpl({ title, prefix }));

        const mediaFolder = mediaFolderFor(rel);
        if (mediaFolder) ensureDir(mediaFolder);
        updateIndexesForCreate(rel, title);

        send(res, 200, { ok: true, path: rel, media: mediaFolder ? relFromBase(mediaFolder) : null });
      } catch (err) {
        send(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/__delete') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(raw || '{}');
        const relPath = payload.path;
        if (!relPath) return send(res, 400, { error: 'Missing path' });
        const target = normalizeHtmlPath(relPath);
        if (fs.existsSync(target)) {
          updateIndexesForDelete(relFromBase(target));
          fs.unlinkSync(target);
        }
        let mediaDeleted = null;
        if (payload.removeMedia) {
          const mediaFolder = mediaFolderFor(relFromBase(target));
          if (mediaFolder && fs.existsSync(mediaFolder)) {
            fs.rmSync(mediaFolder, { recursive: true, force: true });
            mediaDeleted = relFromBase(mediaFolder);
          }
        }
        send(res, 200, { ok: true, path: relFromBase(target), mediaDeleted });
      } catch (err) {
        send(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/__update-tags') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(raw || '{}');
        const section = (payload.section || '').trim();
        const slug = (payload.slug || '').trim();
        const tags = Array.isArray(payload.tags) ? payload.tags.map(t => String(t).trim()).filter(Boolean) : [];
        const tagFile = payload.file
          ? path.normalize(path.join(ROOT, payload.file.replace(/^[\\/]+/, '')))
          : TAG_FILE_DEFAULT;
        if (!section || !slug) return send(res, 400, { error: 'Missing section/slug' });
        if (!tagFile.startsWith(ROOT) || !tagFile.endsWith('.json')) return send(res, 400, { error: 'Invalid tag file' });

        let data = {};
        if (fs.existsSync(tagFile)) {
          try { data = readJson(tagFile); } catch (e) { data = {}; }
        }
        if (!data[section]) data[section] = {};
        if (tags.length) data[section][slug] = tags;
        else delete data[section][slug];

        ensureDir(path.dirname(tagFile));
        writeFile(tagFile, JSON.stringify(data, null, 2));
        send(res, 200, { ok: true, file: relFromBase(tagFile), section, slug, tags });
      } catch (err) {
        send(res, 400, { error: err.message });
      }
    });
    return;
  }

  // Static serving fallback
  if (req.method === 'GET') {
    if (serveStatic(req, res, pathname)) return;
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Dev save server listening on http://localhost:${PORT}/__save`);
});
