# Discussed Ideas Missing From the Current Wiki Structure

This is a **delta list** of ideas/systems that have come up in design discussions and project docs/chats but **do not currently appear as explicit pages or categories** in the provided wiki structure. Each item includes a suggested placement.

---

## A. Mechanics & Game Systems (no dedicated wiki category yet)

### 1) Ki Resource System
**What we have:** Ki is referenced broadly as a core player resource (separate from HP/MP framing in places) and appears across gameplay/system text.
- Suggested pages:
  - `mechanics/ki_system.html` (or `concepts/ki.html`)
  - Cross-link: combat, checkpoints (orb statue refresh), skills.

### 2) Player Movement & Traversal Kit (incl. advanced controllers)
**What we have:** explicit need for advanced 2D movement controllers (optionally Sonic-like physics for special characters), plus core moves like jump/double jump/wall jump/roll/dash.
- Suggested pages:
  - `mechanics/movement_controller.html`
  - `mechanics/sonic_physics_variant.html`
  - `engine/player_input_movement.html` (Codex-facing implementation notes)

### 3) Quests & Dialogue System
**What we have:** quests and dialogue are heavily referenced; Hirogawa hub quest gating is a key narrative/engagement plan.
- Suggested pages:
  - `mechanics/quests.html`
  - `mechanics/dialogue_system.html`
  - `events/questlines_hirogawa_hub.html`

### 4) Taming / Riding / Mount-Class Creatures
**What we have:** creatures can be tamed/ridden; mount-class explicitly exists as a creature grouping.
- Suggested pages:
  - `mechanics/taming.html`
  - `mechanics/riding_and_mounts.html`
  - `creatures/mount_class_creatures.html` (already in catalog, but the **system** page is missing)

### 5) Checkpoint Ecosystem (as a unified system page)
**What we have:** multiple checkpoint types exist (chronobonsai, gong arch, orb statue) but the **system overview** is not a top-level page.
- Suggested pages:
  - `mechanics/checkpoints_overview.html`
  - Includes: silent loading/menu rooms, segmented combat/puzzle saves, heal refresh, progression rules.

### 6) Dog Checkpoint
**What we have:** “Dog checkpoint” is named as part of the checkpoint family but has **no page** in the Concepts list.
- Suggested page:
  - `concepts/dog_checkpoint.html`

### 7) Economy & Non-Gold Currencies
**What we have:** Marella Caravans operate on favors/rare currencies instead of gold.
- Suggested pages:
  - `mechanics/economy_and_currencies.html`
  - `factions/marella_caravans.html` (already exists, but system-level economy rules are missing)

---

## B. Worldbuilding & Lore Constructs (missing explicit pages)

### 1) Chronogardening (stabilization doctrine as a practice)
**What we have:** time is healed/stabilized through care, not control; chronogardening is repeatedly referenced as the “right way” to interact with time damage.
- Suggested pages:
  - `concepts/chronogardening.html`
  - Cross-link: anomalies, loops, Infinitree, Bonsai Sage.

### 2) Chronobonsai vs Bonsai Sage Tree (explicit distinction)
**What we have:** Chronobonsai is a separate entity from the Sage’s tree but related; this distinction affects lore and checkpoint logic.
- Suggested pages:
  - `concepts/chronobonsai_vs_sage_tree.html` (or a section inside both chronobonsai + bonsai_sage pages)

### 3) Wooden Robot (late-game character/mechanic by Bonsai Sage)
**What we have:** a wooden bio-mechanical robot skeleton encased in living wood/moss/mushrooms/ivy; photosynthesis-powered; requires care to develop.
- Suggested pages:
  - `characters/wooden_robot.html` (or `concepts/bio_mechanical_constructs.html`)

### 4) Creature vs Enemy Framework (Intent/Sentience distinction)
**What we have:** creatures are Actors but belong to a distinct Creature group; corrupted creatures temporarily behave like enemies but remain in creature system.
- Suggested pages:
  - `engine/actor_groups_creature_vs_enemy.html` (Codex-facing)
  - `concepts/creature_ecology_vs_enemy_conflict.html` (player-facing)

### 5) Lore Songs System & Mapping
**What we have:** a large set of lore songs are stored as canonical reference + an index/framework for mapping and contradiction analysis.
- Suggested pages:
  - `universe/lore_songs_index.html`
  - `universe/lore_consistency_rules.html`

---

## C. Engine / Tooling Topics (missing explicit engine docs pages)

> Your wiki structure currently lists multiple `engine/index.html` placeholders without enumerating the actual engine subpages.

### 1) Database-Driven Content Authoring
**What we have:** database categories/branches/data are emphasized; engine must support references, variables, and stats work.
- Suggested pages:
  - `engine/database_schema_overview.html`
  - `engine/data_categories_and_branches.html`

### 2) Terrain & Collision Model (polygon-based; optional 3D collisions in 2D)
**What we have:** terrain is collider/polygon based, no tilemaps; large terrain via images, detail via 9-patch; optional use of 3D object collisions in 2D view.
- Suggested pages:
  - `engine/terrain_collision_model.html`
  - `engine/2d_view_with_3d_collision.html`

### 3) Actor System – Four States Rule (formal page)
**What we have:** Actor system guidelines exist and are foundational.
- Suggested pages:
  - `engine/actor_system_guidelines.html`
  - `engine/actor_lifecycle_four_states.html`

### 4) FSM State Architecture (frame events, tags, context flags)
**What we have:** base State.gd defines group priorities, context flags, tags, frame events, helpers; OpenBOR-inspired.
- Suggested pages:
  - `engine/fsm_state_spec.html`
  - `engine/frame_events_and_state_tags.html`

### 5) Construct 2 → Godot Conversion Tooling
**What we have:** a major tooling initiative to convert Construct 2 projects into Godot projects, including plugin emulation and event manager rewrite.
- Suggested pages:
  - `tools/construct2_to_godot_converter.html`
  - `tools/plugin_porting_guidelines.html`

---

## D. Mode & Structure (missing explicit pages)

### 1) Arcade Mode
**What we have:** dedicated Arcade Mode document exists but no explicit wiki category/page list for it.
- Suggested pages:
  - `modes/arcade_mode_overview.html`
  - `modes/arcade_progression_rules.html`

---

## Recommended Structural Additions

If you want the structure to reflect the project more faithfully, add these top-level sections:
- `mechanics/` (player-facing systems: Ki, movement, quests, taming, economy, checkpoints)
- `modes/` (Arcade mode, future challenge modes)
- Expand `engine/` into enumerated pages (actor, FSM, database, terrain/collision)
- `universe/` add lore-songs and consistency rules as first-class pages

---

## Next Step
If you want, I can produce a **"missing-ideas patch" ZIP** that adds these pages as:
- minimal stubs with confirmed bullets + TODO markers
- and updates the relevant indexes to link them

(Only do this when you request files again.)

