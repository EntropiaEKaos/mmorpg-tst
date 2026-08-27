# MOR'IA Foundation 7.10 — Inventory & Economy Domain

Foundation 7.10 extracts player-side economic services into `OfficialInventoryEconomyDomain`.

The domain owns pets, depot capacity/transfers, bank transfers, vendor food buffs, reputation-priced shop purchases, crafting, gem sockets and coin-store sinks. It keeps authoritative validation and atomic failure semantics while `OfficialSystems` remains a compatibility façade.

This boundary provides a scalable base for additional vendors, currencies, crafting professions, recipes, account storage, guild banks, repair systems, salvage, bind rules and richer item sinks without coupling those features to PvP, dungeons or world events.
