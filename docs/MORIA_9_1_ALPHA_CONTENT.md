# Mor'ia 9.1 — Alpha Content Expansion

## Launch content baseline
Fresh servers now seed a progression network spanning ten public regions plus the restricted Astra Sanctum GM Island. The pack contains regional monster families, elites and bosses, four-step quest chains, equipment tiers, extra vocation spells, world events, shops and server-side loot tables.

## Admin ownership
The authoritative `/admin` Content Studio can create/edit/delete items, monsters, NPCs, spells, quests, maps, events, shops, loot tables and the GM roster. Quest rewards, monster loot-table links, map access and all 13 equipment slots are exposed by the shared Studio schema.

## GM Island
`gm_sanctum` uses `access: gm`. Entry is checked server-side against the `gmRoster` content catalog. Add a character name to **GM Roster** in `/admin` to grant access; removing it immediately revokes restricted-map access. The island includes a test plaza, training dummies, a boss simulator and GM operations NPCs.

## Runtime integration
- Dynamic maps rebuild deterministic terrain and portals.
- Content monsters spawn authoritatively by `mapId`.
- `lootTableId` rolls supplementary drops server-side.
- Content shops extend the authoritative merchant catalog.
- Content spells execute through the server spell list.
- Quest chains and events resolve content targets by stable IDs.

All 9.1 work remains subject to the normal audits, TypeScript/build gate, server syntax check and full server test suite.

## Upgrade de servidores 9.0
Bancos ContentDB v1 já populados são migrados uma única vez para v2. Registros existentes do admin têm precedência sobre defaults alpha; após a migração, edições e exclusões persistem normalmente entre reinícios. Bancos v1 intencionalmente vazios permanecem vazios e apenas recebem o marcador de schema v2.

## Quartermasters regionais
A proximidade de `shop_buy` agora aceita qualquer NPC autoritativo com `role: merchant`, então os quartermasters criados pelo Studio são serviços reais, sem abrir compra remota.
