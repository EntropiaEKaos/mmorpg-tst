# MOR'IA Foundation 7.13 — Official State Schema

Foundation 7.13 introduces `OfficialStateSchema` as the single normalization boundary for persistent official state.

Player state now receives catalog-backed ID validation and deduplication, bounded progression fields, canonical bestiary keys, normalized weapon mastery and mystery progress, reset of transient dungeon/cooldown state, and detached save exports. Global state receives bounded containers, canonical offline-credit keys and bounded world-event reward queues.

`OfficialSystems` keeps filesystem I/O and runtime orchestration, while creation, restoration, normalization and player export are delegated to the schema module. This separation makes future schema migrations explicit and testable before MOR'IA moves from JSON persistence to a production datastore.

The boundary is designed to support versioned migrations, account-wide progression, seasonal state, larger catalogs, database repositories and administrative repair tooling without allowing malformed legacy data to leak into gameplay domains.
