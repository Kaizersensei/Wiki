    };
    btnAddImage.addEventListener('click', addImageAtCursor);

    btnEdit.addEventListener('click', () => {
      setEditable(true);
      try { ensureMediaControls(); wrapInlineMedia(); } catch (_) { /* best effort */ }
    });
    btnSave.addEventListener('click', async () => {
      // In reader mode, push edits to the underlying page instead of the shell.
      if (isReaderPage() && window.readerSaveCurrent) {
        btnSave.disabled = true;
        const ok = await window.readerSaveCurrent();
        btnSave.disabled = false;
        if (ok) {
          btnEdit.disabled = false;
          document.body.classList.remove('edit-active');
          return;
        }
        return;
      }
      doSave();
    });
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
    const readerView = isReaderPage();
    try { checkVersionManifest(); } catch (err) { console.error('version manifest check failed', err); }
    try { checkCacheSignature(); } catch (err) { console.error('cache signature check failed', err); }
    try { buildBreadcrumb(); } catch (err) { console.error('buildBreadcrumb failed', err); }
