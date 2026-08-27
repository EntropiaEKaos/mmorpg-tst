# MOR'IA Foundation 7.5 — Official Catalog Layer

Foundation 7.5 separates immutable official game data from stateful runtime logic.

## `OfficialCatalogs.mjs`

The new catalog module owns the declarative definitions for:

- pets;
- gems;
- NPC shop goods;
- food buffs;
- crafting recipes;
- coin-store products;
- books;
- mysteries;
- dungeon waves;
- fallback world events;
- achievements;
- equipment sets and bonuses.

`OfficialSystems` imports the catalogs for runtime use and re-exports the seven historical public `OFFICIAL_*` catalogs, preserving module compatibility for existing callers.

## Expansion benefit

New official content can now be reviewed and evolved independently from transactions, persistence and player-state logic. This also gives later migrations a clean path toward ContentDB/admin-driven versions of these catalogs without first disentangling them from the monolithic service.

CI verifies immutable arrays, unique public IDs, legacy export identity and critical internal references such as mystery answers, dungeon wave stats and fallback event targets.
