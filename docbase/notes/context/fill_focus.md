# Fill Task Focus

Goal: continue content filling using KB + directives, minimizing other context.

What to do
- Prioritize replacing TODO/callout stubs with KB-backed summaries, behaviors, identity details, and open questions.
- Keep structure/style per `docbase/generic_page_directive.md` and `persona-page-directives.md`.
- Use lexicon/autolink expectations: add cross-links where obvious; avoid editor-mode concerns.
- Maintain breadcrumbs/nav but do not tweak unless broken.

What we need
- KB files under `docbase/kb/**` for each topic/page being filled.
- Page-specific HTML under `pages/retraissance/densetsu/universe/**` (or team/etc.) to edit.
- Current notes: see `docbase/notes/context/fill_status.md` for recently filled areas & media info.

Current high-ROI targets
- Enemy stubs (many remain with TODO).
- Location/concept stubs (galport/kaerugan/eddara/verdathal/yukigami checkpoints, etc.).
- Any page flagged by `rg "TODO" pages/retraissance/densetsu/universe -g"*.html"` still pending.

Out of scope to hold in memory
- Editor toolbar/navigation/pseudotag debugging history.
- Media layout issues (only ensure media folders exist; already created).
- Old UI experiments or pager sizing tweaks.
