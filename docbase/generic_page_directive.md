# Generic Page Directive (Codex) - Reader-Facing Only

> Goal: Generate a **single, self-contained HTML data page** that matches the reader-facing layout (typography, spacing, hierarchy, content blocks) of the existing wiki pages, while remaining content-agnostic.

Reference layout/source: `calendar_be_ae.html` (also use `great_eclipse.html` and `world_overview.html` as exemplars for section cadence, media wrapping, and source blocks)

---

## 1) Output Contract

- Output **one** `.html` file per page.
- Include **only reader-facing UI** (no navigation, no editing controls, no authoring hooks).
- Keep the same visual rhythm as the reference: panel container → eyebrow/category → title → article.
- Use the site stylesheet so the page renders consistently:
  - `../../../assets/site.css`
- Do not include site JS unless the page truly needs it for reader features (e.g., image expand). If included, it must not add editing or nav.

---

## 2) Reader Page Skeleton (must match the look)

### 2.1 `<head>`
- `<meta charset="utf-8">`, viewport, `<title>`.
- `<link rel="stylesheet" href="../../../assets/site.css">`
- No inline CSS unless unavoidable for a specific content need.

### 2.2 Body layout wrappers
- Keep the same outer wrappers used by the reference page so margins, font sizes, and line lengths match.
- Main content must include:
  - one primary content container
  - one panel-like section

### 2.3 Panel content order
1) Optional eyebrow/category line:
   - `<p class="eyebrow">{category}</p>`
2) Page title:
   - `<h1>{Page Title}</h1>`
3) Article body:
   - `<article class="markdown"> ... </article>`

---

## 3) Article Composition Rules (content-agnostic)

### 3.1 Default section order
Use this order unless the target content requires changes:
1) **Summary**
2) **Details / Core Information** (subsections)
3) **Related** (links)
4) **Notes** (canon flags, caveats, placeholders)

### 3.2 Heading hierarchy
- Use `h2` for top-level sections, `h3` for subsections.
- Avoid `h4+` unless necessary.

### 3.3 Lists and callouts
- Use bullet lists for scannability.
- Use callouts for high-signal content (definitions, rules, constraints, key facts) with the site's existing callout styling:
  - `<div class="callout"> ... </div>`

### 3.4 Media blocks (match the reference look)
- Use the same inline media block structure as the reference pages so images behave and align consistently (centered block with `inline-media-block` + `inline-media-wrap` + `<img class="inline-image" data-pseudo="...">`).
- Provide a short caption when it improves comprehension.

### 3.5 Source/KB references
- When citing KB or source `.md` files, surface them in an expandable, non-editable block (e.g., `<details><summary>Sources</summary><pre>.</pre></details>`), preserving read-only text.
- Pull facts from `docbase/kb/` (new KB articles). Preserve the layout rhythm demonstrated in `calendar_be_ae.html`, `great_eclipse.html`, and `world_overview.html`; treat them as canonical design patterns.

### 3.6 Placeholders
- If information is missing, include placeholders as italic text in square brackets:
  - `[*Placeholder: .*]`
- Do not invent facts.

---

## 4) Linking Rules (Reader-Facing)

- Link only when you are confident the target page exists.
- No broken links.
- No `localhost` links.

### 4.1 Navigation hygiene (must do when site structure changes)
- Whenever you add/move/remove pages, refresh navigation artifacts: lexicon/autolink dictionary, regular pager, reader pager (static list), and any index/navigation pages. Treat these updates as part of the change, not follow-up work.
- Reader mode: keep `pages/retraissance/reader/pages-list.json` in sync with the intended reading order (include reader-only structural pages). Sidebar link harvesting should remain accurate.
- Never bake navbars or editor UI into pages; rely on the dynamic navbar/pager/editor scaffolding from `site.js`.
- If a referenced concept lacks a page, keep it unlinked and (optionally) note it under **Notes**.

---

## 5) Validation Checklist (Codex must self-check)

- Renders with the same typography/spacing/hierarchy as the reference.
- Contains only reader-facing structure (no nav, no edit UI).
- Uses the correct stylesheet path.
- Sections and headings follow the prescribed order.
- Media blocks use the established wrapper structure.
- All internal links resolve.

---

## 6) Minimal Example (structure only)

- Eyebrow (optional): `{category}`
- H1: `{title}`
- Article:
  - Summary
  - Details (h2/h3)
  - Related
  - Notes / placeholders

[*Placeholder: Add optional page-type presets later (Character / Location / Faction) with recommended subheadings.*]


## Breadcrumb
- Every page shows a breadcrumb nav (home → section → page) on the top line where the eyebrow sits.
- Use the automatically generated breadcrumb (preferred) or manual links if auto is unavailable.
- Breadcrumb should link each segment to its index page; final segment is the current page.
