(() => {
  // Opt-in editor bootstrapper. Load this script only when you intend to edit.
  const bootstrap = () => {
    try {
      window.ENABLE_EDITOR_FLAG = true;
      if (window.wikiEditor && typeof window.wikiEditor.init === 'function') {
        window.wikiEditor.init();
      }
    } catch (err) {
      console.error('editor-tools bootstrap failed', err);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrap();
  } else {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  }
})();
