# Persona Page Generation (Characters & Team)

Authoritative notes on how to create/maintain persona pages in the Retraissance wiki (characters, enemies/creatures that use the same template, and team members).

## File + Folder Layout
- Characters/Enemies/Creatures: `pages/retraissance/densetsu/universe/characters/<slug>.html` (or `enemies/`, `creatures/` when relevant).
- Team: `pages/retraissance/team/<slug>.html`.
- Media folder (auto-loaded, no JSON needed):  
  - Characters/Enemies/Creatures: `pages/retraissance/densetsu/assets/media/universe/characters/<slug>/`  
  - Team: `pages/retraissance/assets/media/team/<slug>/`
- Required media naming (auto-detected):  
  - `turnaround.*` — used in the center “turnaround” slot (scale to max 1/3 viewport height).  
  - `portrait.*` — right-side fixed portrait (click to open full image).  
  - `image00.*` … `image09.*` — left vertical scrolling strip; hover pauses, click opens file.  
  - Optional audio: `theme.ogg` or `theme.mp3` — shows small player under portrait; hide if missing.

## Page Content Structure (HTML)
- Follow existing HTML/CSS template (no Markdown). Use site classes: page wrapped in `.panel`, headings in `<h1>/<h2>`, body in `<p>`, lists in `<ul>/<li>`.
- Pseudotags supported in text:
  - `<image>path-or-name</image>` → inline image block (click-to-enlarge; recognizes alignment buttons).  
  - `<video[-loop][-nocontrols]>path-or-name</video>` → inline video, autoplay, optional loop/controls flags.  
  - `<box>…</box>` → callout block.  
  - `<line></line>` → horizontal rule.
- Avoid saving editor overlay artifacts; final HTML should contain only content + site scaffolding.

## Data Blocks to Include (Characters/Enemies/Creatures)
- Top identity/callout block with:
  - Identity: Name, Origin, Species, Role, Faction, Elements/Bloodline, Height/Weight (TBD if unknown), Role type (Main/Side/Antagonist), Learned/Signature abilities.
  - Gameplay Data (baseline): Level/XP, HP/MP, core stats (STR/DEF/AGI/INT/LUCK), combat skills (Unarmed/Armed/Ranged/Finesse/Stealth), elemental atk/def grid (Fire/Water/Earth/Wind/Light/Dark/Thunder/Gaea/Time-Space), absorption notes.
- Narrative sections:
  - Overview / Background
  - Relationships / Factions
  - Locations of activity
  - Notable NPCs / Secondary NPCs (for locations) — list fields where relevant.
  - TODO stubs allowed but keep concise.
- Tags: include base tag (initial letter) + category tags (character, enemy, creature, team, faction, location, etc.) to keep search/filter working.

## Data Blocks to Include (Team)
- Identity block: Name/Handle, Role, Focus/Discipline, Links/Contacts.
- Contributions / How they help(ed).
- Media: same autoload rules as above.
- Tags: include `team`, plus specialty tags (art, code, writing, audio, etc.) and base initial tag.

## Index & Linking
- After creating a page, ensure the corresponding index lists it:
  - Characters: `pages/retraissance/densetsu/universe/characters/index.html`
  - Team: `pages/retraissance/team/index.html`
  - Tools/Other categories: use matching index.
- Links should point to the real file path (e.g., `/pages/retraissance/densetsu/universe/characters/<slug>.html`). Avoid broken navbar links.
- Autolink/lexicon: keep content clean (avoid “Pending canonical content” etc. for auto-linking).

## Media Conventions Recap
- One media folder per page; names match page slug.
- Use `turnaround.*`, `portrait.*`, `image00-09.*`, optional `theme.ogg/mp3`.
- No gallery JSON; files are discovered on load. If no images in a slot, that UI region stays hidden.

## Quality/Workflow Reminders
- Use ASCII. Keep TODOs short. Preserve site CSS/HTML structure—no Markdown.
- Editor mode controls must not be saved into the page.
- When renaming, keep `turnaround` naming (replace old `img01`/`image01` with `turnaround`).
- Validate alignment: left strip scrolls; portrait/audio fixed; center sheet 40% width; turnaround max 1/3 viewport height.
