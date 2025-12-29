(() => {
  const state = {
    overlayOpen: false,
  };

  // Inline lexicon fallback for universe auto-linking (forward slashes).

  const isVideo = (src = '') => /\.mp4$|\.webm$|\.ogg$|\.mp3$/i.test(src);
  const saveEndpoint = window.SAVE_ENDPOINT || 'http://localhost:3000/__save';
  const saveBase = (saveEndpoint || '').replace(/\/__save.*$/, '').replace(/\/$/, '') || 'http://localhost:3000';
  const createEndpoint = `${saveBase}/__create`;
  const deleteEndpoint = `${saveBase}/__delete`;
  const tagsEndpoint = `${saveBase}/__update-tags`;
  const LEXICON_FALLBACK = Array.isArray(window.UNIVERSE_LEXICON_DATA) ? window.UNIVERSE_LEXICON_DATA : [];
  const CONTROL_SELECTOR = '.inline-remove, .inline-move, .inline-size, .inline-align-group, .inline-remove-media, .inline-edit-media';

  const fetchJsonSafe = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  };

const buildBreadcrumb = () => {
    const panel = document.querySelector('.panel');
    if (!panel) return;
    const h1 = panel.querySelector('h1');
    const old = panel.querySelector('.breadcrumb');
    const eyebrow = panel.querySelector('.eyebrow');
    const path = (location.pathname || '').replace(/\\/g, '/');
    const match = path.match(/pages\/(.+)/);
    if (!match) return;
    const segments = match[1].split('/').filter(Boolean);
    if (!segments.length) return;
    // Skip breadcrumb on the top-level Retraissance index
    if ((segments.length === 1 && /index\.html?$/i.test(segments[0])) || (segments.length <= 2 && segments[0] === 'retraissance' && /index\.html?$/i.test(segments[1] || ''))) return;
    const makeLabel = (s) => s.replace(/\.html?$/i, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const crumbs = [];
    let accum = '/pages';
    segments.forEach((seg) => {
      const isFile = /\.html?$/i.test(seg);
      const label = isFile && h1 ? (h1.textContent.trim() || makeLabel(seg)) : makeLabel(seg);
      accum += `/${seg}`;
      const href = isFile ? accum : `${accum}/index.html`;
      crumbs.push({ label, href });
    });
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.innerHTML = crumbs.map((c, i) => `<a href="${c.href}">${c.label}</a>${i < crumbs.length - 1 ? ' / ' : ''}`).join('');
    if (old) old.replaceWith(nav);
    else if (eyebrow) eyebrow.replaceWith(nav);
    else if (h1) panel.insertBefore(nav, h1);
    else panel.prepend(nav);
  };

  const initPrevNextNav = async () => {
    // Remove any existing baked/duplicate pagers before adding a fresh one.
    document.querySelectorAll('.pager-floating').forEach(el => el.remove());
    const pagePath = (location.pathname || '').replace(/\\/g, '/');
    if (/\bindex\.html?$/i.test(pagePath)) return;

    const nav = document.createElement('div');
    nav.className = 'pager pager-floating';
    const makeLink = (text, href, cls) => {
      const a = document.createElement('a');
      a.textContent = text;
      a.href = href;
      a.className = cls;
      return a;
    };

    const upLink = makeLink('Up to Index', 'index.html', 'pager-up');
    nav.appendChild(upLink);

    // If file://, we cannot fetch neighbors due to CORS; show only Up and disabled prev/next.
    if (location.protocol === 'file:') {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '← Prev (serve over http:// to enable)';
      prevBtn.className = 'pager-prev';
      prevBtn.disabled = true;
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next → (serve over http:// to enable)';
      nextBtn.className = 'pager-next';
      nextBtn.disabled = true;
      nav.appendChild(prevBtn);
      nav.appendChild(nextBtn);
    } else {
      // Determine directory and index URL
      const dir = pagePath.replace(/[^/]+$/, '');
      const indexUrl = `${dir}index.html`;
      let html = '';
      const loadIndexHtml = async () => {
        try {
          let res = await fetch(indexUrl);
          if (res.ok) return await res.text();
          // fallback: go one directory up if index missing here
          const parent = dir.replace(/[^/]+\/$/, '');
          if (parent && parent !== dir) {
            res = await fetch(`${parent}index.html`);
            if (res.ok) upLink.href = `${parent}index.html`; // adjust Up link
            if (res.ok) return await res.text();
          }
        } catch (_) { /* ignore */ }
        return '';
      };
      html = await loadIndexHtml();

      let items = [];
      if (html) {
        let doc = null;
        try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (_) { doc = null; }
        if (doc) {
          const anchors = Array.from(doc.querySelectorAll('#c-list a, #t-list a, .link-list a'));
          if (anchors.length) {
            items = anchors.map(a => ({
              name: (a.textContent || '').trim(),
              href: a.getAttribute('href') || ''
            })).filter(i => i.href);
          }
          if (!items.length) {
            const scripts = ['c-data-json', 't-data-json', 'tools-data-json'];
            for (const id of scripts) {
              const node = doc.getElementById(id);
              if (!node) continue;
              try {
                const data = JSON.parse(node.textContent || '[]');
                if (Array.isArray(data) && data.length) {
                  items = data.map(d => ({ name: d.name, href: d.href })).filter(i => i.name && i.href);
                  break;
                }
              } catch (_) { /* ignore */ }
            }
          }
        }
      }
      if (!items.length && pagePath.includes('/team/')) {
        const tags = await fetchJsonSafe(`${dir}../assets/tags.json`);
        const team = tags && tags.team ? Object.keys(tags.team) : [];
        items = team.map(slug => ({ name: slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), href: `${slug}.html` }));
      }
      if (!items.length && pagePath.includes('/densetsu/universe/')) {
        const base = pagePath.substring(0, pagePath.indexOf('/densetsu/universe/') + '/densetsu/universe/'.length);
        const lex = await fetchJsonSafe(`${base}lexicon-data.json`);
        if (Array.isArray(lex)) {
          const relDir = dir.substring(dir.indexOf('/densetsu/universe/') + '/densetsu/universe/'.length);
          items = lex
            .filter(e => (e.Href || '').startsWith(relDir))
            .map(e => {
              const href = (e.Href || '').replace(relDir, '');
              return { name: e.Name, href };
            })
            .filter(i => i.name && i.href);
        }
      }
      const current = pagePath.split('/').pop();
      const idx = items.findIndex(i => (i.href || '').replace(/#.*$/, '') === current);
      const prev = idx > -1 ? (items[idx - 1] || null) : null;
      const next = idx > -1 ? (items[idx + 1] || null) : null;
      if (prev) nav.appendChild(makeLink(`← ${prev.name}`, prev.href, 'pager-prev'));
      if (next) nav.appendChild(makeLink(`${next.name} →`, next.href, 'pager-next'));
    }

    // Always float on body so header layout is untouched.
    nav.style.position = 'fixed';
    document.body.appendChild(nav);

    const positionPager = () => {
      const header = document.querySelector('.site-header');
      const rect = header ? header.getBoundingClientRect() : null;
      const top = rect ? (rect.top + (rect.height / 2) - (nav.offsetHeight / 2)) : 32;
      nav.style.left = '50%';
      nav.style.top = `${Number.isFinite(top) ? top : 32}px`;
      nav.style.transform = 'translateX(-50%)';
    };
    positionPager();
    window.addEventListener('resize', positionPager);
  };

  const ensureToolsNavLink = () => {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;
    const pagePath = (location.pathname || '').replace(/\\/g, '/');
    const parts = pagePath.split('/').filter(Boolean);
    const idxPages = parts.indexOf('pages');
    let prefix = '';
    if (idxPages !== -1) {
      const after = parts.slice(idxPages + 1); // after 'pages'
      const depth = Math.max(after.length - 1, 0); // exclude file
      prefix = '../'.repeat(depth);
    }
    const toolsHref = `${prefix}retraissance/tools/index.html`;
    const exists = Array.from(nav.querySelectorAll('a')).some(a => (a.getAttribute('href') || '').includes('/tools/index.html') || (a.textContent || '').trim().toLowerCase() === 'tools');
    if (exists) return;
    const link = document.createElement('a');
    link.href = toolsHref;
    link.textContent = 'Tools';
    const randomBtn = nav.querySelector('.nav-random');
    if (randomBtn && randomBtn.parentElement === nav) {
      nav.insertBefore(link, randomBtn);
    } else {
      nav.appendChild(link);
    }
  };

  // Lightbox helper for inline images/videos (pseudotag media).
  const bindInlineLightbox = () => {
    if (document.body.classList.contains('edit-active')) return;
    const mediaNodes = Array.from(document.querySelectorAll('img.inline-image, video.inline-video'));
    mediaNodes.forEach(node => {
      if (node.dataset.lightboxBound) return;
      node.dataset.lightboxBound = '1';
      node.addEventListener('click', (e) => {
        if (document.body.classList.contains('edit-active')) return;
        if (node.classList.contains('inline-media-missing')) return;
        e.preventDefault();
        const liveList = Array.from(document.querySelectorAll('img.inline-image:not(.inline-media-missing), video.inline-video:not(.inline-media-missing)'));
        const items = liveList.map(n => ({
          src: n.currentSrc || n.src || '',
          title: n.getAttribute('alt') || n.dataset.pseudo || ''
        })).filter(i => i.src);
        const idx = Math.max(0, liveList.indexOf(node));
        if (!items.length || idx < 0) return;
        openOverlay(items, idx);
      });
    });
  };

  // Group Retraissance home + Team + Projects under a single dropdown (less hover flicker).
  const setupRetraissanceDropdown = () => {
    const nav = document.querySelector('.nav-links');
    if (!nav || nav.querySelector('.nav-dropdown.nav-root')) return;

    const findLink = (match) => Array.from(nav.querySelectorAll('a')).find(a => (a.getAttribute('href') || '').includes(match));
    const home = nav.querySelector('.nav-home') || findLink('index.html');
    const team = findLink('team/index.html');
    const projectsDropdown = Array.from(nav.querySelectorAll('.nav-dropdown')).find(d => /projects/i.test(d.textContent || ''));
    const projectsLink = findLink('projects/index.html');

    const root = document.createElement('div');
    root.className = 'nav-dropdown nav-root';
    const toggle = document.createElement('span');
    toggle.className = 'nav-dropdown-toggle';
    toggle.textContent = 'Retraissance ▾';
    const menu = document.createElement('div');
    menu.className = 'nav-dropdown-menu';

    const addItem = (el, fallbackText) => {
      if (!el) return;
      const clone = el.cloneNode(true);
      if (fallbackText) clone.textContent = fallbackText;
      menu.appendChild(clone);
      el.remove();
    };

    addItem(home, 'Home');
    addItem(team, 'Team');
    if (projectsDropdown) {
      const proj = projectsDropdown.querySelector('a[href*="projects/index"]') || projectsDropdown.querySelector('a');
      if (proj) {
        const clone = proj.cloneNode(true);
        clone.textContent = clone.textContent || 'Projects';
        menu.appendChild(clone);
      } else {
        const link = document.createElement('a');
        link.href = 'projects/index.html';
        link.textContent = 'Projects';
        menu.appendChild(link);
      }
      projectsDropdown.remove();
    } else if (projectsLink) {
      addItem(projectsLink, 'Projects');
    } else {
      const link = document.createElement('a');
      link.href = 'projects/index.html';
      link.textContent = 'Projects';
      menu.appendChild(link);
    }

    root.appendChild(toggle);
    root.appendChild(menu);
    nav.insertBefore(root, nav.firstChild);
  };

  const resolvePseudoUrl = (url) => {
    const trimmed = (url || '').trim();
    if (!trimmed) return '';
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    const isFile = (location.protocol === 'file:');

    const resolveLocal = (p) => {
      const rel = isFile && p.startsWith('/') ? p.slice(1) : p;
      try { return new URL(rel, location.href).toString(); } catch (_) { return rel; }
    };

    if (trimmed.startsWith('/assets/')) {
      const full = `/pages/retraissance${trimmed}`;
      return isFile ? resolveLocal(full) : `${location.origin}${full}`;
    }
    if (trimmed.startsWith('/pages/')) {
      return isFile ? resolveLocal(trimmed) : `${location.origin}${trimmed}`;
    }

    // If it's just a filename (no slash), try to auto-resolve against the page's media folder.
    const isBareName = !/[\\/]/.test(trimmed);
    if (isBareName) {
      const pagePath = (location.pathname || '').replace(/\\/g, '/');
      const slug = (pagePath.split('/').pop() || '').replace(/\.html?$/i, '');
      const candidates = [];
      // Team pages
      if (/\/retraissance\/team\//.test(pagePath)) {
        candidates.push(`/pages/retraissance/assets/media/team/${slug}/${trimmed}`);
      }
      // Universe pages
      const uniMatch = pagePath.match(/\/retraissance\/densetsu\/universe\/([^/]+)\//);
      if (uniMatch) {
        const section = uniMatch[1];
        candidates.push(`/pages/retraissance/densetsu/assets/media/universe/${section}/${slug}/${trimmed}`);
        candidates.push(`/pages/retraissance/densetsu/assets/media/universe/${slug}/${trimmed}`);
      }
      // Engine/tools fallback
      if (/\/retraissance\/densetsu\/engine\//.test(pagePath)) {
        candidates.push(`/pages/retraissance/densetsu/assets/media/engine/${slug}/${trimmed}`);
      }
      // Generic assets fallback
      candidates.push(`/pages/retraissance/assets/media/${slug}/${trimmed}`);
      candidates.push(`/pages/retraissance/assets/media/${trimmed}`);

      const first = candidates.find(Boolean);
      if (first) return isFile ? resolveLocal(first) : `${location.origin}${first}`;
    }

    // Fallback to relative resolution
    try { return new URL(trimmed, location.href).toString(); } catch (_) { return trimmed; }
  };

  // Inline media injector: replace pseudotags (<image>, <video>, <box>, <line>) in text nodes, then handle literal tags.
  const applyInlineMedia = () => {
    const scopes = Array.from(document.querySelectorAll('main .panel, main article, .callout')).filter(el => !el.closest('header'));
    const imgPattern = /<image>([\s\S]*?)<\/image>/i;
    const vidPattern = /<video([^>]*)>([\s\S]*?)<\/video>/i;
    const linePattern = /<line><\/line>/i;
    const boxPattern = /<box>([\s\S]*?)<\/box>/i;
    const walkerFilter = {
      acceptNode(node) {
        const parent = node.parentElement;
        if (parent) {
          const tag = parent.tagName;
          if (tag === 'A' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') return NodeFilter.FILTER_REJECT;
          if (parent.closest('.no-autolink, [data-autolink="off"]')) return NodeFilter.FILTER_REJECT;
          if (parent.closest('.link-list')) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    };

    scopes.forEach(scope => {
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, walkerFilter);
      const toReplace = [];
      let n;
      while ((n = walker.nextNode())) toReplace.push(n);

      toReplace.forEach(node => {
        const decodedText = (node.nodeValue || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        if (!imgPattern.test(decodedText) && !vidPattern.test(decodedText) && !linePattern.test(decodedText) && !boxPattern.test(decodedText)) return;

        const frag = document.createDocumentFragment();
        let remaining = decodedText;
        const nextMatch = () => {
          const candidates = [];
          const mImg = imgPattern.exec(remaining);
          const mVid = vidPattern.exec(remaining);
          const mLine = linePattern.exec(remaining);
          const mBox = boxPattern.exec(remaining);
          if (mImg) candidates.push({ type: 'img', match: mImg });
          if (mVid) candidates.push({ type: 'vid', match: mVid });
          if (mLine) candidates.push({ type: 'line', match: mLine });
          if (mBox) candidates.push({ type: 'box', match: mBox });
          return candidates.sort((a, b) => a.match.index - b.match.index)[0] || null;
        };

        let found;
        while ((found = nextMatch())) {
          const { type, match } = found;
          const before = remaining.slice(0, match.index);
          if (before) frag.appendChild(document.createTextNode(before));

          if (type === 'img') {
            const raw = (match[1] || '').trim();
            const url = resolvePseudoUrl(raw);
            const img = document.createElement('img');
            img.src = url;
            img.alt = raw.split('/').pop() || 'image';
            img.dataset.pseudo = raw;
            img.loading = 'lazy';
            img.className = 'inline-image';
            if (!url) {
              img.classList.add('inline-media-missing');
              img.dataset.missing = '1';
            }
            frag.appendChild(img);
          } else if (type === 'line') {
            frag.appendChild(document.createElement('hr'));
          } else if (type === 'box') {
            const raw = match[1] || '';
            const callout = document.createElement('div');
            callout.className = 'callout';
            const tmp = document.createElement('div');
            tmp.innerHTML = raw;
            if (tmp.childNodes.length) {
              while (tmp.firstChild) callout.appendChild(tmp.firstChild);
            } else {
              const p = document.createElement('p');
              p.textContent = 'TBD.';
              callout.appendChild(p);
            }
            frag.appendChild(callout);
          } else if (type === 'vid') {
            const rawAttrs = (match[1] || '').toLowerCase();
            const rawSrc = (match[2] || '').trim();
            const url = resolvePseudoUrl(rawSrc);
            const noControls = /-nocontrols/.test(rawAttrs);
            const loop = /-loop/.test(rawAttrs);
            const vid = document.createElement('video');
            vid.src = url;
            vid.controls = !noControls;
            vid.loop = loop;
            if (loop) vid.setAttribute('loop', '');
            vid.autoplay = true;
            vid.setAttribute('autoplay', '');
            vid.muted = true;
            vid.setAttribute('muted', '');
            vid.className = 'inline-video';
            vid.dataset.pseudo = rawSrc;
            if (!url) {
              vid.classList.add('inline-media-missing');
              vid.dataset.missing = '1';
            }
            vid.style.maxWidth = '100%';
            vid.style.display = 'block';
            vid.style.margin = '12px auto';
            vid.style.maxHeight = '135vh';
            vid.playsInline = true;
            vid.setAttribute('playsinline', '');
            let loopDelay = 150;
            vid.addEventListener('loadedmetadata', () => {
              const d = vid.duration;
              if (Number.isFinite(d) && d > 0) {
                loopDelay = Math.min(750, Math.max(50, d * 50));
              }
            });
            vid.addEventListener('canplay', () => { try { vid.play(); } catch (_) {} }, { once: true });
            if (loop) {
              vid.addEventListener('ended', () => {
                setTimeout(() => { try { vid.currentTime = 0; vid.play(); } catch (_) {} }, loopDelay);
              });
            }
            frag.appendChild(vid);
          }

          remaining = remaining.slice(match.index + match[0].length);
        }
        if (remaining) frag.appendChild(document.createTextNode(remaining));

        // Wrap media nodes into inline-media-blocks
        const rebuilt = document.createDocumentFragment();
        frag.childNodes.forEach(ch => {
          if (ch.nodeType === 1 && (ch.tagName === 'IMG' || ch.tagName === 'VIDEO')) {
            const block = document.createElement('div');
            block.className = 'inline-media-block';
            block.contentEditable = 'false';
            const inner = document.createElement('div');
            inner.className = 'inline-media-wrap';
            inner.style.display = 'inline-block';
            inner.style.maxWidth = '100%';
            inner.appendChild(ch);
            block.appendChild(inner);
            rebuilt.appendChild(block);
          } else {
            rebuilt.appendChild(ch);
          }
        });

        const parent = node.parentElement;
        if (parent && parent.tagName !== 'P' && rebuilt.childNodes.length === 1 && rebuilt.firstChild.classList && rebuilt.firstChild.classList.contains('inline-media-block')) {
          node.replaceWith(rebuilt);
        } else if (parent && parent.tagName !== 'P') {
          const wrap = document.createElement('p');
          while (rebuilt.firstChild) wrap.appendChild(rebuilt.firstChild);
          node.replaceWith(wrap);
        } else {
          node.replaceWith(rebuilt);
        }
      });

      // Convert literal tags that may remain.
      scope.querySelectorAll('box').forEach(boxEl => {
        const callout = document.createElement('div');
        callout.className = 'callout';
        if (boxEl.dataset && boxEl.dataset.boxMarker) callout.dataset.boxMarker = boxEl.dataset.boxMarker;
        while (boxEl.firstChild) callout.appendChild(boxEl.firstChild);
        if (!callout.childNodes.length) {
          const p = document.createElement('p');
          p.textContent = 'TBD.';
          callout.appendChild(p);
        }
        boxEl.replaceWith(callout);
      });
      scope.querySelectorAll('image').forEach(imgTag => {
        const raw = (imgTag.textContent || imgTag.getAttribute('src') || '').trim();
        const url = resolvePseudoUrl(raw);
        const img = document.createElement('img');
        img.src = url;
        img.alt = raw.split('/').pop() || 'image';
        img.dataset.pseudo = raw;
        img.loading = 'lazy';
        img.className = 'inline-image';
        if (!url) {
          img.classList.add('inline-media-missing');
          img.dataset.missing = '1';
        }
        const block = document.createElement('div');
        block.className = 'inline-media-block';
        block.contentEditable = 'false';
        const inner = document.createElement('div');
        inner.className = 'inline-media-wrap';
        inner.style.display = 'inline-block';
        inner.style.maxWidth = '100%';
        inner.appendChild(img);
        block.appendChild(inner);
        imgTag.replaceWith(block);
      });
      scope.querySelectorAll('line').forEach(lineTag => {
        const hr = document.createElement('hr');
        lineTag.replaceWith(hr);
      });
      scope.querySelectorAll('video').forEach(vidTag => {
        if (vidTag.getAttribute('src')) return;
        const rawSrc = (vidTag.textContent || '').trim();
        if (!rawSrc) return;
        const url = resolvePseudoUrl(rawSrc);
        const clone = document.createElement('video');
        clone.src = url;
        clone.dataset.pseudo = rawSrc;
        clone.className = 'inline-video';
        clone.autoplay = true;
        clone.setAttribute('autoplay', '');
        clone.muted = true;
        clone.setAttribute('muted', '');
        clone.playsInline = true;
        clone.setAttribute('playsinline', '');
        clone.style.maxWidth = '100%';
        clone.style.display = 'block';
        clone.style.margin = '12px auto';
        clone.style.maxHeight = '135vh';
        if (!url) {
          clone.classList.add('inline-media-missing');
          clone.dataset.missing = '1';
        }
        const block = document.createElement('div');
        block.className = 'inline-media-block';
        block.contentEditable = 'false';
        const inner = document.createElement('div');
        inner.className = 'inline-media-wrap';
        inner.style.display = 'inline-block';
        inner.style.maxWidth = '100%';
        inner.appendChild(clone);
        block.appendChild(inner);
        vidTag.replaceWith(block);
      });
  });
};

  // Fallback: replace any remaining pseudotags in innerHTML (including encoded) to ensure rendering.
  const renderImageHtml = (raw, attrs = '') => {
    const url = resolvePseudoUrl(raw);
    const missing = url ? '' : ' inline-media-missing';
    const missingAttr = url ? '' : ' data-missing="1"';
    const sizeMatch = attrs.match(/data-size\s*=\s*"([^"]+)"/i) || attrs.match(/size\s*=\s*"([^"]+)"/i);
    const alignMatch = attrs.match(/data-align\s*=\s*"([^"]+)"/i) || attrs.match(/align\s*=\s*"([^"]+)"/i);
    const sizeVal = sizeMatch ? sizeMatch[1] : '';
    const alignVal = alignMatch ? alignMatch[1] : '';
    const widthStyle = sizeVal ? `width:${sizeVal}${sizeVal.includes('%') ? '' : '%'};` : '';
    const alignStyle = alignVal === 'left' ? 'margin-left:0;margin-right:auto;'
      : alignVal === 'right' ? 'margin-left:auto;margin-right:0;' : 'margin-left:auto;margin-right:auto;';
    const safeAlt = (raw.split('/').pop() || 'image').replace(/"/g, '');
    const dataSizeAttr = sizeVal ? ` data-size="${sizeVal}"` : '';
    const dataAlignAttr = alignVal ? ` data-align="${alignVal}"` : '';
    return `<div class="inline-media-block" contenteditable="false"><div class="inline-media-wrap" style="display:inline-block;max-width:100%;"><img class="inline-image${missing}" src="${url}" alt="${safeAlt}" data-pseudo="${raw}"${missingAttr}${dataSizeAttr}${dataAlignAttr} style="${widthStyle}${alignStyle}"></div></div>`;
  };
  const renderLineHtml = () => '<hr>';
  const renderBoxHtml = (raw) => {
    const inner = raw && raw.trim() ? raw : '<p>TBD.</p>';
    return `<div class="callout">${inner}</div>`;
  };
  const renderVideoHtml = (raw, attrs = '') => {
    const url = resolvePseudoUrl(raw);
    const missing = url ? '' : ' inline-media-missing';
    const missingAttr = url ? '' : ' data-missing="1"';
    const hasNoControls = /-nocontrols/i.test(attrs || '');
    const shouldLoop = /-loop/i.test(attrs || '');
    const ctrlAttr = hasNoControls ? '' : ' controls';
    const loopAttr = shouldLoop ? ' loop' : '';
    return `<div class="inline-media-block" contenteditable="false"><div class="inline-media-wrap" style="display:inline-block;max-width:100%;"><video class="inline-video${missing}" src="${url}" data-pseudo="${raw}" autoplay muted playsinline${ctrlAttr}${loopAttr}${missingAttr} style="max-width:100%;display:block;margin:12px auto;max-height:135vh;"></video></div></div>`;
  };

  // Apply DOM-aware injection then a string fallback to catch any encoded tags.
  const applyInlineMediaWithFallback = () => {
    const scopes = Array.from(document.querySelectorAll('main .panel, main article, .callout')).filter(el => !el.closest('header'));
    scopes.forEach(scope => {
      try { applyInlineMedia(); } catch (err) { console.error('applyInlineMedia failed', err); }

      let html = scope.innerHTML;
      // Detect both raw and encoded pseudotags, even when attributes are present.
      const hasPseudo = /<image\b|<video\b|<box\b|<line\b|&lt;image\b|&lt;video\b|&lt;box\b|&lt;line\b/i.test(html);
      if (!hasPseudo) return;
      // Decode any single- or double-encoded bracket entities.
      html = html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      html = html
        .replace(/<image([^>]*)>([\s\S]*?)<\/image>/gi, (_, attr, p) => renderImageHtml(p.trim(), attr || ''))
        .replace(/<line><\/line>/gi, () => renderLineHtml())
        .replace(/<box>([\s\S]*?)<\/box>/gi, (_, p) => renderBoxHtml(p))
        .replace(/<video([^>]*)>([\s\S]*?)<\/video>/gi, (_, attrs, src) => renderVideoHtml(src.trim(), attrs))
        .replace(/&lt;image([^>]*)&gt;([\s\S]*?)&lt;\/image&gt;/gi, (_, attr, p) => renderImageHtml(p.trim(), attr || ''))
        .replace(/&lt;line&gt;&lt;\/line&gt;/gi, () => renderLineHtml())
        .replace(/&lt;box&gt;([\s\S]*?)&lt;\/box&gt;/gi, (_, p) => renderBoxHtml(p))
        .replace(/&lt;video([^>]*)&gt;([\s\S]*?)&lt;\/video&gt;/gi, (_, attrs, src) => renderVideoHtml(src.trim(), attrs));
      scope.innerHTML = html;
      // If any literal <image> tags remain (DOM created elements), convert them in-place too.
      scope.querySelectorAll('image').forEach(tag => {
        const raw = (tag.textContent || '').trim();
        const attrs = [];
        if (tag.hasAttribute('data-size')) attrs.push(`data-size="${tag.getAttribute('data-size')}"`);
        if (tag.hasAttribute('size')) attrs.push(`size="${tag.getAttribute('size')}"`);
        if (tag.hasAttribute('data-align')) attrs.push(`data-align="${tag.getAttribute('data-align')}"`);
        const htmlFrag = renderImageHtml(raw, attrs.join(' '));
        const temp = document.createElement('div');
        temp.innerHTML = htmlFrag;
        const rendered = temp.firstChild;
        tag.replaceWith(rendered);
      });
      // As a last resort, convert text nodes that still contain pseudo markup.
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = node.parentElement;
          if (p) {
            const tag = p.tagName;
            if (tag === 'A' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') return NodeFilter.FILTER_REJECT;
            if (p.closest && p.closest(CONTROL_SELECTOR)) return NodeFilter.FILTER_REJECT;
          }
          const val = node.nodeValue || '';
          if (val.includes('<image') || val.includes('<video') || val.includes('<box') || val.includes('<line')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          if (val.includes('&lt;image') || val.includes('&lt;video') || val.includes('&lt;box') || val.includes('&lt;line')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      });
      const textNodes = [];
      let tn;
      while ((tn = walker.nextNode())) textNodes.push(tn);
      textNodes.forEach(node => {
        const raw = (node.nodeValue || '')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        const frag = document.createDocumentFragment();
        let remaining = raw;
        const next = () => {
          const candidates = [];
          const mi = /<image([^>]*)>([\s\S]*?)<\/image>/i.exec(remaining);
          const mv = /<video([^>]*)>([\s\S]*?)<\/video>/i.exec(remaining);
          const mb = /<box>([\s\S]*?)<\/box>/i.exec(remaining);
          const ml = /<line><\/line>/i.exec(remaining);
          if (mi) candidates.push({ type: 'img', m: mi });
          if (mv) candidates.push({ type: 'vid', m: mv });
          if (mb) candidates.push({ type: 'box', m: mb });
          if (ml) candidates.push({ type: 'line', m: ml });
          if (!candidates.length) return null;
          return candidates.sort((a, b) => a.m.index - b.m.index)[0];
        };
        let hit;
        while ((hit = next())) {
          const { type, m } = hit;
          const before = remaining.slice(0, m.index);
          if (before) frag.appendChild(document.createTextNode(before));
          if (type === 'img') {
            const htmlFrag = renderImageHtml((m[2] || '').trim(), m[1] || '');
            const tmp = document.createElement('div');
            tmp.innerHTML = htmlFrag;
            frag.appendChild(tmp.firstChild);
          } else if (type === 'vid') {
            const htmlFrag = renderVideoHtml((m[2] || '').trim(), m[1] || '');
            const tmp = document.createElement('div');
            tmp.innerHTML = htmlFrag;
            frag.appendChild(tmp.firstChild);
          } else if (type === 'box') {
            const htmlFrag = renderBoxHtml(m[1] || '');
            const tmp = document.createElement('div');
            tmp.innerHTML = htmlFrag;
            frag.appendChild(tmp.firstChild);
          } else if (type === 'line') {
            const tmp = document.createElement('hr');
            frag.appendChild(tmp);
          }
          remaining = remaining.slice(m.index + m[0].length);
        }
        if (remaining) frag.appendChild(document.createTextNode(remaining));
        node.replaceWith(frag);
      });
      // Wrap any bare inline media nodes (native img/video) for controls/display.
      const wrapMediaNode = (node) => {
        if (!node || node.closest('.inline-media-block')) return;
        const block = document.createElement('div');
        block.className = 'inline-media-block';
        block.contentEditable = 'false';
        const wrap = document.createElement('div');
        wrap.className = 'inline-media-wrap';
        wrap.style.display = 'inline-block';
        wrap.style.maxWidth = '100%';
        const pseudo = node.dataset && node.dataset.pseudo;
        if (pseudo && (!node.src || node.src.includes('inline-media-missing'))) {
          node.src = resolvePseudoUrl(pseudo);
        }
        if (node.dataset && node.dataset.size && !node.style.width) {
          node.style.width = `${node.dataset.size}${node.dataset.size.includes('%') ? '' : '%'}`;
        }
        if (node.dataset && node.dataset.align) {
          block.style.textAlign = node.dataset.align;
        }
        wrap.appendChild(node);
        block.appendChild(wrap);
        if (node.parentElement) node.parentElement.replaceWith(block);
      };
      scope.querySelectorAll('img.inline-image').forEach(wrapMediaNode);
      scope.querySelectorAll('video.inline-video').forEach(wrapMediaNode);
    });
  };

  const cleanupInlineMediaWrappers = () => {
    if (document.body.classList.contains('edit-active')) return;
    document.querySelectorAll('.inline-media-wrap').forEach(wrap => {
      const parent = wrap.parentElement;
      if (parent) {
        while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
        wrap.remove();
      }
    });
  };

  const stripEditArtifacts = () => {
    document.querySelectorAll(`${CONTROL_SELECTOR}, .pager-floating, .edit-bar, .side-strip`).forEach(el => el.remove());
    cleanupInlineMediaWrappers();
  };

  // Remove any lingering inline control elements that may have been saved previously.
  const purgeControlArtifacts = () => {
    document.querySelectorAll(`${CONTROL_SELECTOR}, .side-strip`).forEach(el => el.remove());
  };

  const initRandomButton = () => {
    let nav = document.querySelector('.nav-links');
    if (!nav) {
      const header = document.querySelector('.site-header');
      if (!header) return;
      nav = document.createElement('nav');
      nav.className = 'nav-links';
      header.appendChild(nav);
    }

    const pagePath = (location.pathname || '').replace(/\\/g, '/');
    const isFile = location.protocol === 'file:';
    const existingRand = Array.from(nav.querySelectorAll('.nav-random'));
    let btn = existingRand[0];
    existingRand.slice(1).forEach(el => el.remove()); // dedupe extras

    const ensureButton = () => {
      if (btn) return;
      btn = document.createElement('button');
      btn.className = 'nav-btn nav-random';
      btn.title = 'Random data page';
      btn.textContent = 'Random';
      nav.appendChild(btn);
    };
    ensureButton();

    // Decorate button (icon) idempotently
    if (!btn.classList.contains('nav-random-icon')) {
      const logo = document.querySelector('.nav-logo');
      if (logo) {
        try {
          const srcUrl = new URL(logo.getAttribute('src'), location.href);
          const randomPath = srcUrl.pathname.replace(/\/res\/LOGO_Retraissance.gif.*$/i, '/media/ui/random.png');
          btn.style.backgroundImage = `url(${randomPath})`;
          btn.classList.add('nav-random-icon');
        } catch (_) { /* ignore */ }
      }
    }
    if (!btn.classList.contains('nav-btn')) btn.classList.add('nav-btn');

    const addCandidate = (list, href, base) => {
      if (!href || /index\.html?$/i.test(href)) return;
      try {
        const abs = new URL(href, base || location.href).href;
        list.push(abs);
      } catch (_) { /* ignore */ }
    };

    const gatherFromIndex = async () => {
      const dir = pagePath.replace(/[^/]+$/, '');
      const indexUrl = `${dir}index.html`;
      const targets = [];
      try {
        const res = await fetch(indexUrl);
        if (!res.ok) return targets;
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const anchors = Array.from(doc.querySelectorAll('#c-list a, #t-list a, .link-list a'));
        if (anchors.length) {
          anchors.forEach(a => addCandidate(targets, a.getAttribute('href'), indexUrl));
        }
        if (!anchors.length) {
          ['c-data-json', 't-data-json', 'tools-data-json'].forEach(id => {
            const node = doc.getElementById(id);
            if (!node) return;
            try {
              const data = JSON.parse(node.textContent || '[]');
              (Array.isArray(data) ? data : []).forEach(d => addCandidate(targets, d.href, indexUrl));
            } catch (_) { /* ignore */ }
          });
        }
      } catch (_) { /* ignore */ }
      return targets;
    };

    const gatherFromLexicon = async () => {
      const uniIdx = pagePath.indexOf('/densetsu/universe/');
      if (uniIdx === -1) return [];
      const base = pagePath.substring(0, uniIdx + '/densetsu/universe/'.length);
      const lexUrl = `${location.origin}${base}lexicon-data.json`;
      const lex = await fetchJsonSafe(lexUrl);
      const list = Array.isArray(lex) ? lex : [];
      const targets = [];
      list.forEach(e => addCandidate(targets, e.Href, `${location.origin}${base}`));
      return targets;
    };

    const gatherFromGlobalLexicon = async () => {
      const rootLex = await fetchJsonSafe(`${location.origin}/pages/retraissance/densetsu/universe/lexicon-data.json`);
      const list = Array.isArray(rootLex) ? rootLex : [];
      const targets = [];
      list.forEach(e => addCandidate(targets, e.Href, `${location.origin}/pages/retraissance/densetsu/universe/`));
      return targets;
    };

    const gatherFromTags = async () => {
      if (!pagePath.includes('/team/')) return [];
      const dir = pagePath.replace(/[^/]+$/, '');
      const tags = await fetchJsonSafe(`${dir}../assets/tags.json`);
      const targets = [];
      if (tags && tags.team) {
        Object.keys(tags.team).forEach(slug => addCandidate(targets, `${slug}.html`, dir));
      }
      return targets;
    };

    if (!btn.dataset.randInit) {
      btn.dataset.randInit = '1';
      btn.addEventListener('click', async () => {
        if (isFile) {
          alert('Random page requires http://localhost:3000 (file:// blocks fetch).');
          return;
        }
        const targets = [];

        ['c-data-json', 't-data-json'].forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          try {
            const data = JSON.parse(el.textContent || '[]');
            (Array.isArray(data) ? data : []).forEach(d => addCandidate(targets, d.href));
          } catch (_) { /* ignore */ }
        });

        const fromIndex = await gatherFromIndex();
        const fromLex = await gatherFromLexicon();
        const fromTags = await gatherFromTags();
        const fromGlobalLex = await gatherFromGlobalLexicon();
        const fromFallback = (LEXICON_FALLBACK || []).map(e => {
          try {
            const abs = new URL(e.Href, `${location.origin}/pages/retraissance/densetsu/universe/`).href;
            return abs;
          } catch (_) { return null; }
        }).filter(Boolean);
        const all = [...targets, ...fromIndex, ...fromLex, ...fromTags, ...fromGlobalLex, ...fromFallback];
        const uniq = Array.from(new Set(all));
        if (!uniq.length) {
          alert('No data pages found for random navigation. Ensure lexicon-data.json is reachable over http.');
          return;
        }
        const choice = uniq[Math.floor(Math.random() * uniq.length)];
        location.href = choice;
      });
    }
  };

  const openOverlay = (items, startIndex = 0) => {
    state.overlayOpen = true;
    let index = startIndex;
    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    const frame = document.createElement('div');
    frame.className = 'overlay-frame';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = 'X';
    const nav = document.createElement('div');
    nav.className = 'overlay-nav';
    const prev = document.createElement('button');
    prev.textContent = '<';
    const next = document.createElement('button');
    next.textContent = '>';
    nav.appendChild(prev);
    nav.appendChild(next);
    frame.appendChild(closeBtn);
    frame.appendChild(nav);
    overlay.appendChild(frame);

    const render = () => {
      const existing = frame.querySelector('.overlay-media');
      if (existing) existing.remove();
      const { src, title } = items[index];
      const mediaEl = isVideo(src) ? document.createElement('video') : document.createElement('img');
      mediaEl.className = 'overlay-media';
      mediaEl.src = src;
      mediaEl.title = title || '';
      if (isVideo(src)) {
        mediaEl.controls = true;
      }
      frame.appendChild(mediaEl);
    };

    const step = (dir) => {
      index = (index + dir + items.length) % items.length;
      render();
    };

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      state.overlayOpen = false;
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        state.overlayOpen = false;
      }
    });
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    document.body.appendChild(overlay);
    render();
  };

    const resolveMediaSrc = (baseMediaPath, slug, entrySrc) => {
    if (!entrySrc) return '';
    if (/^(https?:)?\/\//i.test(entrySrc) || entrySrc.startsWith('/')) return entrySrc;
    return `${baseMediaPath}${slug}/${entrySrc}`;
  };

  const probeMedia = async (baseMediaPath, slug, names, exts, limit = null) => {
    const prefix = `${baseMediaPath}${slug}/`;
    const candidates = [];
    names.forEach(name => exts.forEach(ext => candidates.push(`${prefix}${name}.${ext}`)));
    const tryImg = (src) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const results = await Promise.all(candidates.map(tryImg));
    const filtered = results.filter(Boolean).map(src => ({ src, title: '' }));
    return limit ? filtered.slice(0, limit) : filtered;
  };

  const findFirstMedia = async (baseMediaPath, slug, names, exts) => {
    const lowerExts = (exts || []).map(e => (e || '').toLowerCase());
    const audioExts = ['ogg', 'mp3', 'wav', 'flac'];
    const isAudioOnly = lowerExts.length && lowerExts.every(e => audioExts.includes(e));

    // Audio files cannot be probed via Image(), so fall back to fetch-based detection.
    if (isAudioOnly) {
      const prefix = `${baseMediaPath}${slug}/`;
      let fallback = null;
      for (const name of names) {
        for (const ext of lowerExts) {
          const url = `${prefix}${name}.${ext}`;
          if (!fallback) fallback = url;
          try {
              let res = await fetch(url, { method: 'HEAD' });
              if (!res.ok && res.status === 405) {
                // Some servers disallow HEAD; retry with GET.
                res = await fetch(url, { method: 'GET' });
              }
              if (res.ok) return url;
            } catch (_) { /* ignore */ }
        }
      }
      return null;
    }

    const items = await probeMedia(baseMediaPath, slug, names, exts, 1);
    return items.length ? items[0].src : null;
  };

  const insertCover = (panel, src) => {
    if (!src) return;
    const existing = panel.querySelector('.page-cover');
    if (existing) {
      const img = existing.querySelector('img') || document.createElement('img');
      img.src = src;
      img.alt = img.alt || 'Cover';
      if (!existing.contains(img)) existing.appendChild(img);
      return;
    }
    const h1 = panel.querySelector('h1');
    const cover = document.createElement('div');
    cover.className = 'page-cover';
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Cover';
    cover.appendChild(img);
    if (h1) h1.insertAdjacentElement('beforebegin', cover);
    else panel.prepend(cover);
  };

  const insertTurnaround = (panel, items) => {
    if (!panel || !items || !items.length) return;
    const h1 = panel.querySelector('h1');
    const wrap = document.createElement('div');
    wrap.className = 'turnaround-strip';
    const label = document.createElement('div');
    label.className = 'turnaround-header';
    label.textContent = 'Turnaround';
    wrap.appendChild(label);
    const rail = document.createElement('div');
    rail.className = 'turnaround-rail';
    items.forEach(entry => {
      const src = entry.src;
      const card = document.createElement('div');
      card.className = 'turnaround-frame';
      card.dataset.src = src;
      card.dataset.title = entry.title || '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = entry.title || 'turnaround frame';
      card.appendChild(img);
      rail.appendChild(card);
    });
    rail.addEventListener('click', (e) => {
      const frame = e.target.closest('.turnaround-frame');
      if (!frame) return;
      const galleryItems = Array.from(rail.children).map(node => ({
        src: node.dataset.src,
        title: node.dataset.title,
      }));
      const idx = Array.from(rail.children).indexOf(frame);
      openOverlay(galleryItems, idx);
    });
    wrap.appendChild(rail);
    if (h1) h1.insertAdjacentElement('afterend', wrap);
    else panel.prepend(wrap);
  };

  const insertLeftStrip = (items) => {
    if (!items || !items.length) return;
    const strip = document.createElement('div');
    strip.className = 'side-strip side-strip-left';
    const rail = document.createElement('div');
    rail.className = 'side-rail';
    items.forEach(entry => {
      const link = document.createElement('a');
      link.href = entry.src;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      const img = document.createElement('img');
      img.src = entry.src;
      img.alt = entry.title || 'gallery';
      link.appendChild(img);
      rail.appendChild(link);
    });
    strip.appendChild(rail);
    document.body.appendChild(strip);
    document.body.classList.add('has-media-strips');

    // gentle auto-scroll, pause on hover
    let paused = false;
    let dir = 1;
    const step = () => {
      if (!paused) {
        rail.scrollTop += dir * 0.5;
        if (rail.scrollTop + rail.clientHeight >= rail.scrollHeight - 2) dir = -1;
        if (rail.scrollTop <= 0) dir = 1;
      }
      requestAnimationFrame(step);
    };
    rail.addEventListener('mouseenter', () => { paused = true; });
    rail.addEventListener('mouseleave', () => { paused = false; });
    requestAnimationFrame(step);
  };

  const insertRightStrip = (portraitSrc, audioSrc) => {
    const hasPortrait = !!portraitSrc;
    const hasAudio = !!audioSrc;
    if (!hasPortrait && !hasAudio) return;
    const strip = document.createElement('div');
    strip.className = 'side-strip side-strip-right';
    if (hasPortrait) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'portrait-wrap';
      const link = document.createElement('a');
      link.href = portraitSrc;
      link.target = '_blank';
      link.rel = 'noopener';
      const img = document.createElement('img');
      img.src = portraitSrc;
      img.alt = 'Portrait';
      link.appendChild(img);
      imgWrap.appendChild(link);
      strip.appendChild(imgWrap);
    }
    if (hasAudio) {
      const playerWrap = document.createElement('div');
      playerWrap.className = 'audio-wrap';
      const label = document.createElement('div');
      label.className = 'audio-label';
      const parts = audioSrc.split('/');
      label.textContent = parts[parts.length - 1];
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = audioSrc;
      playerWrap.appendChild(label);
      playerWrap.appendChild(audio);
      strip.appendChild(playerWrap);
    }
    document.body.appendChild(strip);
    document.body.classList.add('has-media-strips');
  };

  const initMediaLayout = async () => {
    const pagePath = (location.pathname || '').replace(/\\/g, '/');
    const isIndex = /\bindex\.html?$/.test(pagePath);
    const scopes = [
      { marker: '/densetsu/', mediaDir: 'media/' },
      { marker: '/team/', mediaDir: 'media/team/' }
    ];
    const scope = scopes.find(s => pagePath.indexOf(s.marker) !== -1);
    if (!scope || isIndex) return;

    const markerIdx = pagePath.indexOf(scope.marker);
    let assetsBase;
    if (scope.marker === '/team/') {
      // Team assets live at /assets/, not under /team/assets/
      assetsBase = pagePath.substring(0, markerIdx) + '/assets/';
    } else {
      assetsBase = pagePath.substring(0, markerIdx + scope.marker.length) + 'assets/';
    }
    const slug = pagePath
      .substring(markerIdx + scope.marker.length)
      .replace(/^\//, '')
      .replace(/[?#].*$/, '')
      .replace(/\.html?$/, '');
    const baseMedia = `${assetsBase}${scope.mediaDir}`;
    const panel = document.querySelector('.panel');
    if (!panel) return;

    const imgExts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    const cover = await findFirstMedia(baseMedia, slug, ['cover', 'cover01', 'cover_01'], imgExts);
    insertCover(panel, cover);

    // Turnaround: manifest order if present, else probe predictable names.
    let turnItems = [];
    const manifestUrl = `${baseMedia}${slug}/media.json`;
    try {
      const res = await fetch(manifestUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          turnItems = data.filter(e => e && (e.src || e.file || e.path)).map(e => ({
            src: resolveMediaSrc(baseMedia, slug, e.src || e.file || e.path),
            title: e.title || ''
          }));
        }
      }
    } catch (err) { /* ignore */ }
    if (!turnItems.length) {
      const names = ['turnaround', 'turnaround_01', 'turn1', 'turn', 'sheet', 'sheet_01'];
      for (let i = 1; i <= 12; i += 1) {
        const pad = i.toString().padStart(2, '0');
        names.push(`turnaround${pad}`);
        names.push(`turnaround${i}`);
        names.push(`sheet${pad}`);
        names.push(`sheet${i}`);
      }
      turnItems = await probeMedia(baseMedia, slug, names, imgExts);
    }
    if (turnItems.length) insertTurnaround(panel, turnItems);

    // Side strips
    const leftNames = [];
    for (let i = 0; i <= 9; i += 1) {
      const pad = i.toString().padStart(2, '0');
      leftNames.push(`image${pad}`);
      leftNames.push(`img${pad}`);
    }
    const leftItems = await probeMedia(baseMedia, slug, leftNames, imgExts);
    insertLeftStrip(leftItems);

    const portrait = await findFirstMedia(baseMedia, slug, ['portrait', 'portrait01', 'portrait_square', 'portrait_top'], imgExts);
    const audioCandidates = ['theme', 'song', 'bgm', 'audio', 'ost', 'track'];
    const audioExts = ['ogg', 'mp3'];
    const audioSrc = await findFirstMedia(baseMedia, slug, audioCandidates, audioExts);
    insertRightStrip(portrait, audioSrc);
  };
    const enableInlineEdit = () => {
      const panel = document.querySelector('.panel');
      if (!panel) return;
      let editObserver = null;
      let observerPaused = false;
    const removeControlOverlays = () => panel.querySelectorAll(CONTROL_SELECTOR).forEach(el => el.remove());

    const bar = document.createElement('div');
    bar.className = 'edit-bar';

    const wrapInlineMedia = () => {
      const mediaNodes = panel.querySelectorAll('img.inline-image, video.inline-video');
      mediaNodes.forEach(node => {
        let wrap = node.closest('.inline-media-wrap');
        if (!wrap) {
          wrap = document.createElement('div');
          wrap.className = 'inline-media-wrap';
          wrap.style.display = 'inline-block';
          wrap.style.maxWidth = '100%';
          const parent = node.parentElement;
          parent.insertBefore(wrap, node);
          wrap.appendChild(node);
        } else if (!wrap.style.display) {
          wrap.style.display = 'inline-block';
          wrap.style.maxWidth = '100%';
        }
        // normalize stored size once per media
        if (!node.dataset.sizePercent) {
          const parent = node.parentElement;
          let pct = 100;
          if (parent && parent.getBoundingClientRect().width) {
            const w = node.getBoundingClientRect().width || 0;
            const pw = parent.getBoundingClientRect().width || 1;
            pct = Math.min(200, Math.max(10, (w / pw) * 100));
          } else if (node.style.width && node.style.width.endsWith('%')) {
            pct = parseFloat(node.style.width);
          }
          node.dataset.sizePercent = String(pct);
          node.style.width = `${pct}%`;
        } else {
          node.style.width = `${parseFloat(node.dataset.sizePercent || '100')}%`;
        }
      });
    };

    // Ensure inline pseudotag media are wrapped and have edit controls.
    const ensureMediaControls = () => {
      wrapInlineMedia();
      const mediaNodes = document.querySelectorAll('img.inline-image, video.inline-video');
      mediaNodes.forEach(node => {
        const wrap = node.closest('.inline-media-wrap');
        if (!wrap) return;
        let btnDel = wrap.querySelector('.inline-remove-media');
        if (!btnDel) {
          btnDel = document.createElement('button');
          btnDel.type = 'button';
          btnDel.className = 'inline-remove-media';
          btnDel.textContent = '×';
          btnDel.title = 'Remove media';
          btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            const block = wrap.closest('.inline-media-block');
            if (block) block.remove(); else wrap.remove();
            const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
            if (saveBtn) saveBtn.disabled = false;
          });
          wrap.appendChild(btnDel);
        }
        let btnEditMedia = wrap.querySelector('.inline-edit-media');
        if (!btnEditMedia) {
          btnEditMedia = document.createElement('button');
          btnEditMedia.type = 'button';
          btnEditMedia.className = 'inline-edit-media';
          btnEditMedia.textContent = '?';
          btnEditMedia.title = 'Edit media source';
          btnEditMedia.addEventListener('click', (e) => {
            e.stopPropagation();
            const current = node.getAttribute('src') || node.dataset.pseudo || '';
            const loopAttr = node.loop ? ' -loop' : '';
            const ncAttr = node.controls === false ? ' -nocontrols' : '';
            const runPicker = () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = node.tagName === 'VIDEO' ? 'video/*,audio/*' : 'image/*,video/*,audio/*';
              input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                if (!file) return;
                const name = file.name;
                node.dataset.pseudo = name;
                node.src = resolvePseudoUrl(name);
                node.classList.remove('inline-media-missing');
                node.removeAttribute('data-missing');
                if (node.tagName === 'VIDEO') {
                  try { node.load(); node.play(); } catch (_) { /* ignore */ }
                }
                const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
                if (saveBtn) saveBtn.disabled = false;
              }, { once: true });
              input.click();
            };
            const raw = prompt('Media source (you can include -loop and -nocontrols):', `${current}${loopAttr}${ncAttr}`);
            if (!raw) {
              runPicker();
              return;
            }
            const hasLoop = /-loop/.test(raw);
            const noControls = /-nocontrols/.test(raw);
            const cleaned = raw.replace(/-loop/gi, '').replace(/-nocontrols/gi, '').trim();
            node.dataset.pseudo = cleaned;
            node.src = resolvePseudoUrl(cleaned);
            if (!cleaned) {
              node.classList.add('inline-media-missing');
              node.dataset.missing = '1';
            } else {
              node.classList.remove('inline-media-missing');
              node.removeAttribute('data-missing');
            }
            if (node.tagName === 'VIDEO') {
              node.loop = hasLoop;
              if (hasLoop) node.setAttribute('loop', '');
              else node.removeAttribute('loop');
              node.controls = !noControls;
              if (noControls) node.setAttribute('controls', 'false');
              else node.setAttribute('controls', 'true');
              try { node.load(); node.play(); } catch (_) { /* ignore */ }
            }
            const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
            if (saveBtn) saveBtn.disabled = false;
          });
          wrap.appendChild(btnEditMedia);
        }
        const adjustSize = (delta) => {
          const base = node.dataset.sizePercent
            ? parseFloat(node.dataset.sizePercent)
            : (node.style.width && node.style.width.endsWith('%'))
              ? parseFloat(node.style.width)
              : 100;
          const next = Math.min(200, Math.max(10, base + delta));
          node.dataset.sizePercent = String(next);
          node.dataset.size = String(next);
          node.style.width = `${next}%`;
          const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
          if (saveBtn) saveBtn.disabled = false;
        };
        if (!node.dataset.sizePercent && node.style.width && node.style.width.endsWith('%')) {
          node.dataset.sizePercent = String(parseFloat(node.style.width));
        }
        let btnShrink = wrap.querySelector('.inline-size-down');
        if (!btnShrink) {
          btnShrink = document.createElement('button');
          btnShrink.type = 'button';
          btnShrink.className = 'inline-size inline-size-down';
          btnShrink.textContent = '–';
          btnShrink.title = 'Shrink media';
          btnShrink.addEventListener('click', (e) => { e.stopPropagation(); adjustSize(-5); });
          wrap.appendChild(btnShrink);
        }
        let btnGrow = wrap.querySelector('.inline-size-up');
        if (!btnGrow) {
          btnGrow = document.createElement('button');
          btnGrow.type = 'button';
          btnGrow.className = 'inline-size inline-size-up';
          btnGrow.textContent = '+';
          btnGrow.title = 'Grow media';
          btnGrow.addEventListener('click', (e) => { e.stopPropagation(); adjustSize(5); });
          wrap.appendChild(btnGrow);
        }
        // Move controls for media blocks
        let moveGroup = wrap.querySelector('.inline-move-group');
        if (!moveGroup) {
          moveGroup = document.createElement('div');
          moveGroup.className = 'inline-move-group';
          wrap.appendChild(moveGroup);
        }
        const ensureMoveBtn = (cls, label, title, dir) => {
          let btn = moveGroup.querySelector(`.${cls}`);
          if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `inline-move ${cls}`;
            btn.textContent = label;
            btn.title = title;
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const block = wrap.closest('.inline-media-block');
              if (!block) return;
              const markdown = panel.querySelector('.markdown') || panel;

              // Find the start of the current section (nearest preceding h2/h3/h4 within markdown).
              const findSectionStart = (el) => {
                let cursor = el;
                while (cursor && cursor !== markdown) {
                  if (cursor.tagName && /^H[234]$/i.test(cursor.tagName)) return cursor;
                  if (cursor.previousElementSibling) {
                    cursor = cursor.previousElementSibling;
                    if (cursor && cursor.tagName && /^H[234]$/i.test(cursor.tagName)) return cursor;
                  } else {
                    cursor = cursor.parentElement;
                  }
                }
                // fallback: nearest direct child of markdown
                let fallback = el;
                while (fallback && fallback.parentElement !== markdown) fallback = fallback.parentElement;
                return fallback;
              };

              const start = findSectionStart(block);
              const fallbackMoveBlock = () => {
                const parent = block.parentElement;
                if (!parent) return false;
                const sibling = dir === 'up' ? block.previousElementSibling : block.nextElementSibling;
                if (!sibling) return false;
                if (dir === 'up') parent.insertBefore(block, sibling);
                else parent.insertBefore(block, sibling.nextSibling);
                return true;
              };

              if (!start || !start.parentElement) {
                if (!fallbackMoveBlock()) return;
                const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
                if (saveBtn) saveBtn.disabled = false;
                return;
              }

              const collectSection = (startNode) => {
                const nodes = [];
                let n = startNode;
                while (n) {
                  nodes.push(n);
                  const next = n.nextElementSibling;
                  if (next && next.tagName && /^H[234]$/i.test(next.tagName)) break;
                  n = next;
                }
                return nodes;
              };

              const sectionNodes = collectSection(start);
              const parent = start.parentElement;

              const findPrevSectionStart = () => {
                let n = start.previousElementSibling;
                while (n) {
                  if (n.tagName && /^H[234]$/i.test(n.tagName)) return n;
                  n = n.previousElementSibling;
                }
                return null;
              };
              const findNextSectionStart = () => {
                let n = sectionNodes[sectionNodes.length - 1].nextElementSibling;
                while (n) {
                  if (n.tagName && /^H[234]$/i.test(n.tagName)) return n;
                  n = n.nextElementSibling;
                }
                return null;
              };

              const moveSectionUp = () => {
                const prevStart = findPrevSectionStart();
                if (!prevStart) return false;
                const frag = document.createDocumentFragment();
                sectionNodes.forEach(node => frag.appendChild(node));
                parent.insertBefore(frag, prevStart);
                return true;
              };
              const moveSectionDown = () => {
                const nextStart = findNextSectionStart();
                if (!nextStart) return false;
                // insert after the next section group
                const nextGroup = collectSection(nextStart);
                const anchor = nextGroup[nextGroup.length - 1].nextSibling;
                const frag = document.createDocumentFragment();
                sectionNodes.forEach(node => frag.appendChild(node));
                parent.insertBefore(frag, anchor);
                return true;
              };

              const moved = dir === 'up' ? moveSectionUp() : moveSectionDown();
              if (!moved) {
                // If no neighboring section to swap with, try local block move as fallback.
                if (!fallbackMoveBlock()) return;
              }
              const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
              if (saveBtn) saveBtn.disabled = false;
            });
            moveGroup.appendChild(btn);
          }
        };
        ensureMoveBtn('inline-move-up', '↑', 'Move media up', 'up');
        ensureMoveBtn('inline-move-down', '↓', 'Move media down', 'down');
        let alignGroup = wrap.querySelector('.inline-align-group');
        if (!alignGroup) {
          alignGroup = document.createElement('div');
          alignGroup.className = 'inline-align-group';
          const makeAlignBtn = (label, value) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'inline-align';
            b.textContent = label;
            b.addEventListener('click', (e) => {
              e.stopPropagation();
              const block = wrap.closest('.inline-media-block') || wrap.parentElement;
              if (block) block.style.textAlign = value;
              node.dataset.align = value;
              const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
              if (saveBtn) saveBtn.disabled = false;
            });
            alignGroup.appendChild(b);
          };
          makeAlignBtn('L', 'left');
          makeAlignBtn('C', 'center');
          makeAlignBtn('R', 'right');
          wrap.appendChild(alignGroup);
        }
      });
    };

    const selectionTouchesMediaBlock = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el = node.nodeType === 1 ? node : node.parentElement;
      return el && el.closest && el.closest('.inline-media-block');
    };

    const execCmd = (cmd) => {
      const alignmentCmds = ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
      if (alignmentCmds.includes(cmd)) {
        const sel = window.getSelection && window.getSelection();
        const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
        const alignValue = cmd === 'justifyCenter' ? 'center' : cmd === 'justifyRight' ? 'right' : cmd === 'justifyFull' ? 'justify' : 'left';
        const findBlockTarget = (node) => {
          let el = node && (node.nodeType === 1 ? node : node.parentElement);
          while (el && el !== document.body) {
            if (el.classList && el.classList.contains('inline-media-block')) return el;
            if (el.matches && el.matches('p, h1, h2, h3, h4, li, blockquote, pre, .callout')) return el;
            if (el.classList && (el.classList.contains('markdown') || el.classList.contains('panel'))) break; // stop climbing at container
            el = el.parentElement;
          }
          return null;
        };
        if (range) {
          const target = findBlockTarget(range.commonAncestorContainer);
          if (target) {
            target.style.textAlign = alignValue;
            btnSave.disabled = false;
            return;
          }
          // If selection is inside the panel but not wrapped in a block, wrap the selection in a paragraph and align it.
          if (panel.contains(range.commonAncestorContainer)) {
            const wrap = document.createElement('p');
            wrap.style.textAlign = alignValue;
            wrap.appendChild(range.extractContents());
            range.insertNode(wrap);
            sel.removeAllRanges();
            const after = document.createRange();
            after.setStartAfter(wrap);
            after.collapse(true);
            sel.addRange(after);
            btnSave.disabled = false;
            wrapInlineMedia();
            return;
          }
        }
      }
      try { document.execCommand(cmd, false, null); } catch (_) { /* ignore */ }
      wrapInlineMedia();
      sanitizeSelectionContext();
      btnSave.disabled = false;
    };

    const formatRow = document.createElement('div');
    formatRow.className = 'edit-format-row';
    const mkFmt = (label, title, cmd) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.addEventListener('mousedown', (e) => e.preventDefault()); // keep text selection
      b.addEventListener('click', () => execCmd(cmd));
      formatRow.appendChild(b);
    };
    const addCustomBtn = (label, title, handler) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection
      b.addEventListener('click', handler);
      formatRow.appendChild(b);
    };
    mkFmt('B', 'Bold (Ctrl+B)', 'bold');
    mkFmt('I', 'Italic (Ctrl+I)', 'italic');
    mkFmt('U', 'Underline (Ctrl+U)', 'underline');
    mkFmt('•', 'Toggle bullet list (Ctrl+Shift+8)', 'insertUnorderedList');
    mkFmt('L', 'Align left', 'justifyLeft');
    mkFmt('C', 'Align center', 'justifyCenter');
    mkFmt('R', 'Align right', 'justifyRight');
    const applyTextBox = () => {
      const editableRoot = panel.querySelector('.markdown') || panel;
      setEditable(true);
      const sel = window.getSelection && window.getSelection();
      let range = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      if (!range || !editableRoot.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(editableRoot);
        range.collapse(false);
      }

      const boxTag = document.createElement('box');
      const marker = `box-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      boxTag.dataset.boxMarker = marker;
      if (range.collapsed) {
        const p = document.createElement('p');
        p.textContent = 'TBD.';
        boxTag.appendChild(p);
      } else {
        boxTag.appendChild(range.extractContents());
      }
      range.insertNode(boxTag);
      const after = document.createRange();
      after.setStartAfter(boxTag);
      after.collapse(true);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(after);
      }
      lastRange = after.cloneRange();
      applyInlineMedia();
      const placed = editableRoot.querySelector(`[data-box-marker=\"${marker}\"]`);
      if (placed) {
        const afterBox = document.createRange();
        afterBox.setStartAfter(placed);
        afterBox.collapse(true);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(afterBox);
        }
        lastRange = afterBox.cloneRange();
      }
      sanitizeSelectionContext();
      btnSave.disabled = false;
    };
    addCustomBtn('Box', 'Wrap selection in a text box', applyTextBox);

    let lastRange = null;

    const btnNew = document.createElement('button');
    btnNew.textContent = 'New Page';
    btnNew.className = 'secondary';
    const btnAddHeading = document.createElement('button');
    btnAddHeading.textContent = 'Add Heading';
    btnAddHeading.className = 'secondary';
    const btnAddImage = document.createElement('button');
    btnAddImage.textContent = 'Add Image';
    btnAddImage.className = 'secondary';
    const btnDelete = document.createElement('button');
    btnDelete.textContent = 'Delete';
    btnDelete.className = 'danger';
    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Edit';
    const btnSave = document.createElement('button');
    btnSave.textContent = 'Save';
    btnSave.disabled = true;
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.className = 'secondary';
    bar.appendChild(formatRow);
    bar.appendChild(btnNew);
    bar.appendChild(btnAddHeading);
    bar.appendChild(btnDelete);
    bar.appendChild(btnAddImage);
    bar.appendChild(btnEdit);
    bar.appendChild(btnSave);
    bar.appendChild(btnCancel);
    document.body.appendChild(bar);

    const targetRoot = panel.querySelector('.markdown') || panel;
    const saveSelectionIfEditable = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      if (!targetRoot.contains(r.commonAncestorContainer)) return;
      lastRange = r.cloneRange();
    };
    targetRoot.addEventListener('mouseup', saveSelectionIfEditable);
    targetRoot.addEventListener('keyup', saveSelectionIfEditable);
    targetRoot.addEventListener('input', saveSelectionIfEditable);
    targetRoot.addEventListener('keyup', (e) => {
      if (!document.body.classList.contains('edit-active')) return;
      if ((e.ctrlKey || e.metaKey) && ['b','i','u'].includes(e.key.toLowerCase())) {
        sanitizeSelectionContext();
      }
    });
    document.addEventListener('selectionchange', () => {
      if (!document.body.classList.contains('edit-active')) return;
      saveSelectionIfEditable();
    });

    const setEditable = (on) => {
      document.body.classList.toggle('edit-active', on);
      purgeControlArtifacts();
      btnSave.disabled = !on;
      btnEdit.disabled = on;
        const targets = panel.querySelectorAll('.markdown, .callout, .panel > h1, .panel > .eyebrow, [data-editable="true"], .editable-text, .panel > p');
        targets.forEach(el => { el.contentEditable = on; });
        if (on) {
          // First re-render any pseudotags entered as text so media controls can attach.
          try { applyInlineMediaWithFallback(); } catch (err) { console.error('inline media refresh failed', err); }
          targets.forEach(el => sanitizeEditableElement(el));
          ensureMediaControls();
        }

      // Protect buttons from being edited (typing/cloning/deleting via contentEditable).
      const lockButtons = () => {
        const btns = panel.querySelectorAll('button');
        btns.forEach(b => {
          b.contentEditable = 'false';
          b.setAttribute('draggable', 'false');
          if (!b.dataset.noEditGuard) {
            b.addEventListener('keydown', (e) => e.preventDefault());
            b.addEventListener('beforeinput', (e) => e.preventDefault());
            b.dataset.noEditGuard = '1';
          }
        });
      };
      lockButtons();

      const runWithPause = (fn) => {
        observerPaused = true;
        try { fn(); } finally { observerPaused = false; }
      };

      const attachControls = (el, { allowMove = false, pairWithNext = false } = {}) => {
        let removeBtn = el.querySelector('.inline-remove');
        if (on && !removeBtn) {
          removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'inline-remove';
          removeBtn.textContent = '-';
          removeBtn.title = 'Remove block';
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            runWithPause(() => {
              const next = el.nextElementSibling;
              if (el.parentElement) el.remove();
              if (pairWithNext && next && (next.matches('.callout') || next.matches('p') || next.matches('div'))) {
                if (confirm('Remove following block too?')) next.remove();
              }
              btnSave.disabled = false;
            });
          });
          el.appendChild(removeBtn);
        } else if (!on && removeBtn) {
          removeBtn.remove();
        }

        if (!allowMove) return;
        const ensureBtn = (cls, label, title, handler) => {
          let btn = el.querySelector(`.${cls}`);
          if (on && !btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `inline-move ${cls}`;
            btn.textContent = label;
            btn.title = title;
            btn.addEventListener('click', handler);
            el.appendChild(btn);
          } else if (!on && btn) {
            btn.remove();
          }
        };

        const movePair = (dir) => {
          // Operate on the nearest direct child of .markdown or .panel to avoid trapping inside deeper blocks.
          const findContainer = (node) => {
            let n = node;
            while (n && n.parentElement && !n.parentElement.classList.contains('markdown') && !n.parentElement.classList.contains('panel')) {
              n = n.parentElement;
            }
            if (n && n.parentElement && (n.parentElement.classList.contains('markdown') || n.parentElement.classList.contains('panel'))) {
              return { container: n, parent: n.parentElement };
            }
            return null;
          };
          const ctx = findContainer(el);
          if (!ctx) return;
          const { container, parent } = ctx;
          const next = container.nextElementSibling;
          const pair = [container];
          if (pairWithNext && next && (next.matches('.callout') || next.matches('p') || next.matches('div'))) pair.push(next);
          runWithPause(() => {
            if (dir === 'up') {
              const target = container.previousElementSibling;
              if (!target || !parent) return;
              pair.forEach(node => parent.insertBefore(node, target));
            } else {
              const after = pair[pair.length - 1].nextElementSibling;
              if (!after || !parent) return;
              pair.reverse().forEach(node => parent.insertBefore(node, after.nextElementSibling));
            }
            btnSave.disabled = false;
          });
        };

        ensureBtn('inline-move-up', '↑', 'Move up', (e) => { e.stopPropagation(); movePair('up'); });
        ensureBtn('inline-move-down', '↓', 'Move down', (e) => { e.stopPropagation(); movePair('down'); });
      };

      const refreshControls = () => {
        removeControlOverlays();
        lockButtons();
        const headings = panel.querySelectorAll('h1, h2, h3');
        headings.forEach(h => attachControls(h, { allowMove: true, pairWithNext: true }));
        const blocks = panel.querySelectorAll('.callout, .markdown p, .panel > p, .source-excerpt, pre.source-excerpt, pre');
        blocks.forEach(b => {
          const isCallout = b.classList && b.classList.contains('callout');
          attachControls(b, { allowMove: isCallout, pairWithNext: false });
        });
        // Ensure any control buttons remain non-editable/undraggable overlays.
        panel.querySelectorAll(CONTROL_SELECTOR).forEach(btn => {
          btn.contentEditable = 'false';
          btn.setAttribute('draggable', 'false');
          btn.tabIndex = -1;
          btn.style.userSelect = 'none';
          btn.addEventListener('mousedown', (e) => e.stopPropagation(), { once: true });
          btn.addEventListener('click', (e) => e.stopPropagation(), { once: true });
        });
        // Re-wrap media in case surrounding alignment changes stripped wrappers.
        wrapInlineMedia();
        ensureMediaControls();
      };

      refreshControls();

      // unwrap any media wrappers when leaving edit mode
      if (!on) {
        panel.querySelectorAll('.inline-media-wrap').forEach(wrap => {
          const parent = wrap.parentElement;
          if (parent) {
            while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
            wrap.remove();
          }
        });
      } else {
        ensureMediaControls();
      }
        const mediaNodes = panel.querySelectorAll('img.inline-image, video.inline-video');
        mediaNodes.forEach(node => {
          const wrap = node.closest('.inline-media-wrap');
          if (!wrap) return;
          let btnDel = wrap.querySelector('.inline-remove-media');
          if (!btnDel) {
            btnDel = document.createElement('button');
            btnDel.type = 'button';
            btnDel.className = 'inline-remove-media';
            btnDel.textContent = '–';
            btnDel.title = 'Remove media';
            btnDel.addEventListener('click', (e) => {
              e.stopPropagation();
              wrap.remove();
              btnSave.disabled = false;
            });
            wrap.appendChild(btnDel);
          }
          let btnEditMedia = wrap.querySelector('.inline-edit-media');
          if (!btnEditMedia) {
            btnEditMedia = document.createElement('button');
            btnEditMedia.type = 'button';
            btnEditMedia.className = 'inline-edit-media';
            btnEditMedia.textContent = '✎';
            btnEditMedia.title = 'Edit media source';
            btnEditMedia.addEventListener('click', (e) => {
              e.stopPropagation();
              const current = node.getAttribute('src') || node.dataset.pseudo || '';
              const loopAttr = node.loop ? ' -loop' : '';
              const ncAttr = node.controls === false ? ' -nocontrols' : '';
              const runPicker = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = node.tagName === 'VIDEO' ? 'video/*,audio/*' : 'image/*,video/*,audio/*';
                input.addEventListener('change', () => {
                  const file = input.files && input.files[0];
                  if (!file) return;
                  const name = file.name;
                  node.dataset.pseudo = name;
                  node.src = resolvePseudoUrl(name);
                  node.classList.remove('inline-media-missing');
                  node.removeAttribute('data-missing');
                  if (node.tagName === 'VIDEO') {
                    try { node.load(); node.play(); } catch (_) { /* ignore */ }
                  }
                  btnSave.disabled = false;
                }, { once: true });
                input.click();
              };
              const raw = prompt('Media source (you can include -loop and -nocontrols):', `${current}${loopAttr}${ncAttr}`);
              if (!raw) {
                runPicker();
                return;
              }
              const hasLoop = /-loop/.test(raw);
              const noControls = /-nocontrols/.test(raw);
              const cleaned = raw.replace(/-loop/gi, '').replace(/-nocontrols/gi, '').trim();
              node.dataset.pseudo = cleaned;
              node.src = resolvePseudoUrl(cleaned);
              if (!cleaned) {
                node.classList.add('inline-media-missing');
                node.dataset.missing = '1';
              } else {
                node.classList.remove('inline-media-missing');
                node.removeAttribute('data-missing');
              }
              if (node.tagName === 'VIDEO') {
                node.loop = hasLoop;
                if (hasLoop) node.setAttribute('loop', '');
                else node.removeAttribute('loop');
                node.controls = !noControls;
                if (noControls) node.setAttribute('controls', 'false');
                else node.setAttribute('controls', 'true');
                try { node.load(); node.play(); } catch (_) { /* ignore */ }
              }
              btnSave.disabled = false;
            });
            wrap.appendChild(btnEditMedia);
          }
          const adjustSize = (delta) => {
            const base = node.dataset.sizePercent
              ? parseFloat(node.dataset.sizePercent)
              : (node.style.width && node.style.width.endsWith('%'))
                ? parseFloat(node.style.width)
                : 100;
            const next = Math.min(200, Math.max(10, base + delta));
            node.dataset.sizePercent = String(next);
            node.style.width = `${next}%`;
            btnSave.disabled = false;
          };
          // initialize dataset size from existing width once
          if (!node.dataset.sizePercent && node.style.width && node.style.width.endsWith('%')) {
            node.dataset.sizePercent = String(parseFloat(node.style.width));
          }
          let btnShrink = wrap.querySelector('.inline-size-down');
          if (!btnShrink) {
            btnShrink = document.createElement('button');
            btnShrink.type = 'button';
            btnShrink.className = 'inline-size inline-size-down';
            btnShrink.textContent = '–';
            btnShrink.title = 'Decrease size (5%)';
            btnShrink.addEventListener('click', (e) => { e.stopPropagation(); adjustSize(-5); });
            wrap.appendChild(btnShrink);
          }
          let btnGrow = wrap.querySelector('.inline-size-up');
          if (!btnGrow) {
            btnGrow = document.createElement('button');
            btnGrow.type = 'button';
            btnGrow.className = 'inline-size inline-size-up';
            btnGrow.textContent = '+';
            btnGrow.title = 'Increase size (5%)';
            btnGrow.addEventListener('click', (e) => { e.stopPropagation(); adjustSize(5); });
            wrap.appendChild(btnGrow);
          }
          const applyAlign = (val) => {
            node.dataset.align = val;
            node.style.display = 'block';
            node.style.marginTop = node.style.marginTop || '12px';
            node.style.marginBottom = node.style.marginBottom || '12px';
            if (val === 'left') {
              node.style.marginLeft = '0';
              node.style.marginRight = 'auto';
            } else if (val === 'right') {
              node.style.marginLeft = 'auto';
              node.style.marginRight = '0';
            } else {
              node.style.marginLeft = 'auto';
              node.style.marginRight = 'auto';
            }
            btnSave.disabled = false;
          };
          const alignGroup = wrap.querySelector('.inline-align-group') || (() => {
            const g = document.createElement('div');
            g.className = 'inline-align-group';
            wrap.appendChild(g);
            return g;
          })();
          const ensureAlignBtn = (cls, label, val) => {
            let b = alignGroup.querySelector(`.${cls}`);
            if (!b) {
              b = document.createElement('button');
              b.type = 'button';
              b.className = `inline-align ${cls}`;
              b.textContent = label;
              b.addEventListener('click', (e) => { e.stopPropagation(); applyAlign(val); });
              alignGroup.appendChild(b);
            }
          };
          ensureAlignBtn('inline-align-left', '←', 'left');
          ensureAlignBtn('inline-align-center', '•', 'center');
          ensureAlignBtn('inline-align-right', '→', 'right');
          applyAlign(node.dataset.align || 'center');
          // ease clicking overlays by disabling pointer events on media while editing
          if (on) {
            node.dataset._pe = node.style.pointerEvents || '';
            node.style.pointerEvents = 'none';
          }
        });

      if (!on) {
        // restore pointer events on media
        const mediaNodes = panel.querySelectorAll('img.inline-image, video.inline-video');
        mediaNodes.forEach(node => {
          if (node.dataset && node.dataset._pe !== undefined) {
            node.style.pointerEvents = node.dataset._pe;
            delete node.dataset._pe;
          } else {
            node.style.pointerEvents = '';
          }
        });
        if (window.getSelection) {
          const sel = window.getSelection();
          if (sel) sel.removeAllRanges();
        }
      } else {
        const mediaNodes = panel.querySelectorAll('img.inline-image, video.inline-video');
        mediaNodes.forEach(node => {
          node.dataset._pe = node.style.pointerEvents || '';
          node.style.pointerEvents = 'none';
        });
      }

      if (editObserver) {
        editObserver.disconnect();
        editObserver = null;
      }
      if (on) {
        editObserver = new MutationObserver((mutations) => {
          if (!document.body.classList.contains('edit-active')) return;
          if (observerPaused) return;
          // Ignore churn that only touches control overlays.
          const onlyControls = mutations.every(m => {
            const nodes = [...m.addedNodes, ...m.removedNodes];
            return nodes.every(n => {
              const el = n.nodeType === 1 ? n : null;
              return el && el.matches && el.matches(CONTROL_SELECTOR);
            });
          });
          if (onlyControls) return;
          observerPaused = true;
          try { refreshControls(); } catch (err) { console.error('refreshControls failed', err); }
          observerPaused = false;
        });
        editObserver.observe(panel, { childList: true, subtree: true });
      }
    };

    // Plain-text paste handler to normalize formatting to site styles.
    const sanitizeNode = (node) => {
      const allowed = new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE','PRE','CODE','A','HR','LINE','DIV','IMG','VIDEO','BOX','IMAGE']);
      const transformSpan = (span) => {
        const style = (span.getAttribute('style') || '').toLowerCase();
        const isBold = /font-weight:\s*(bold|[7-9]\d\d|1\d00)/.test(style);
        const isItalic = /font-style:\s*italic/.test(style);
        const isUnderline = /text-decoration:\s*underline/.test(style);
        const frag = document.createDocumentFragment();
        let container = frag;
        if (isBold) {
          const s = document.createElement('strong');
          container.appendChild(s);
          container = s;
        }
        if (isItalic) {
          const em = document.createElement('em');
          container.appendChild(em);
          container = em;
        }
        if (isUnderline) {
          const u = document.createElement('u');
          container.appendChild(u);
          container = u;
        }
        span.childNodes.forEach(ch => {
          const clean = sanitizeNode(ch);
          if (clean) container.appendChild(clean);
        });
        return frag;
      };
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.nodeValue || '';
        if (!txt.includes('<image') && !txt.includes('<video') && !txt.includes('<box') && !txt.includes('<line')) {
          return document.createTextNode(txt);
        }
        // Convert pseudotag text into elements so it can be rendered later.
        const frag = document.createDocumentFragment();
        let remaining = txt;
        const nextMatch = () => {
          const patterns = [
            { type: 'img', re: /<image([^>]*)>([\s\S]*?)<\/image>/i },
            { type: 'vid', re: /<video([^>]*)>([\s\S]*?)<\/video>/i },
            { type: 'box', re: /<box>([\s\S]*?)<\/box>/i },
            { type: 'line', re: /<line><\/line>/i },
          ];
          let best = null;
          patterns.forEach(pat => {
            const m = pat.re.exec(remaining);
            if (m && (best === null || m.index < best.match.index)) best = { pat, match: m };
          });
          return best;
        };
        let found;
        while ((found = nextMatch())) {
          const { pat, match } = found;
          const before = remaining.slice(0, match.index);
          if (before) frag.appendChild(document.createTextNode(before));
          if (pat.type === 'img') {
            const el = document.createElement('image');
            const attrs = match[1] || '';
            const body = (match[2] || '').trim();
            const size = (attrs.match(/data-size\s*=\s*"([^"]+)"/i) || [])[1] || '';
            const align = (attrs.match(/data-align\s*=\s*"([^"]+)"/i) || [])[1] || '';
            if (size) el.setAttribute('data-size', size);
            if (align) el.setAttribute('data-align', align);
            el.textContent = body;
            frag.appendChild(el);
          } else if (pat.type === 'vid') {
            const el = document.createElement('video');
            const attrs = (match[1] || '').trim();
            const body = (match[2] || '').trim();
            if (attrs) el.setAttribute('data-attrs', attrs);
            el.textContent = body;
            frag.appendChild(el);
          } else if (pat.type === 'box') {
            const el = document.createElement('box');
            el.innerHTML = match[1] || '';
            frag.appendChild(el);
          } else if (pat.type === 'line') {
            const el = document.createElement('line');
            frag.appendChild(el);
          }
          remaining = remaining.slice(match.index + match[0].length);
        }
        if (remaining) frag.appendChild(document.createTextNode(remaining));
        return frag;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return null;
      const tag = node.tagName;
      if (tag === 'SPAN') return transformSpan(node);
      if (!allowed.has(tag)) {
        const frag = document.createDocumentFragment();
        node.childNodes.forEach(ch => {
          const clean = sanitizeNode(ch);
          if (clean) frag.appendChild(clean);
        });
        return frag;
      }
      if (tag === 'BOX') {
        const el = document.createElement('div');
        el.className = 'callout';
        if (node.dataset && node.dataset.boxMarker) el.dataset.boxMarker = node.dataset.boxMarker;
        node.childNodes.forEach(ch => {
          const clean = sanitizeNode(ch);
          if (clean) el.appendChild(clean);
        });
        if (!el.childNodes.length) {
          const p = document.createElement('p');
          p.textContent = 'TBD.';
          el.appendChild(p);
        }
        return el;
      }
      if (tag === 'DIV' && !node.classList.contains('callout') && !node.classList.contains('inline-media-block')) {
        const frag = document.createDocumentFragment();
        node.childNodes.forEach(ch => {
          const clean = sanitizeNode(ch);
          if (clean) frag.appendChild(clean);
        });
        return frag;
      }
      if (tag === 'DIV' && node.classList.contains('inline-media-block')) {
        const el = document.createElement('div');
        el.className = 'inline-media-block';
        el.contentEditable = 'false';
        if (node.style && node.style.textAlign) el.style.textAlign = node.style.textAlign;
        node.childNodes.forEach(ch => {
          const clean = sanitizeNode(ch);
          if (clean) el.appendChild(clean);
        });
        return el;
      }
      if (tag === 'IMAGE') {
        const el = document.createElement('image');
        if (node.dataset.size) el.setAttribute('data-size', node.dataset.size);
        if (node.dataset.sizePercent) el.setAttribute('data-size', node.dataset.sizePercent);
        if (node.dataset.align) el.setAttribute('data-align', node.dataset.align);
        el.textContent = node.textContent || '';
        return el;
      }
      if (tag === 'IMG' || tag === 'VIDEO') {
        const el = document.createElement(tag.toLowerCase());
        const src = node.getAttribute('src') || '';
        if (src) el.setAttribute('src', src);
        if (node.className) el.className = node.className;
        if (node.dataset.sizePercent) el.dataset.sizePercent = node.dataset.sizePercent;
        if (node.dataset.size) el.dataset.size = node.dataset.size;
        if (node.dataset.align) el.dataset.align = node.dataset.align;
        if (node.dataset.pseudo) el.dataset.pseudo = node.dataset.pseudo;
        if (node.dataset.missing) el.dataset.missing = node.dataset.missing;
        if (node.style) {
          const copy = ['width','height','maxWidth','maxHeight','margin','display','pointerEvents'];
          copy.forEach(k => {
            const v = node.style[k];
            if (v) el.style[k] = v;
          });
        }
        if (!src) {
          el.classList.add('inline-media-missing');
          el.dataset.missing = '1';
        }
        if (tag === 'VIDEO') {
          const attrs = ['controls', 'loop', 'autoplay', 'muted', 'playsinline'];
          attrs.forEach(a => {
            if (node.hasAttribute(a)) el.setAttribute(a, node.getAttribute(a) || '');
          });
        }
        return el;
      }
      let mappedTag = tag === 'B' ? 'strong' : tag === 'I' ? 'em' : tag.toLowerCase();
      if (tag === 'LINE') mappedTag = 'hr';
      const el = document.createElement(mappedTag);
      if (tag === 'DIV' && node.classList.contains('callout')) el.className = 'callout';
      if (tag === 'LINE') el.dataset.pseudoline = '1';
      if (node.style && node.style.textAlign) el.style.textAlign = node.style.textAlign;
      if (tag === 'A') {
        const href = node.getAttribute('href') || '';
        if (!/^javascript:/i.test(href)) el.setAttribute('href', href);
      }
      node.childNodes.forEach(ch => {
        const clean = sanitizeNode(ch);
        if (clean) el.appendChild(clean);
      });
      return el;
    };

    const sanitizeHtmlFragment = (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const root = doc.body.firstChild;
      const frag = document.createDocumentFragment();
      root.childNodes.forEach(ch => {
        const clean = sanitizeNode(ch);
        if (clean) frag.appendChild(clean);
      });
      return frag;
    };

    const sanitizeEditableElement = (el) => {
      // Work on a clone stripped of overlay controls to avoid persisting their symbols.
      const temp = el.cloneNode(true);
      temp.querySelectorAll(CONTROL_SELECTOR).forEach(n => n.remove());
      const html = temp.innerHTML;
      const frag = sanitizeHtmlFragment(html);
      // Drop empty headings that may be introduced during sanitization/pasting.
      Array.from(frag.querySelectorAll ? frag.querySelectorAll('h1,h2,h3,h4') : []).forEach(node => {
        if (!node.textContent || !node.textContent.trim()) node.remove();
      });
      el.innerHTML = '';
      el.appendChild(frag);
    };

    const sanitizeSelectionContext = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const node = sel.anchorNode;
      const editable = node && (node.nodeType === 1 ? node : node.parentElement) && (node.nodeType === 1 ? node : node.parentElement).closest && (node.nodeType === 1 ? node : node.parentElement).closest('.markdown, .callout, [contenteditable="true"]');
      if (editable) sanitizeEditableElement(editable);
    };

    const handlePaste = (e) => {
      if (!document.body.classList.contains('edit-active')) return;
      const target = e.target;
      if (!(target && (target.isContentEditable || target.closest('[contenteditable=\"true\"]')))) return;
      const html = (e.clipboardData && e.clipboardData.getData('text/html')) || '';
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!html && !text) return;
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      let frag = null;
      if (html) {
        frag = sanitizeHtmlFragment(html);
      } else {
        const lines = text.replace(/\r\n/g, '\n').split('\n');
        frag = document.createDocumentFragment();
        lines.forEach((line, idx) => {
          if (idx > 0) frag.appendChild(document.createElement('br'));
          frag.appendChild(document.createTextNode(line));
        });
      }
      range.deleteContents();
      range.insertNode(frag);
      sel.collapse(range.endContainer, range.endOffset);
      btnSave.disabled = false;
    };
    document.addEventListener('paste', handlePaste);
    const selectionTouchesControl = () => {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return false;
      const nodes = [sel.anchorNode, sel.focusNode];
      return nodes.some(n => {
        const el = n && (n.nodeType === 1 ? n : n.parentElement);
        return el && el.closest(CONTROL_SELECTOR);
      });
    };
    const handleProtectedKeys = (e) => {
      if (!document.body.classList.contains('edit-active')) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectionTouchesControl() || (e.target && e.target.closest(CONTROL_SELECTOR))) {
          e.preventDefault();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (selectionTouchesControl() || (e.target && e.target.closest(CONTROL_SELECTOR))) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleProtectedKeys, true);
    const normalizeInputPath = (input) => {
      if (!input) return null;
      const clean = input.replace(/\\/g, '/').replace(/^\/+/, '');
      if (clean.startsWith('pages/')) return clean;
      return `pages/retraissance/${clean}`;
    };

    const slugify = (s = '') => (s || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'untitled';

    const promptCreatePage = async () => {
      const available = ['character','enemy','creature','location','artifact','culture','faction','concept','event','world','team','tool'];
      const template = (prompt(`Template? (${available.join('/')})`, 'character') || 'character').toLowerCase();
      const chosen = available.includes(template) ? template : 'character';
      const title = prompt('Page title:', 'Untitled') || 'Untitled';
      const slug = slugify(title);
      const defaultPaths = {
        character: `pages/retraissance/densetsu/universe/characters/${slug}.html`,
        enemy: `pages/retraissance/densetsu/universe/enemies/${slug}.html`,
        creature: `pages/retraissance/densetsu/universe/creatures/${slug}.html`,
        location: `pages/retraissance/densetsu/universe/locations/${slug}.html`,
        artifact: `pages/retraissance/densetsu/universe/artifacts/${slug}.html`,
        culture: `pages/retraissance/densetsu/universe/cultures/${slug}.html`,
        faction: `pages/retraissance/densetsu/universe/factions/${slug}.html`,
        concept: `pages/retraissance/densetsu/universe/concepts/${slug}.html`,
        event: `pages/retraissance/densetsu/universe/events/${slug}.html`,
        world: `pages/retraissance/densetsu/universe/world/${slug}.html`,
        team: `pages/retraissance/team/${slug}.html`,
        tool: `pages/retraissance/tools/${slug}.html`,
      };

      const path = defaultPaths[chosen] || `pages/retraissance/${slug}.html`;
      const override = prompt(`Confirm path or provide custom for ${chosen}:\n${path}`, path);
      const finalPath = normalizeInputPath(override);
      if (!finalPath) return;
      const fixedPath = /\.html?$/i.test(finalPath) ? finalPath : `${finalPath}.html`;

      try {
        const res = await fetch(createEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fixedPath, title, template: chosen })
        });
        if (!res.ok) throw new Error(`Create failed ${res.status}`);
        // On success, reload to pick up updated indexes (no alert to stay silent)
        location.reload(true);
      } catch (err) {
        console.error('Create failed', err);
        alert(`Create failed: ${err.message}`);
      }
    };

    const promptDeletePage = async () => {
      // Normalize path to be relative to repo root (start at pages/retraissance/...).
      const pagePath = (location.pathname || '').replace(/\\/g, '/');
      const relMatch = pagePath.match(/(pages\/retraissance\/.*)$/);
      const normPath = relMatch ? relMatch[1] : pagePath.replace(/^\/+/, '');
      if (!normPath) return alert('Cannot resolve page path for deletion.');
      if (!confirm(`Delete this page?\n${normPath}`)) return;
      const removeMedia = confirm('Also delete associated media folder?');
      try {
        const res = await fetch(deleteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: normPath, removeMedia })
        });
        if (!res.ok) throw new Error(`Delete failed ${res.status}`);
        // Navigate up one level to avoid 404
        const parent = pagePath.replace(/[^/]+$/, 'index.html');
        location.href = parent;
      } catch (err) {
        console.error('Delete failed', err);
        alert(`Delete failed: ${err.message}`);
      }
    };

    const doSave = async () => {
      btnSave.disabled = true;
      btnEdit.disabled = true;

      // Re-hydrate inline media into pseudotags before capture, so tags survive saving (and preserve size/alignment).
      const restorePseudotags = () => {
        const scopes = Array.from(document.querySelectorAll('main .panel, main article, .callout')).filter(el => !el.closest('header'));
        const wrapIfBare = (node) => {
          if (!node.parentElement || node.parentElement === document.body) return false;
          const pLike = ['P', 'DIV', 'LI'];
          if (pLike.includes(node.parentElement.tagName)) return false;
          const p = document.createElement('p');
          node.replaceWith(p);
          p.appendChild(node);
          return true;
        };
        scopes.forEach(scope => {
          scope.querySelectorAll('img.inline-image').forEach(img => {
            const pseudo = img.dataset.pseudo || '';
            if (!pseudo.trim()) return;
            const size = img.dataset.size || img.dataset.sizePercent || (img.style.width && img.style.width.endsWith('%') ? img.style.width.replace('%','') : '');
            const parentAlign = (img.closest('.inline-media-block') || {}).style && (img.closest('.inline-media-block') || {}).style.textAlign;
            const align = img.dataset.align || (parentAlign ? (parentAlign === 'left' || parentAlign === 'right' ? parentAlign : 'center') : '');
            const cleanImg = document.createElement('img');
            cleanImg.className = 'inline-image';
            cleanImg.dataset.pseudo = pseudo.trim();
            if (size) cleanImg.dataset.size = size;
            if (align) cleanImg.dataset.align = align;
            if (size) cleanImg.style.width = `${size}${size.includes('%') ? '' : '%'}`;
            if (align === 'left') cleanImg.style.margin = '12px auto 12px 0';
            else if (align === 'right') cleanImg.style.margin = '12px 0 12px auto';
            else cleanImg.style.margin = '12px auto';
            cleanImg.src = resolvePseudoUrl(pseudo.trim());
            const block = img.closest('.inline-media-block');
            if (block) {
              block.replaceWith(cleanImg);
            } else {
              if (!wrapIfBare(cleanImg)) img.replaceWith(cleanImg);
            }
          });
          scope.querySelectorAll('video.inline-video').forEach(vid => {
            const pseudo = vid.dataset.pseudo || '';
            if (!pseudo.trim()) return;
            const attrs = [];
            if (!vid.controls) attrs.push('-nocontrols');
            if (vid.loop) attrs.push('-loop');
            const cleanVid = document.createElement('video');
            cleanVid.className = 'inline-video';
            cleanVid.dataset.pseudo = pseudo.trim();
            if (attrs.length) cleanVid.dataset.attrs = attrs.join(' ');
            cleanVid.src = resolvePseudoUrl(pseudo.trim());
            cleanVid.autoplay = true;
            cleanVid.muted = true;
            cleanVid.playsInline = true;
            cleanVid.setAttribute('playsinline', '');
            if (attrs.includes('-loop')) { cleanVid.loop = true; cleanVid.setAttribute('loop', ''); }
            if (attrs.includes('-nocontrols')) cleanVid.controls = false;
            else cleanVid.controls = true;
            cleanVid.style.maxWidth = '100%';
            cleanVid.style.display = 'block';
            cleanVid.style.margin = '12px auto';
            const block = vid.closest('.inline-media-block');
            if (block) {
              block.replaceWith(cleanVid);
            } else {
              if (!wrapIfBare(cleanVid)) vid.replaceWith(cleanVid);
            }
          });
        });
      };

      // Normalize path to be relative to repo root (start at pages/retraissance/...).
      const pagePath = (location.pathname || '').replace(/\\/g, '/');
      const relMatch = pagePath.match(/(pages\/retraissance\/.*)$/);
      const normPath = relMatch ? relMatch[1] : pagePath.replace(/^\/+/, '');

      // Ensure any text pseudotags are rendered so we can convert them back cleanly.
      try { applyInlineMediaWithFallback(); } catch (_) {}
      // Apply conversion before stripping edit artifacts to preserve tags (now into native media tags).
      restorePseudotags();
      stripEditArtifacts();
      const payload = {
        path: normPath || (location.pathname || '').replace(/^\//, ''),
        html: document.documentElement.outerHTML
      };
      try {
        const res = await fetch(saveEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        });
        if (!res.ok) throw new Error(`Save failed ${res.status}`);
        setEditable(false);
        btnEdit.disabled = false;
        location.reload(true);
      } catch (err) {
        btnSave.disabled = false;
        btnEdit.disabled = false;
        console.error('Save failed', err, payload);
        alert(`Save failed: ${err.message}\nEnsure dev save server is running: node scripts/dev-save-server.js`);
      }
    };

    btnNew.addEventListener('click', promptCreatePage);
    btnDelete.addEventListener('click', promptDeletePage);

    const addHeadingBlock = () => {
      setEditable(true);
      const target = panel.querySelector('.markdown') || panel;
      const heading = prompt('Heading text:', 'New Section');
      if (!heading) return;
      const h2 = document.createElement('h2');
      h2.textContent = heading;
      const block = document.createElement('div');
      block.className = 'callout';
      block.innerHTML = '<p>TBD.</p>';

      const sel = window.getSelection && window.getSelection();
      let range = null;
      if (lastRange && target.contains(lastRange.commonAncestorContainer)) {
        range = lastRange.cloneRange();
      } else if (sel && sel.rangeCount && target.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        range = sel.getRangeAt(0).cloneRange();
      }
      const frag = document.createDocumentFragment();
      frag.appendChild(h2);
      frag.appendChild(block);

      const findPanelChild = (node) => {
        let n = node;
        if (n && n.nodeType === Node.TEXT_NODE) n = n.parentElement;
        while (n && n !== target && n.parentElement !== target) {
          n = n.parentElement;
        }
        return (n && n.parentElement === target) ? n : null;
      };

      const insertAfter = (ref, fragment) => {
        if (ref && ref.nextSibling) target.insertBefore(fragment, ref.nextSibling);
        else target.appendChild(fragment);
      };

      const isEmptyBlock = (el) => {
        if (!el) return false;
        if (el.querySelector && el.querySelector('img, video, hr')) return false;
        const text = (el.textContent || '').trim();
        return text.length === 0;
      };

      const withinTarget = range && target.contains(range.commonAncestorContainer);
      if (withinTarget) {
        const panelChild = findPanelChild(range.commonAncestorContainer);
        if (panelChild) {
          // if current block is empty, replace it; else find next empty block; else insert after.
          if (isEmptyBlock(panelChild)) {
            target.insertBefore(frag, panelChild);
            panelChild.remove();
          } else {
            let cursor = panelChild.nextElementSibling;
            let placed = false;
            while (cursor) {
              if (isEmptyBlock(cursor)) {
                target.insertBefore(frag, cursor);
                cursor.remove();
                placed = true;
                break;
              }
              cursor = cursor.nextElementSibling;
            }
            if (!placed) insertAfter(panelChild, frag);
          }
        } else {
          target.appendChild(frag);
        }
        if (sel) {
          const after = document.createRange();
          after.setStartAfter(block);
          after.collapse(true);
          sel.removeAllRanges();
          sel.addRange(after);
        }
      } else {
        target.appendChild(frag);
      }
      // remember new position after insertion
      const afterBlockRange = document.createRange();
      afterBlockRange.setStartAfter(block);
      afterBlockRange.collapse(true);
      lastRange = afterBlockRange.cloneRange();
      document.body.classList.add('edit-active');
      btnSave.disabled = false;
    };
    btnAddHeading.addEventListener('click', addHeadingBlock);

    const addImageAtCursor = () => {
      setEditable(true);
      const pseudo = prompt('Image filename (from media folder or URL):', '') || '';
      if (!pseudo.trim()) return;
      const size = prompt('Width percent (10-200):', '100') || '100';
      const align = (prompt('Align (left/center/right):', 'center') || 'center').toLowerCase();
      const img = document.createElement('img');
      img.className = 'inline-image';
      img.dataset.pseudo = pseudo.trim();
      img.dataset.size = size.trim();
      img.dataset.align = ['left','right','center'].includes(align) ? align : 'center';
      img.src = resolvePseudoUrl(pseudo.trim());
      img.style.width = `${size}${size.includes('%') ? '' : '%'}`;
      if (img.dataset.align === 'left') img.style.margin = '12px auto 12px 0';
      else if (img.dataset.align === 'right') img.style.margin = '12px 0 12px auto';
      else img.style.margin = '12px auto';
      img.style.display = 'block';

      // wrap immediately to ensure consistent layout
      const wrap = document.createElement('div');
      wrap.className = 'inline-media-wrap';
      wrap.style.display = 'inline-block';
      wrap.style.maxWidth = '100%';
      const block = document.createElement('div');
      block.className = 'inline-media-block';
      block.style.textAlign = img.dataset.align || 'center';
      block.contentEditable = 'false';
      wrap.appendChild(img);
      block.appendChild(wrap);

      const target = panel.querySelector('.markdown') || panel;
      const sel = window.getSelection && window.getSelection();
      let range = null;
      if (lastRange && target.contains(lastRange.commonAncestorContainer)) {
        range = lastRange.cloneRange();
      } else if (sel && sel.rangeCount && target.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        range = sel.getRangeAt(0).cloneRange();
      }

      const placeNode = (node) => {
        if (range) {
          range.deleteContents();
          range.insertNode(node);
        } else {
          target.appendChild(node);
        }
      };

      placeNode(block);
      try { applyInlineMediaWithFallback(); ensureMediaControls(); } catch (_) {}
      const saveBtn = document.querySelector('.edit-bar button:nth-child(6)');
      if (saveBtn) saveBtn.disabled = false;
    };
    btnAddImage.addEventListener('click', addImageAtCursor);

    btnEdit.addEventListener('click', () => setEditable(true));
    btnSave.addEventListener('click', doSave);
    btnCancel.addEventListener('click', () => location.reload(true));
    // ensure we start in view mode even if markup had edit-active
    setEditable(false);

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!btnSave.disabled) doSave();
      }
      if (e.ctrlKey && e.shiftKey && (e.key === '8' || e.key === '*')) {
        e.preventDefault();
        execCmd('insertUnorderedList');
      }
      if (e.key === 'Escape' && document.body.classList.contains('edit-active')) {
        e.preventDefault();
        location.reload(true);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Remove any baked edit bars/pagers/side-strips and edit-active flag before initializing.
    stripEditArtifacts();
    document.body.classList.remove('edit-active');
    try { buildBreadcrumb(); } catch (err) { console.error('buildBreadcrumb failed', err); }
    try { initMediaLayout(); } catch (err) { console.error('initMediaLayout failed', err); }
    try { applyInlineMediaWithFallback(); bindInlineLightbox(); cleanupInlineMediaWrappers(); } catch (err) { console.error('inline media inject failed', err); }
    try { enableInlineEdit(); } catch (err) { console.error('enableInlineEdit failed', err); }
    // Fallback: if the toolbar failed to appear, attempt a second pass after a tick.
    if (!document.querySelector('.edit-bar')) {
      setTimeout(() => {
        try { enableInlineEdit(); } catch (err) { console.error('enableInlineEdit retry failed', err); }
      }, 0);
    }
    try { initPrevNextNav(); } catch (err) { console.error('initPrevNextNav failed', err); }
    try { setupRetraissanceDropdown(); } catch (err) { console.error('setupRetraissanceDropdown failed', err); }
    try { ensureToolsNavLink(); } catch (err) { console.error('ensureToolsNavLink failed', err); }
    try { initRandomButton(); } catch (err) { console.error('initRandomButton failed', err); }

    // Universe autolink from lexicon data
    const pagePath = (location.pathname || '').replace(/\\\\/g, '/');
    const universeIdx = pagePath.indexOf('/densetsu/universe');
    if (universeIdx !== -1) {
      const base = pagePath.substring(0, universeIdx + '/densetsu/universe/'.length);
      const lexUrl = `${base}lexicon-data.json`;
      const maxLinks = 200;

      const apply = (data) => {
        if (!Array.isArray(data) || !data.length) return;
        const map = {};
        data.forEach(e => {
          const key = (e.Name || '').toLowerCase();
          if (!key || map[key]) return;
          map[key] = e;
        });
        const terms = Object.keys(map).sort((a, b) => b.length - a.length);
        if (!terms.length) return;
        const escaped = terms.map(t => t.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\\\$&'));
        const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
        const scopes = Array.from(document.querySelectorAll('main .panel, main article, .callout')).filter(el => !el.closest('header'));
        let linksMade = 0;

        const linkTextNode = (node) => {
          if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
          const text = node.nodeValue;
          let match;
          let last = 0;
          const frag = document.createDocumentFragment();
          while ((match = regex.exec(text)) && linksMade < maxLinks) {
            const term = match[0];
            const entry = map[term.toLowerCase()];
            if (!entry) continue;
            frag.appendChild(document.createTextNode(text.slice(last, match.index)));
            const a = document.createElement('a');
            a.href = `${base}${entry.Href}`;
            a.textContent = term;
            a.className = 'auto-link';
            frag.appendChild(a);
            last = match.index + term.length;
            linksMade += 1;
          }
          if (linksMade >= maxLinks || last === 0) return;
          frag.appendChild(document.createTextNode(text.slice(last)));
          node.replaceWith(frag);
        };

        const walkerFilter = {
          acceptNode(node) {
            const parent = node.parentElement;
            if (parent) {
              const tag = parent.tagName;
              if (tag === 'A' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') return NodeFilter.FILTER_REJECT;
              if (parent.closest('.no-autolink, [data-autolink="off"]')) return NodeFilter.FILTER_REJECT;
              if (parent.closest('.link-list')) return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        };

        scopes.forEach(scope => {
          const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, walkerFilter);
          const nodes = [];
          let n;
          while ((n = walker.nextNode()) && linksMade < maxLinks) nodes.push(n);
          nodes.forEach(node => {
            if (/pending canonical content/i.test(node.nodeValue || '')) return;
            linkTextNode(node);
          });
        });
      };

      fetch(lexUrl).then(r => r.json()).then(data => {
        if (Array.isArray(data) && data.length) apply(data);
        else apply(LEXICON_FALLBACK);
      }).catch(() => apply(LEXICON_FALLBACK));
    }

    // Inline media tokens (images/videos) everywhere
    try { applyInlineMediaWithFallback(); } catch (err) { console.error('inline media inject failed', err); }
    try { cleanupInlineMediaWrappers(); } catch (err) { console.error('media wrapper cleanup failed', err); }
  });

  window.wikiUi = {
    endpoints: {
      save: saveEndpoint,
      create: createEndpoint,
      delete: deleteEndpoint,
      tags: tagsEndpoint,
    }
  };
})();
