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
          const parent = node.parentElement;
          parent.insertBefore(wrap, node);
          wrap.appendChild(node);
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
          btnDel.textContent = '–';
          btnDel.title = 'Remove media';
          btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            wrap.remove();
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
      const describeRange = () => {
        const sel = window.getSelection && window.getSelection();
        const r = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
        const use = r && editableRoot.contains(r.commonAncestorContainer) ? r : (lastRange && editableRoot.contains(lastRange.commonAncestorContainer) ? lastRange : null);
        if (!use) return null;
        const pathFor = (node, root) => {
          const path = [];
          let n = node;
          while (n && n !== root) {
            const p = n.parentNode;
            if (!p) return null;
            path.unshift(Array.prototype.indexOf.call(p.childNodes, n));
            n = p;
          }
          return n === root ? path : null;
        };
        const startPath = pathFor(use.startContainer, editableRoot);
        const endPath = pathFor(use.endContainer, editableRoot);
        if (!startPath || !endPath) return null;
        return { startPath, startOffset: use.startOffset, endPath, endOffset: use.endOffset };
      };
      const resolveRange = (desc) => {
        if (!desc) return null;
        const resolvePath = (path, root) => {
          let n = root;
          for (const idx of path) {
            if (!n.childNodes || idx >= n.childNodes.length) return null;
            n = n.childNodes[idx];
          }
          return n;
        };
        const sc = resolvePath(desc.startPath, editableRoot);
        const ec = resolvePath(desc.endPath, editableRoot);
        if (!sc || !ec) return null;
        try {
          const r = document.createRange();
          const clampOffset = (node, off) => {
            if (node.nodeType === 3) return Math.min(off, (node.nodeValue || '').length);
            return Math.min(off, node.childNodes.length);
          };
          r.setStart(sc, clampOffset(sc, desc.startOffset));
          r.setEnd(ec, clampOffset(ec, desc.endOffset));
          return r;
        } catch (_) { return null; }
      };

      const savedDesc = describeRange();

      setEditable(true);

      let range = resolveRange(savedDesc);
      const target = editableRoot;
      if (!range || !target.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
      }
      const box = document.createElement('div');
      box.className = 'callout';
      if (range.collapsed) {
        const p = document.createElement('p');
        p.textContent = 'TBD.';
        box.appendChild(p);
        range.insertNode(box);
      } else {
        const frag = range.extractContents();
        if (!frag.childNodes.length) {
          const p = document.createElement('p');
          p.textContent = 'TBD.';
          box.appendChild(p);
        } else {
          box.appendChild(frag);
        }
        range.insertNode(box);
      }
      const after = document.createRange();
      after.setStartAfter(box);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      lastRange = after.cloneRange();
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
          let btnDel = node.closest('.inline-media-wrap')?.querySelector('.inline-remove-media');
          if (!btnDel) {
            const wrap = node.closest('.inline-media-wrap');
            if (!wrap) return;
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
          let btnEditMedia = node.closest('.inline-media-wrap')?.querySelector('.inline-edit-media');
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
      }
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
