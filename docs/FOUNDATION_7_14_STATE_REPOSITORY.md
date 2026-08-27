# MOR'IA Foundation 7.14 — Official State Repository

Foundation 7.14 extracts durable official-state filesystem I/O into `OfficialStateRepository`.

The repository enforces a maximum file size, routes every load/save through `OfficialStateSchema`, writes to exclusive temporary files with owner-only permissions, flushes file data before rename, atomically replaces the live snapshot and cleans temporary files on failure. Corrupt or oversized state fails closed and is never silently overwritten during load.

`OfficialSystems` is now an orchestration façade: it owns the live state reference but delegates physical persistence to the repository. This is the adapter seam for replacing JSON with PostgreSQL, SQLite, Redis-backed coordination or another durable store without changing combat, economy, progression, events or exploration domains.
