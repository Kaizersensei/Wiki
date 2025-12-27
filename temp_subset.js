(function(){
    // Plain-text paste handler to normalize formatting to site styles.
    const sanitizeNode = (node) => {
      const allowed = new Set(['P','BR','STRONG','B','EM','I','U','UL','OL','LI','H2','H3','H4','BLOCKQUOTE','PRE','CODE','A','HR','LINE','DIV','IMG','VIDEO']);
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
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
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
      if (tag === 'IMG' || tag === 'VIDEO') {
        const el = document.createElement(tag.toLowerCase());
        const src = node.getAttribute('src') || '';
        if (src) el.setAttribute('src', src);
        if (node.className) el.className = node.className;
        if (node.dataset.sizePercent) el.dataset.sizePercent = node.dataset.sizePercent;
        if (node.dataset.pseudo) el.dataset.pseudo = node.dataset.pseudo;
        if (node.dataset.missing) el.dataset.missing = node.dataset.missing;
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
      // Normalize path to be relative to repo root (start at pages/retraissance/...).
      const pagePath = (location.pathname || '').replace(/\\/g, '/');
      const relMatch = pagePath.match(/(pages\/retraissance\/.*)$/);
      const normPath = relMatch ? relMatch[1] : pagePath.replace(/^\/+/, '');
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
})();
