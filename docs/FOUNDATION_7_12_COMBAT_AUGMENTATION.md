# MOR'IA Foundation 7.12 — Combat Augmentation Domain

Foundation 7.12 extracts combat augmentations into `OfficialCombatAugmentationDomain`.

The domain owns training modifiers, timed official buffs, blessing mitigation, socketed-gem effects, set-bonus aggregation, active combat pets, pet damage, authoritative bestiary counters and level-gated gem drops.

`OfficialSystems` remains the orchestration façade. Monster kills still flow through bestiary/gem processing, world events, dungeons and achievements in the same order, but the underlying augmentation rules no longer live in the core runtime class.

The boundary is designed for large-scale expansion into hundreds of equipment sets, pet families, gem tiers, affixes, relics, collection bonuses, bestiary milestones and seasonal drop tables without regrowing the monolith.
