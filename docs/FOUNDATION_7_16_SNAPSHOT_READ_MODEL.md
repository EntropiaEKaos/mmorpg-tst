# Foundation 7.16 — Snapshot Read Model

The official client snapshot is now assembled by `OfficialSnapshotReadModel` instead of the `OfficialSystems` facade.

## Guarantees

- Runtime and persisted objects are detached before crossing the client boundary.
- Inbox projection is recipient-scoped and capped.
- Auction projection exposes only public listing fields.
- World-event participants and arbitrary persisted fields are not exposed.
- Public mystery answers and achievement predicate functions never enter the snapshot.
- Nearby PvP entries are explicit, same-map, unique and bounded.
- Numeric public fields are clamped without mutating authoritative runtime state.
- Catalog snapshots are detached so consumers cannot mutate server catalogs through returned references.

`OfficialSystems.snapshot()` remains as a compatibility facade and delegates to the read model.
