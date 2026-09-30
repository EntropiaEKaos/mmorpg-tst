# Mor'ia ISO Next — Launch-Critical Release Track

Goal: reach a public-playable ISO Next candidate quickly without sacrificing authoritative-server safety or evidence gates.

## Lane A — unblock CI (P0)

Current PR gate is blocked before typecheck/build by dependency audit findings in the existing client toolchain (`browserslist` / `baseline-browser-mapping`). Resolve the lockfile/toolchain advisory first, then rerun the complete CI. Do not waive the audit.

## Lane B — ISO renderer vertical slice (P0)

After CI is clean:

1. Add PixiJS runtime dependency and lockfile deterministically.
2. Implement `RendererIsoNext` lifecycle and a scene root with terrain/entity/foreground/FX layers.
3. Feed the scene only through the authoritative visual adapter.
4. Build Eldoria day vertical slice with deterministic camera framing.
5. Add Chromium capture workflow and commit real evidence under `docs/screenshots/iso-next/`.

## Lane C — launch hardening (P0/P1)

In parallel with visual parity work, close the readiness blockers already identified for 10.0:

- dependency/security gates;
- migration + backup/restore/rollback rehearsal;
- WebSocket reconnect/rate/payload/origin review;
- economy replay/idempotency/concurrency probes;
- 25 -> 100 -> 250 concurrent-player load ladder;
- siege/world-event soak;
- health/readiness/metrics and emergency admin controls;
- desktop + narrow viewport player-facing E2E.

## Release candidates

- **ISO Preview RC**: Eldoria playable on ISO renderer, legacy fallback intact, screenshots and browser console gate green.
- **ISO Gameplay RC**: movement/NPC/monster/combat presentation parity and performance budgets green.
- **Mor'ia 10.0 RC**: operational hardening gates green, rollback rehearsed, load baseline established.
- **Public launch**: only from a certified RC SHA; no unverified promotion.

## Evidence policy

Every RC records exact SHA, CI run IDs, browser screenshots, console status, regression count, performance/load result and known limitations. Red gates remain red in documentation until fixed; no inherited green result from an older SHA is reused after code changes.
