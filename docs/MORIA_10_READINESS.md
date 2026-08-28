# Mor'ia 10.0 — Readiness Dossier

**Baseline:** Mor'ia 9.26.1 — Road to 10  
**Purpose:** freeze the feature baseline and define the engineering gates that must be satisfied before Mor'ia 10.0 is treated as a public-production release rather than only a feature-complete candidate.

---

## 1. Current release baseline

Mor'ia 9.26.1 closes the Road-to-10 line built on top of The Living Realm. The server owns the authoritative state for Nodes, factions, regional economy, professions, animal care, faction politics, warfare, dynamic-world pressure, dungeon blueprints, quest consequences and functional housing upgrades.

The Road-to-10 layer is deliberately separated from `LivingRealmDomain` so these systems can grow without turning the Living Realm domain or `GameScreen.tsx` into new monoliths. Public player actions continue to cross the official action gateway and persistent state boundaries.

### Validated engineering baseline

| Gate | 9.26.1 result |
| --- | --- |
| Client dependency audit | PASS — 0 known vulnerabilities |
| TypeScript | PASS |
| Production client build | PASS — Vite 7.3.6, 122 modules |
| Production single-file bundle | PASS — ~916.62 kB / ~243.83 kB gzip |
| `GameScreen.tsx` architecture budget | PASS — 154,695 bytes / 155,000 max |
| Server dependency audit | PASS — 0 known vulnerabilities |
| Server syntax check | PASS |
| Server regression suite | PASS — **308/308**, 0 failures |
| Explicit 9.26.1 closure tests | PASS — bounty, faction program, auction economy, dungeon puzzle, housing services, blueprint boss identity |
| Browser visual review | PASS — **10/10 Road-to-10 surfaces** |
| Browser console during visual review | PASS — **0 captured errors** |

These gates prove the feature baseline and regressions covered by the current suite. They do **not** by themselves prove production MMO capacity under sustained concurrent load.

---

## 2. Road to 10 capability matrix

| Version | Capability | Server-authoritative runtime | Persistent | Studio / player surface | Status |
| --- | --- | :---: | :---: | :---: | --- |
| 9.17 | Cross-system integration modifiers | ✅ | ✅ | ✅ | READY |
| 9.18 | Regional economy, scarcity, demand and Node taxation | ✅ | ✅ | ✅ | READY |
| 9.19 | Profession specialization and recipe discovery | ✅ | ✅ | ✅ | READY |
| 9.20 | Beast care, training and authored roles | ✅ | ✅ | ✅ | READY |
| 9.21 | Faction treasury, voting, leadership, diplomacy and bounties | ✅ | ✅ | ✅ | READY |
| 9.22 | Fortifications, siege assets, repair and siege quality | ✅ | ✅ | ✅ | READY |
| 9.23 | Ecology, threat, corruption and threshold events | ✅ | ✅ | ✅ | READY |
| 9.24 | Dungeon blueprints, branching paths, puzzles, bosses and world impact | ✅ | ✅ | ✅ | READY |
| 9.25 | Once-only persistent quest consequences | ✅ | ✅ | ✅ | READY |
| 9.26 | Functional housing services and upgrades | ✅ | ✅ | ✅ | READY |
| 9.26.1 | Runtime-closure integrations between the systems above | ✅ | ✅ | ✅ | READY |

`READY` in this table means the capability is implemented and covered by the current engineering gates. It is not a substitute for the operational gates in the next sections.

---

## 3. Authority and anti-cheat boundary

### Ready

- Economy price calculation and regional ledger mutation are server-owned.
- Node tax collection and territorial treasury changes are server-owned.
- Profession specialization selection is skill-gated on the server.
- Beast care and role assignment spend/validate server state.
- Faction leadership gates diplomacy changes.
- PvP bounty settlement occurs from an authoritative PvP death result.
- Siege assets consume authoritative materials and mutate fortification state on the server.
- Dungeon puzzle sequences and progress are generated/validated on the server.
- Quest consequences are once-only and persisted server-side.
- Housing upgrades require authoritative ownership and feed real craft/economy/siege/taming calculations.
- The client presents snapshots and submits intents; it does not own these outcomes.

### 10.0 release gate

Run an adversarial intent/fuzz pass against every new Road-to-10 action with malformed IDs, oversized numerics, duplicated requests, stale targets and rapid replay. The public release should not rely only on happy-path integration tests.

---

## 4. Persistence, migrations and recovery

### Ready

- Legacy `ContentDB.version` remains at version 3 instead of being repurposed for Road-to-10 migrations.
- Road to 10 owns a separate version marker and now identifies the durable boundary as **9.26.1**.
- Player and global Road-to-10 state cross the official normalization/export boundaries.
- Existing official persistence already has atomic repository and transaction recovery tests.

