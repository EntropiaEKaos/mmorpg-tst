# Mor'ia 8.6 — Authoritative Content Studio

Mor'ia 8.6 upgrades the server Admin panel into a production-oriented Content Studio while preserving the server-authoritative runtime boundary.

## Durable publishing

`ContentDB.add`, `update` and `remove` now roll back their in-memory mutations when the atomic file save fails. The Admin API therefore cannot report a successful publish and synchronize live runtime state unless content was durably stored first. Public content-sync payloads are detached snapshots rather than direct references to the database object.

## Preflight and diagnostics

The new `ContentStudio` domain owns declarative field schemas, dynamic options, semantic validation and whole-catalog diagnostics. The Studio performs a non-mutating `/admin/api/validate/:type` preflight before publishing. Diagnostics also apply the existing cross-reference integrity rules so missing NPCs, quest prerequisites, maps and portals are surfaced before production content changes.

## Schema-driven authoring

The editor receives schema and options from the server. This adds advanced item stats introduced by 8.4, quest prerequisite JSON, custom maps in map selectors, vocation/biome/role enums, and type-aware numeric/JSON editors without duplicating game-policy catalogs in browser code.

## Studio workflow

- Search each catalog.
- Clone an existing record using index-safe handlers.
- Preflight before publish.
- Inspect server-wide diagnostics.
- Export a detached JSON content snapshot with its diagnostics.
- Publish only after durable persistence and then synchronize the authoritative runtime.

The existing ADMIN_TOKEN authorization remains mandatory for both `/admin` and `/admin/api/*`.
