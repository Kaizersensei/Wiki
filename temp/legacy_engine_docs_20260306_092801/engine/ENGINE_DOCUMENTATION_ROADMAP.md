# Densetsu Engine Documentation Roadmap

Status: Active working roadmap (manual checklist)
Owner: Densetsu engine documentation pass
Scope: Public Densetsu engine documentation in the wiki (`pages/docs/projects/densetsu/engine/*`) plus site navigation integration (`pages/retraissance/densetsu/engine/*`)

This roadmap is the execution checklist for documenting the current Densetsu engine work without losing sequence or context.

Use this file as the source of truth for:
- what gets documented first,
- which structure changes must happen before page writing,
- where each new page belongs,
- and what remains blocked/open.

## Working Rules (for this roadmap)

- The engine documentation is public. There is no front-facing/back-facing split for engine docs.
- Technical engine content is authored in `pages/docs/projects/densetsu/engine/...`
- `pages/retraissance/densetsu/engine/...` is site navigation integration (indexes/category wrappers), not a separate documentation layer
- The game itself is not public; do not publish non-public game-specific production details in engine docs unless intentionally sanitized
- Prefer small, composable pages over giant omnibus pages
- Document what exists first, then plans/refactors, then future ideas
- Capture known failures and lessons learned (especially shader/postfx/plugin issues)
- Mark pages as:
  - `[ ]` not started
  - `[~]` in progress (replace manually while editing)
  - `[x]` done (first usable version)

## Current Structure Snapshot (checked)

### Existing engine categories (content source)
- `runtime`
- `actors`
- `fsm`
- `stats_combat`
- `input_movement`
- `data_authoring`
- `editor`
- `tools`
- `integrations`

### Missing categories already linked by `engine/index.html` (dead links today)
- `networking`
- `rendering`
- `build-deploy`
- `testing-qa`
- `telemetry`
- `modding`

## Sequence Overview (do in this order)

1. Structure hygiene
2. Foundational system overviews (loading/boot, rendering, sky/weather, toolchain)
3. Workflow and troubleshooting pages
4. Category expansion stubs (future-proofing)
5. Site navigation sync and link QA

Do not start deep page volume work before phase 1 is complete.

---

## Phase 1: Structure Hygiene (must happen first)

Goal: eliminate dead engine-category links and prepare landing zones for new docs.

### 1.1 Engine category folders + metadata
- [x] Create `rendering/` category (`_category_.json`, `index.html`)
- [x] Create `networking/` category (`_category_.json`, `index.html`) stub
- [x] Create `build-deploy/` category (`_category_.json`, `index.html`) stub
- [x] Create `testing-qa/` category (`_category_.json`, `index.html`) stub
- [x] Create `telemetry/` category (`_category_.json`, `index.html`) stub
- [x] Create `modding/` category (`_category_.json`, `index.html`) stub

### 1.2 Engine index alignment
- [x] Verify `pages/docs/projects/densetsu/engine/index.html` links resolve after category creation
- [ ] Add note in engine index distinguishing “implemented systems” vs “planned documentation domains” (optional but recommended)

### 1.3 Site navigation alignment (`retraissance`)
- [x] Add matching `rendering` wrapper under `pages/retraissance/densetsu/engine/`
- [ ] Decide whether to mirror all six new categories now or only when content exists
- [x] Update `pages/retraissance/densetsu/engine/index.html` category list accordingly

Blocking note:
- `rendering` should exist before documenting Sobel/postfx/sky/weather pages

---

## Phase 2: Foundational System Overviews (highest priority docs)

Goal: document the systems currently under active development and debugging.

### 2.1 Runtime startup / loading pipeline (runtime)
Dependencies: none (after Phase 1)

- [x] `runtime/bootloader_loading_splash_pipeline.html`
  - Boot sequence (bootloader -> startup splashes -> loading screen -> target scene)
  - Target scene resolution (`target_scene_path`, CLI override)
  - Responsibilities vs limitations (cannot hide engine/import stalls before boot scene loads)
  - Common freeze points before threaded load starts
- [x] `runtime/loading_screen_host_and_content_slots.html`
  - `DensetsuLoadingScreen`
  - `ContentRoot` usage patterns (video/music/interactive/minigame/model viewer)
  - Top-level parameter exposure model
- [x] `runtime/startup_splashes_parameter_driven.html`
  - `DensetsuSplashScreen`
  - Preset scenes (company/info)
  - Skip behavior / sequencing / best practices

### 2.2 Rendering & post-process strategy (rendering)
Dependencies: `rendering` category exists

- [x] `rendering/rendering_system_overview.html`
  - What is project-native vs third-party
  - Design principle: compatibility-first, replace risky shaders