### Blocking before public 10.0

1. Take a representative copy of real 9.16/9.26 server state and perform an offline upgrade rehearsal to 9.26.1/10.0.
2. Restart the server at multiple points in the migration and verify idempotency.
3. Verify rollback from the pre-migration backup.
4. Verify that old players without Road-to-10 fields receive bounded defaults and keep inventory, quests, housing, faction and Living Realm progression.
5. Record the exact backup, upgrade and rollback commands in the operations runbook.

**Status: NEEDS RELEASE REHEARSAL.**

---

## 5. Economy and exploit hardening

The regional economy is now connected to shops, auctions, taxation, scarcity, profession demand and player services. That makes economic integrity a release-critical subsystem.

### Blocking before public 10.0

- Multi-client race tests for buying the same auction listing.
- Replay/idempotency tests around bounty settlement and faction objective rewards.
- Concurrency tests for Node treasury and regional ledger updates.
- Faucet/sink simulation for at least 30 in-game days with low, medium and high activity profiles.
- Bounds for inflation/deflation recovery after extreme market shocks.
- Verify that housing tax relief cannot stack or exceed authored caps.
- Verify siege crafting cannot create a profitable material/gold loop.
- Verify profession discovery cannot be forced by request replay.

**Status: FEATURE READY / ECONOMY SOAK REQUIRED.**

---

## 6. Factions, politics and warfare

### Ready

- Treasury donation and influence are authoritative.
- Weekly programs consume real gameplay activity.
- Leadership is derived from voting state.
- Diplomacy is leadership-gated.
- Bounties are paid after authoritative PvP kills.
- Siege assets and fortifications have persistent server state.

### Blocking before public 10.0

- 12–24 hour simulated siege soak with repeated disconnect/reconnect cycles.
- Tests for two factions acting on the same Node in the same tick window.
- Population-imbalance simulation to prevent a dominant faction from permanently locking progression.
- Recovery behavior when a server restart occurs during declared war, active siege and occupation/recovery.
- Admin emergency controls for pausing a broken war or repairing an invalid Node without hand-editing JSON.

**Status: FEATURE READY / WARFARE SOAK REQUIRED.**

---

## 7. Dynamic world and world events

### Ready

- Regional ecology, threat and corruption are bounded.
- Authored thresholds create server events and Chronicle entries.
- Monster kills, trade, quest outcomes and dungeon completions can alter regional state.
- Regional threat participates in runtime spawn timing.

### Blocking before public 10.0

- Long-duration simulation proving values converge instead of sticking at extremes.
- Per-region event cooldown/circuit-breaker verification.
- Admin kill switch for a misconfigured dynamic-world rule.
- Telemetry for event creation rate, active event count and region pressure distribution.

**Status: FEATURE READY / LIVE-SIMULATION GATE REQUIRED.**

---

## 8. Dungeon, quest and housing closure

### Dungeon

Blueprints now own map/level/Node-stage gates, branches, deterministic server puzzles, final boss identity, first-defeat records and post-clear world impact.

**10.0 gate:** run party/concurrent dungeon scenarios, disconnect during puzzle/boss, duplicate kill events and restart during a run. Validate that one clear grants one reward and one world impact.

### Quest consequences

Choices are persisted once and can alter regional economy/ecology, Node state, faction influence and Chronicle history.

**10.0 gate:** build a graph audit that confirms every consequence references a real quest/choice and that mutually exclusive consequences cannot both be committed.

### Housing

Workshop, Shopfront, Stable, Library and Siege Foundry benefits now feed runtime calculations instead of being metadata-only.

**10.0 gate:** ownership transfer/release/rent-expiry tests must verify functional benefits disappear immediately and cannot remain as orphan bonuses.

**Status: FEATURE READY / EDGE-CASE E2E REQUIRED.**

---

## 9. Performance and scale gates

No 10.0 public release should be approved without measured server capacity. Unit/integration success does not establish tick stability with real concurrent WebSocket users.

### Required benchmark profile

Run at minimum these scenarios against a production-like Node.js process:

| Profile | Concurrent clients | Duration | Required observation |
| --- | ---: | ---: | --- |
| Smoke | 25 | 15 min | no disconnect storm, stable memory |
| Normal realm | 100 | 60 min | stable tick, snapshots and actions |
| Busy realm | 250 | 60 min | p95/p99 action and snapshot latency recorded |
| Siege burst | 250 | 30 min | concentrated combat + Node actions |
| Soak | 100 | 12 h | no unbounded heap/ledger/event growth |

