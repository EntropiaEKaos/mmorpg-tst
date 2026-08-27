# Mor'ia 8.4 — Progression & Itemization

## Goal

Make loot create real build decisions without compromising server authority or existing base-item/mastery identities.

## Authoritative itemization

- Equipment rarity controls procedural affix count: common 0, uncommon/rare 1, epic 2, legendary 3.
- Affixes are server-generated, unique per item roll, bounded by explicit stat caps and stored separately from base-item stats.
- Base item ID and base stats remain intact for mastery, admin content overrides and regression compatibility.
- Both server and client derived-stat readers apply affix metadata, so displayed stats match authoritative combat math.
- Official Coin Shop equipment caches use the same affix generator as monster drops.

## Regional progression

- Eldoria: Verdant Fiber.
- Frostpeak: Frost Crystal.
- Shadowfen: Bog Essence.
- Emberhold: Cinder Ore.
- Voidlands: Void Shard.
- Elite/boss kills have better regional-material odds and bounded quantities.
- Each regional material now feeds an official gem-crafting recipe, culminating in the Void-forged Soul Gem.

The server chooses every drop, affix and crafted result; the browser only renders the resulting state.
