(() => {
  const state = {
    overlayOpen: false,
  };

  // Inline lexicon fallback for universe auto-linking (forward slashes).

  const isVideo = (src = '') => /\.mp4$|\.webm$|\.ogg$|\.mp3$/i.test(src);

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
      return fallback;
    }

    const items = await probeMedia(baseMediaPath, slug, names, exts, 1);
    return items.length ? items[0].src : null;
  };

  const insertCover = (panel, src) => {
    if (!src) return;
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
    if (!portraitSrc && !audioSrc) return;
    const strip = document.createElement('div');
    strip.className = 'side-strip side-strip-right';
    if (portraitSrc) {
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
    if (audioSrc) {
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
    const assetsBase = pagePath.substring(0, markerIdx + scope.marker.length) + 'assets/';
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
  document.addEventListener('DOMContentLoaded', () => {
    initMediaLayout();

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
        else apply(UNIVERSE_LEXICON_DATA);
      }).catch(() => apply(UNIVERSE_LEXICON_DATA));
    }
  });

  window.wikiUi = {};
})();