Record:
- event-loop lag p50/p95/p99;
- authoritative tick duration;
- WebSocket messages/sec and bytes/sec;
- snapshot size p50/p95;
- heap/RSS trend;
- CPU utilization;
- persistence flush duration and error count;
- action rejection/error rate.

Initial acceptance budgets should be written from the first reproducible baseline instead of guessed in code.

**Status: BLOCKING — LOAD BASELINE NOT YET ESTABLISHED.**

---

## 10. Production observability and operations

### Required before 10.0 public launch

- Structured server logs with request/action correlation IDs.
- Health/readiness endpoints that distinguish process alive from realm ready.
- Metrics for connected players, tick lag, action latency, persistence errors, economy volume, active sieges and dynamic events.
- Alerting thresholds for persistence failure, runaway memory, event-loop lag and repeated transaction rollback.
- Backup rotation and restore verification.
- Deployment rollback procedure.
- Admin emergency controls for economy, dynamic events and warfare.
- A short incident runbook: login outage, corrupt state, duplicate economy reward, stuck siege, runaway world event.

**Status: NEEDS OPS HARDENING.**

---

## 11. Security gate

The existing project already tests password hashing, session rotation/expiry, brute-force throttling, action-gateway failure behavior and server authority. Before 10.0 deployment, perform a deployment-level review of:

- `ADMIN_TOKEN` configuration and rotation;
- CORS/origin policy;
- WebSocket authentication and reconnect behavior;
- reverse-proxy/IP forwarding trust;
- rate limits for Road-to-10 write actions;
- payload/body size limits;
- production secret handling;
- dependency audit at the release commit.

**Status: CODE BASELINE HEALTHY / DEPLOYMENT SECURITY REVIEW REQUIRED.**

---

## 12. Visual and UX gate

The 9.26.1 browser review captures all ten Road-to-10 Director surfaces in real Chromium at 1600×1000 with zero captured console/page errors:

1. 9.17 Integration
2. 9.18 Regional Economy
3. 9.19 Profession Specialization
4. 9.20 Beast Care / Taming 2.0
5. 9.21 Faction Politics
6. 9.22 Siege Warfare
7. 9.23 Dynamic World
8. 9.24 Dungeon Blueprints
9. 9.25 Quest Consequences
10. 9.26 Housing Services

The Director screenshots document the product/authoring presentation. Runtime correctness is independently verified by the server suite; illustrative Director values must never be treated as live realm telemetry.

Before public 10.0, repeat the browser gate at desktop and one narrow viewport for the player-facing Road-to-10 panel, including the live authoritative snapshot path.

**Status: DESKTOP DIRECTOR PASS / PLAYER RESPONSIVE E2E REMAINS.**

---

## 13. Mor'ia 10.0 release decision

### Feature-complete candidate

**YES.** Mor'ia 9.26.1 is a coherent Road-to-10 feature baseline with server authority, persistence, Studio/player surfaces, 308 passing server tests and browser evidence for all ten release milestones.

### Public-production ready today

**NOT YET.** The remaining work is deliberately no longer “add another game system.” It is release engineering:

1. migration + rollback rehearsal;
2. concurrency/exploit testing;
3. economy and warfare soak;
4. load/performance baseline;
5. production observability and emergency controls;
6. deployment security review;
7. live player-facing responsive E2E.

This is the correct scope freeze for Mor'ia 10.0: stabilize, measure and operate the world that already exists rather than adding another large feature before launch.

---

## 14. Exit checklist for the 10.0 tag

- [x] Road-to-10 feature line implemented through 9.26.1.
- [x] Full current server suite green — 308/308.
- [x] Client/server dependency audits green at 9.26.1 validation.
- [x] TypeScript + production build green.
- [x] `GameScreen.tsx` still within architecture budget.
- [x] Ten Road-to-10 Chromium screenshots captured and versioned.
- [x] Browser console clean during the Road-to-10 visual gate.
- [ ] Migration rehearsal with representative pre-10 state.
- [ ] Restore/rollback rehearsal.
- [ ] Multi-client economy and bounty race suite.
- [ ] Siege/dynamic-world long soak.
- [ ] 100/250-client performance baseline.
- [ ] Production metrics/alerts/runbook.
- [ ] Deployment security review.
- [ ] Player-facing desktop + narrow responsive E2E.
- [ ] Final clean-branch CI at the exact proposed 10.0 release candidate commit.

When every unchecked item is closed, the codebase is eligible for a **Mor'ia 10.0 release-candidate tag**. The tag/merge itself remains a separate release decision.
