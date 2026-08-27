# MOR'IA Foundation 7.3 — Official Action Extensibility

Foundation 7.3 removes the transport-action dispatch bottleneck from `OfficialSystems`.

## Declarative registry

`server/engine/OfficialActionRegistry.mjs` is now the single dispatch catalog for official server actions. Each action declares:

- its execution adapter;
- optional NPC service/proximity metadata;
- contextual dependencies such as world, player lookup, content items or dungeon callbacks.

`OfficialSystems.handle()` now performs only four responsibilities: normalize the action, reject unknown actions, enforce declared service proximity, execute the registry entry and refresh achievements after success.

This means a future official feature no longer requires extending a long `if/else` chain. The registry test also owns the explicit public action inventory, making accidental protocol drift visible in CI.

## Behavior preservation

The refactor intentionally preserves all existing action names and method calls for pets, depot, bank, inn, training, shop, crafting, gems, daily rewards, gathering, books, mysteries, coin store, auction, mail, world events, PvP and dungeons.

NPC-gated actions remain banker/innkeeper/trainer/merchant scoped exactly as before.
