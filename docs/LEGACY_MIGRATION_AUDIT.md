# Legacy Migration Audit Gate

Status: **OPEN — migration is not complete**

Baseline audited: `f45809a098540a3a7293fa8c81596a9e9e231c48`

## Definition of done

The migration may only be declared complete when every system discovered by the repository-wide legacy inventory is classified as exactly one of:

1. **ISO native** — authoritative implementation lives in the official/ISO server domain and legacy code is no longer authoritative.
2. **Legacy deliberately preserved** — retained intentionally, with its boundary, reason and compatibility contract documented.
3. **Removed with proven replacement** — legacy implementation removed and its replacement identified and verified.

Critical systems additionally require automated test evidence. No subsystem may be silently omitted from the inventory.

## Required evidence per row

- legacy source/path(s)
- ISO/official source/path(s) or replacement
- authoritative owner (server/client/compatibility only)
- persistence/state ownership
- classification
- automated test or CI evidence for critical behavior
- removal/preservation rationale where applicable

## Initial finding: Achievements

Achievements is a **mandatory migration item**, not optional polish.

Current baseline contains both legacy/client-facing and official/server-facing surfaces, including:

- `src/game/achievements.ts`
- `src/game/types.ts`
- `src/game/SaveManager.ts`
- `src/components/GameScreen.tsx`
- `src/components/AdminPanel.tsx`
- `server/engine/OfficialStateSchema.mjs`
- `server/engine/OfficialProgressionDomain.mjs`
- `server/engine/GameState.mjs`
- official catalogs used by progression

Therefore Achievements is **not yet certified merely because official code exists**. The audit must prove authority, unlock semantics, rewards, persistence, idempotency, client projection and admin behavior, then classify the legacy surfaces.

### Achievements critical acceptance evidence

- server-authoritative condition evaluation
- unlock is idempotent (no duplicate reward)
- XP/gold/title/reward application is authoritative
- achievement IDs persist across save/reconnect/reload
- client cannot forge an unlock/reward
- client UI reflects official state/event projection
- admin unlock path is explicitly privileged and auditable
- catalog IDs are unique and stable
- legacy `checkAchievements` path is either non-authoritative compatibility code or removed/replaced

## Repository-wide inventory

The next audit pass must enumerate, at minimum, every gameplay/state subsystem under legacy client/game code and cross-reference all official server domains/catalogs. Categories include combat, progression, quests, inventory/equipment, crafting, gathering/professions, bestiary, achievements, daily/stamina, economy/vendors, NPC services, world/regions/events, dungeons/bosses, social/guild/friends, persistence/save compatibility, admin/debug paths, and any additional subsystem found during the scan.

**Rule:** finding a system not listed here expands the inventory; it must not be ignored.

## Certification table

| System | Critical | Classification | Evidence | Status |
|---|---:|---|---|---|
| Achievements | yes | pending audit | official + legacy surfaces found; behavioral proof pending | OPEN |

This table is intentionally incomplete until the exhaustive repository scan populates it. Its incompleteness prevents migration certification.