- [x] `rendering/postfx_sobel_outline_pipeline.html`
  - Runtime-only behavior
  - Parameter meanings and tuning workflow
  - Known failure modes encountered (magenta, no effect, debug-only color, inverted output, strength saturation)
- [ ] `rendering/shader_compatibility_and_replacement_plan.html`
  - Lessons learned from incompatible outline/postfx attempts
  - “Sobel-first” compatibility strategy
  - Replacement prioritization framework
- [ ] `rendering/toon_global_controller_strategy.html`
  - Global overrides vs material-local parameters
  - Safety and preview constraints

### 2.3 Sky / weather / celestial system (rendering or runtime; choose rendering-first)
Dependencies: rendering category preferred

- [x] `rendering/sky_weather_system_overview.html`
  - Sky layers (sky gradient, sun, clouds, fog overlay, weather)
  - Clock/calendar coupling (scaffolding-first approach)
- [ ] `rendering/sky_weather_clock_calendar_and_timeline.html`
  - 24-step gradient concept
  - Weather sequencing/timeline/blending in hours
  - Conditions vs groups precedence
  - Duration/blend management
- [ ] `rendering/sky_weather_celestial_cycle_sun_moon_stars.html`
  - Sun/moon behavior decisions (stylized over realism)
  - Moon phase rendering approach and caveats
  - Shadow and light transition concerns
- [ ] `rendering/sky_weather_debug_ui.html`
  - Debug controls (clock/calendar/season/weather stack/timeline/time scale)
  - Which parts are intended to graduate into production UI
- [ ] `rendering/sky_weather_known_issues_and_tuning_notes.html`
  - Fog interactions
  - White sky edge cases
  - moon material/texture quirks
  - cloud seam/UV issues and current state

### 2.4 Geometry/OBJ toolchain (tools + data_authoring)
Dependencies: none (after Phase 1)

- [ ] `tools/densetsu_tool_suite_overview.html`
  - Tool suite scope and philosophy
  - Where features live (helpers/plugins)
- [ ] `data_authoring/mesh_obj_conversion_pipeline.html`
  - Why OBJ is preferred over TRES/RES for external editing
  - Conversion commands and expected outputs
  - Material extraction expectations
- [ ] `data_authoring/scene_geometry_obj_exporter_supported_nodes_and_limits.html`
  - Supported geometry sources (static meshes, imported scenes, ArrayMesh, MultiMesh status, CSG combined output)
  - Ignored geometry (collision shapes in current pass)
  - Material group/MTL behavior
- [ ] `data_authoring/mesh_reference_rebinding_workflow_same_folder_matching.html`
  - Safety rules for replacement
  - Same-folder policy and conflict avoidance
  - Project-wide pass strategy
- [ ] `data_authoring/mesh_conversion_known_issues_normals_materials_uvs.html`
  - Inverted normals cases
  - Material split surprises
  - Conversion failures (`PackedVector2Array` nil etc.)

---

## Phase 3: Workflow, Performance, and Troubleshooting (very important)

Goal: preserve operational knowledge from recent debugging so it is reusable.

### 3.1 Performance investigation workflows
- [ ] `tools/godot_profiler_and_debugger_workflow_for_densetsu.html`
  - What to look at (frame, process, physics, GPU/CPU)
  - How to interpret “physics frame time” issues
  - Practical triage loop used in project
- [ ] `actors/npc_performance_budgeting_visibility_and_update_strategy.html`
  - Observed bottleneck patterns (many visible NPCs)
  - Off-camera logic-only idea
  - Budget manager approach / hive-mind control concepts
  - Animation/rig suspicion and validation strategy

### 3.2 Editor stability / layout / startup issues
- [ ] `tools/godot_editor_layout_and_dock_recovery_notes.html`
  - Dock clipping, taskbar/font-size issue, layout resets
  - Session save behavior and config pitfalls
- [ ] `tools/godot_editor_crash_triage_notes.html`
  - Silent crash patterns
  - Rendering/shader/plugin suspicion flow
  - Driver observations (studio vs game ready)
- [ ] `integrations/terrain3d_persistence_paint_cache_and_save_timing_notes.html`
  - “paint visible in editor but not in game” symptom
  - cache reload/save timing behavior
  - persistence caveats and operator workflow

### 3.3 Terrain3D integration and standards
- [ ] `integrations/terrain3d_sanity_check_and_project_standards.html`
  - Filtering/normal map sanity checks
  - plugin adaptation standards
  - what is fixed in project-side config vs plugin code
- [ ] `integrations/terrain3d_known_limitations_and_workarounds.html`
  - texture memory/cache issues
  - save/reload caveats
  - renderer stability notes

