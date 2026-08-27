# MOR'IA MVP Complete 6.1 — Finalization

This pass closes the last client/server authority gaps discovered after MVP Complete 6.0.

## Finalized online systems

- Character panel reads server-owned blessing, professions, reputation, stamina and skills.
- HUD uses authoritative derived stats, server coins, structured skills and server buff expiry.
- DPS is calculated from the current server session and exposed through the Official World Hub.
- Gathering feeds authoritative quest objectives; fishing now progresses `Angler's Request`.
- Mail validates real characters and supports atomic item + gold attachments.
- Auction credits sellers immediately when they are online, with persisted credits as offline fallback.
- Bank, rest, training, food and shop actions require proximity to their authoritative NPC.
- Town reputation is earned from quests, mysteries, dungeons and world events and grants server-enforced shop discounts.
- PvP uses authoritative derived attack/defense/reduction and records damage statistics.
- Sword/fist/distance, magic, shielding and fishing skill progress are server-owned and persisted.
- Online potion use/counts no longer depend on local starter item IDs.
- Quest tracker and achievement surfaces read the authoritative catalogs/state.

## Authority rule

Quick Play keeps its local simulation. Authenticated online play uses server snapshots for gameplay progression and economy. Local storage remains only a cache/UI persistence layer and is not accepted as authoritative game state.
