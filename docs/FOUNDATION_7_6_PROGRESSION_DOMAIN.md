# MOR'IA Foundation 7.6 — Progression Domain

Foundation 7.6 extracts player progression rules from `OfficialSystems` into `OfficialProgressionDomain`.

The domain now owns stamina/XP modifiers, death-loss blessing modifier, reputation and shop discounts, weapon mastery, achievements, rest, training and daily reward streaks. `OfficialSystems` retains thin wrappers so the WebSocket protocol, action registry and save format remain backward-compatible.

This boundary makes future expansion safer: seasons, prestige, account-wide achievements, reputation factions, mastery trees, rested XP and progression events can evolve without coupling directly to mail, auction, dungeon or persistence code.
