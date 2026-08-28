# Mor'ia 9.27–9.33 — Visual Rebirth Release Candidate

This document seals the clean release tree after the deep graphical revamp and intentionally remains as the external commit that triggers the normal CI on the final branch state.

## Scope

- **9.27 — Atmosphere & material hierarchy:** biome color grading, depth haze, light shafts, night halo, denser motes, filmic vignette, entity contact shadows, elite/boss aura and obsidian/brass UI materials.
- **9.28 — Terrain & environment:** irregular multi-tone city cobbles, cracks/moss seams and architecture grounding/cast shadows.
- **9.29 — Characters & creatures:** larger authored humanoid readability (`PIXEL_SPRITE_SCALE = 1.42`) plus dedicated dragon/wyrm, ghost/wraith, demon and lich/necromancer silhouettes.
- **9.30 — Combat VFX:** layered school-specific core/accent/spark bursts, stronger critical presentation and distinct elemental-reaction bursts driven only by authoritative event fields.
- **9.31 — City lighting:** lamps, braziers and crystals receive local presentation-only emissive halos.
- **9.32 — HUD polish:** consistent hover/focus depth, keyboard focus, refined slots/scrollbars and reduced-motion behavior.
- **9.33 — Release gate:** real Chromium day, darkness-override and Character UI captures, all versioned in `docs/screenshots/` and linked from the README.

## Authority boundary

The visual line changes presentation only. Damage, movement, collision, persistence, economy and other gameplay rules remain server-authoritative. `GameScreen.tsx` remains under the existing 155,000-byte architectural budget.

## Final browser evidence

- `docs/screenshots/moria-9-33-visual-rebirth-day.png`
- `docs/screenshots/moria-9-33-visual-rebirth-night.png`
- `docs/screenshots/moria-9-33-visual-rebirth-character-ui.png`

The 1600×1000 Chromium release capture completed with zero browser console/page errors. The dark-state screenshot intentionally uses the offline debug presentation override to verify contrast; it does not rewrite the authoritative world clock.

## Release hygiene

All one-shot applicators, capture scripts and temporary workflows were removed. The final tree retains only `.github/workflows/ci.yml`.
