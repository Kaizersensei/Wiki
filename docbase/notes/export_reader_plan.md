# Export Plan: Self-Contained Reader (itch-ready)

This plan captures the final-mile steps to produce a self-contained HTML5 reader build, per directives. It omits editing/save features and relies on prebuilt navigation data. Keep this as the single source during implementation; sanitize context by referring back here instead of prior chat history.

## Goals
- Deliver a reader-only build that works on a static host (e.g., itch) with no editor or backend.
- Preserve reading, pager, sidebar navigation, and inline media/turnaround display.
- Remove dependencies on save/create/delete/tag update endpoints and avoid CORS pitfalls.

## High-Level Steps
1) **Reader-only code path**
   - Derive a trimmed JS bundle from `pages/retraissance/assets/site.js` that keeps: rendering, nav/pager, inline media, lightbox.
   - Remove/disable: edit mode, save endpoints, tag update calls, create/delete endpoints, dev-save-server hooks.
   - Ensure all labels are ASCII (no control chars).

2) **Static navigation data**
   - Generate a frozen `pages-list.json` with the desired traversal order (major topics → subtopics → data pages).
   - Use this list for both the pager and the reader sidebar; disable dynamic index scraping in reader mode.

3) **Package pages & media**
   - Copy required HTML pages and their media folders into a `dist-reader/` tree, preserving relative paths.
   - Resolve inline/pseudotag media to relative URLs that work under the same origin.
   - Optionally omit heavy side-strip assets/audio if size is a concern; keep inline/turnaround images.

4) **Navbar/pager for reader build**
   - Keep condensed navbar (Retraissance + Densetsu dropdowns + Random) but ensure all links resolve inside `dist-reader/`.
   - Pager uses `pages-list.json` only (no dynamic fetch of indexes); falls back gracefully if out of bounds.

5) **Validation**
   - Serve `dist-reader/` locally (e.g., `python -m http.server`) and verify:
     - All pages load; no 404/CORS in console.
     - Pager traverses full list; sidebar highlights current page.
     - Inline media/turnaround display correctly from relative paths.
   - Fix any broken paths before packaging.

6) **Packaging**
   - Zip `dist-reader/` for itch upload.
   - Preserve the generation script(s) to rebuild when site structure changes.

## Context Sanitization
- Use this plan as the reference; avoid reloading long chat history.
- When implementing, keep changes minimal and localized (prefer new reader-only JS/CSS alongside existing files to avoid regressions).
