# Mor'ia 9.2 — Alpha Life Systems

This phase adds four server-authoritative MMORPG systems inspired by classic Tibia conventions while keeping Mor'ia's own content model.

## Housing
- Global persistent ownership, one house per character.
- House interior access is enforced by the movement server.
- Owner guest lists, weekly rent, grace period, decoration placement/removal.
- House definitions and decoration catalog are editable in Content Studio.

## Tibia-style Tasks
- Separate from narrative quests and Adventure Board contracts.
- Up to three active tasks, repeat limits, task points, hunter ranks and boss unlock metadata.
- Accept/claim requires the configured task master; kills progress only on the authoritative server.
- Task definitions are editable in Content Studio.

## Outfits
- Owned outfit collection, selected outfit, four color channels and two optional addons.
- Unlock/purchase and addon ownership are persistent and server-controlled.
- Outfit definitions are editable in Content Studio.

## Mounts
- Owned collection, selection, purchase, mount/dismount and server-derived movement bonus.
- Stable purchase requires a nearby stablemaster.
- Nearby-player snapshots expose the selected public mount.
- Mount catalog is editable in Content Studio.

## Client presentation and UX
- `LifeStylePanel` provides four player-facing tabs: Tasks, Housing, Outfits and Mounts.
- `playerAvatar.ts` replaces the fixed generic avatar with layered procedural silhouettes, four outfit colors, two addon layers and mount-specific bodies.
- Nearby authoritative players carry their public outfit/addon/color and selected mount projection, so appearance is consistent for every observer.
- `housingPresentation.ts` renders current-map house footprints, ownership/for-sale labels, doors and placed decoration without moving any authority into the renderer.
- Life-system UI sends intents only; prices, ownership, rewards, speed and access remain server-owned.

## Persistence
ContentDB schema advances to v3. Populated v2 installs receive missing 9.2 defaults without overwriting admin-edited records; intentionally empty databases remain empty. Player task/outfit/mount state lives in the authoritative character save. Housing ownership is global and stored independently so two player saves cannot claim the same property.