---

## Phase 4: Actor / Input / Control System Updates (current gameplay work)

Goal: document the current architecture and recent behavior changes before they drift.

### 4.1 Actor architecture
- [ ] `actors/actor_hierarchy_and_class_roles.html`
  - `ActorCharacter3D`, `ActorPlayer3D`, `ActorNPC3D`, scenery
  - camera logic placement (player subclass only)
- [ ] `actors/actor_scene_structure_authoring_rules.html`
  - preferred node structures
  - preview/rebuild safety principles
  - mesh/skeleton separation policy
- [ ] `actors/npc_templates_and_rigged_animal_pipeline.html`
  - template NPC creation principles
  - rig/animation library expectations

### 4.2 Input and locomotion updates
- [ ] `input_movement/analog_walk_run_sprint_shift_modifier_controls.html`
  - walk/run based on movement speed parameters (no button-run)
  - sprint hold behavior
  - shift+direction quick turn commands and precedence
- [ ] `input_movement/movement_animation_speed_matching.html`
  - walk/run speed thresholds from movement params
  - animation speed ranges to visually match locomotion
- [ ] `input_movement/quick_turn_interpolation_and_easing.html`
  - interpolation time params for 90/180 turns
  - no-snap turning behavior

---

## Phase 5: Rendering/Shader Suite Program (planned replacement initiative)

Goal: document the development plan and standards for replacing incompatible third-party shaders.

Dependencies:
- Phase 2 rendering pages complete first

- [ ] `rendering/shader_suite_program_overview.html`
  - Why replacement is needed
  - Compatibility targets (Sobel-first)
  - Risk policy for third-party shaders
- [ ] `rendering/shader_suite_development_workflow.html`
  - prototype -> sandbox -> integration -> compatibility test -> rollout
- [ ] `rendering/shader_suite_compatibility_matrix.html`
  - project shaders list / status / issues / replacement plan
- [ ] `rendering/shader_experiment_log_lessons_learned.html`
  - preserve “good and bad” outcomes from outline experiments

---

## Phase 6: Tooling Expansion (Autocliff and future procgen-assisted authoring)

Goal: document new editor tooling as it stabilizes.

- [ ] `tools/autocliff_terrain3d_overview.html`
  - Terrain3D-only scope
  - intended workflow and placement logic
- [ ] `tools/autocliff_dock_usage_and_troubleshooting.html`
  - where to open it
  - why placements may fail (“unable to find placements”)
  - input requirements and debug expectations
- [ ] `tools/procgen_assisted_map_authoring_principles.html`
  - Multimesh vs node instances
  - manual override philosophy

---

## Cross-Cutting Pages (create when enough material is collected)

- [ ] `runtime/known_issues_startup_hangs_editor_stalls.html`
- [ ] `tools/diagnostic_playbooks_common_failures.html`
- [ ] `integrations/third_party_plugin_acceptance_checklist.html`
- [ ] `testing-qa/rendering_and_tools_regression_checklist.html`

---

## Documentation QA Checklist (run after each page batch)

- [ ] Links resolve from engine content pages to category index
- [ ] `retraissance` engine navigation wrappers resolve to intended engine content pages
- [ ] No dead links in `engine/index.html`
- [ ] Page includes “Known issues / failure modes” where applicable
- [ ] Page includes “Sources / decisions” section (chat decisions noted where relevant)
- [ ] Page avoids mixing future plan and current implementation without labels
- [ ] Terminology matches engine code and current project naming

---

## First Batch (recommended immediate execution)

Do these first before broader doc writing:

- [x] Create canonical `rendering` category (Phase 1)
- [x] Create remaining missing linked categories as stubs (Phase 1)
- [x] `runtime/bootloader_loading_splash_pipeline.html`
- [x] `runtime/loading_screen_host_and_content_slots.html`
- [x] `runtime/startup_splashes_parameter_driven.html`
- [x] `rendering/rendering_system_overview.html`
- [x] `rendering/postfx_sobel_outline_pipeline.html`
- [x] `rendering/sky_weather_system_overview.html`
- [ ] `data_authoring/mesh_obj_conversion_pipeline.html`

These pages unblock most future references and preserve the freshest knowledge.

---

## Open Decisions / Notes (update as we go)

- [ ] Decide whether sky/weather docs live entirely under `rendering` or split between `rendering` + `runtime`
- [ ] Decide whether `terrain3d` docs primarily belong under `integrations` or `rendering`
- [ ] Decide when to add `retraissance` wrappers for not-yet-populated categories (now vs on first page)
- [ ] Decide if this roadmap should remain a working file only or also have a sanitized public tracker page
