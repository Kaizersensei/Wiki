# Content Editor Instructions (Persona Pages & Reader Pages)

- **Layout**: Use the standard panel structure: optional eyebrow `<p class="eyebrow">`, `<h1>` title, `<article class="markdown">` body. Section order: Summary → Details/Core Info → Related → Notes.
- **Persona-specific blocks**:
  - Characters/Enemies/Creatures: identity (name, origin, species, role, faction, elements, physicals, role type), gameplay baseline (Level/XP, HP/MP, stats STR/DEF/AGI/INT/LUCK, combat skills, elemental atk/def grid, absorptions), narrative (overview, relationships/factions, locations), Notable/Secondary NPC lists where applicable. Use concise TODOs for missing data.
  - Team: identity (name/handle, role, focus/discipline, links/contacts), contributions/how they help(ed). Tags: `team` + specialty and base initial.
- **Tags**: Always include the base initial tag and category tags (character, enemy, creature, team, faction, location, etc.) to keep search/filter working.
- **Media** (auto-loaded, no JSON):
  - Paths: characters/enemies/creatures → `pages/retraissance/densetsu/assets/media/universe/characters/<slug>/` (or enemies/creatures folders as applicable); team → `pages/retraissance/assets/media/team/<slug>/`.
  - Filenames: `turnaround.*`, `portrait.*`, `image00-09.*`; optional `theme.ogg/mp3`. If missing, that UI slot hides.
  - Inline pseudotags: `<image>path</image>`, `<video[-loop][-nocontrols]>path</video>`, `<box>…</box>` (callout), `<line></line>` (HR).
  - Suggest visuals: when drafting, mark useful illustration/graph spots with pseudotags (e.g., `<image>TODO-chronology-graph</image>` or `<box>Insert timeline infographic here</box>`) so assets can be filled in later.
- **Linking**: Link only to known existing pages (`/pages/retraissance/.../<slug>.html`). If unsure, leave unlinked and note under Notes. No localhost/broken links.
- **Placeholders**: Use italic bracket form `[*Placeholder: …]`; do not invent facts.
- **CSS/JS**: Use the existing stylesheet (`../../../assets/site.css`). Do not add nav/edit UI or persist editor controls. Use HTML (not Markdown) matching site typography/spacing.
- **Indexes**: After creating/renaming, ensure the relevant index page lists the new entry (characters, enemies, creatures, team, tools, etc.) with correct paths.
