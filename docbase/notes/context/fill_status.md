# Fill Status (compact context)

## Recently filled
- Creatures: forest fauna, desert fauna, aquatic fauna, mycomind fauna, mossbound goats, lantern moths, mist hounds; mount-class creatures; corrupted creatures; abominations moved into Creatures category.
- Enemies: cinder wretches, ashen kite, echo of the first betrayer, false heaven, folded general, forgotten shell, gilded ghost; mawing echo, rotling mass, stonelash hydra, lady of thorns, threadworms, mirrorspawn, yama-binder, ninja grunts.
- Enemies (latest): bandit, plague pilgrim, karma engine, womb whale, Michio the Echowalker; partial notes added for Okashira, Silkmother, Lingering Oath, Raijin's Last Apprentice, Verdance.
- Artifacts: Torredasso moved to artifacts (media folder moved to `assets/media/universe/artifacts/torredasso`), now has ally hook after repair side-quest.
- Locations updated: Eddara, Eresh Emirate, Kaerugan, Seigetsu Empire, Verdathal, Crimson Dynasty, Yukigami, Varthum (overview/narrative/relationships from KB + chat canon).
- Locations updated (latest): Hirogawa (fire event, anomaly witness, tutorial-to-tragedy role; sourced from KB and chat canon).
- New location page: Mirror Spire (Eresh anomaly/power array) with media scaffold and index entry; sitemap updated to point from Eresh/Kaerugan.
- World/overview: timeline index populated; timeline arcs populated from KB; relationships matrix cleaned; Hirogawa fire event filled earlier.

## Media scaffolding
- Created media folders for all universe pages (169 dirs). Torredasso media relocated from enemies to artifacts path.

## Outstanding TODO hotspots
- Remaining enemies with sparse data: Silkmother, Lingering Oath, Raijin’s Last Apprentice, Verdance (await canonical summaries); double-check for stray TODOs via `rg "(TODO)" pages/retraissance/densetsu/universe/enemies`.
- Many locations/concepts still stubbed (e.g., galport/kaerugan/eddara/verdathal/yukigami checkpoints, timeline_index already filled).
- Concepts: added World Memory vs Timeline Log page (subjective world memory vs Infinitree’s objective timeline log); lexicon + concepts index updated; media scaffold created.
- Concepts filled: Chronobonsai (Checkpoint) now has overview, narrative role, known facts, mechanics, relationships, sources.
- Navigation: Added site map (`pages/retraissance/sitemap.html`) linked from top index; directive to keep site map/link-tree updated whenever structure changes.
- Reader view: bookify app in `docbase/bookify-web` now uses local HTML parsing (no Gemini); default URL points to Densetsu landing; served at `/bookify/` via dev-save-server; top-nav + sitemap link updated.
- Note: home panel background reverted; awaiting correct panel (video player) target for `cellbg.png`.

## Breadcrumbs/navigation
- Breadcrumbs added via `site.js` buildBreadcrumb; top Retraissance index is excluded. Navigation sanitized on top index.
