# MOR'IA Foundation 7.11 — Exploration & Knowledge Domain

Foundation 7.11 extracts gathering professions, lore books and mystery progression into `OfficialExplorationKnowledgeDomain`.

The domain owns authoritative resource-tile discovery, four-direction adjacency, gathering cooldowns, profession XP/level caps, deterministic bonus-yield rules, catalog-backed book history, secret mystery answers, normalized mystery progress and exactly-once final rewards.

`OfficialSystems` remains the compatibility façade and the public snapshot still exposes the same `books`, `mysteries` and profession state shapes. Mystery answers never enter the public catalog.

This boundary prepares MOR'IA for resource tiers, gathering tools, rare nodes, regional professions, archaeology, codex collections, lore achievements, multi-stage riddles, treasure maps and exploration seasons without regrowing the core runtime monolith.
