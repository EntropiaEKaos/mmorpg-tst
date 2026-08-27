# Mor'ia 8.1 — Quality Foundation

## Objective

Version 8.1 starts the quality-first evolution of the 8.x line. The goal is to make future combat, world, progression, social and Studio work safer instead of adding more responsibility to the existing UI and server monoliths.

## Changes in this gate

- CI now protects `content-expansion-8.0`, all `moria-8.*` evolution branches and the future `moria-9.*` line.
- Server-content normalization has been extracted from `GameScreen.tsx` into `src/game/serverContentAdapters.ts`.
- A regression test prevents those adapters from leaking back into the UI orchestrator.
- A size budget prevents `GameScreen.tsx` from silently returning to its pre-8.1 size while further decomposition is underway.
- The 8.0 transaction manager now releases its unit-of-work lock if `prepareCommit` throws after a successful domain operation, preventing subsequent official transactions from being blocked.
- Existing server-authoritative domains, transaction boundaries and runtime coordinator remain the source of truth for online systems.

## Quality rule for 8.x

Every structural or gameplay change must pass dependency audit, client typecheck, production build, server syntax validation and the full server test suite before it is committed by an automated migration workflow.

## Next decomposition targets

1. input/hotkey orchestration;
2. canvas rendering and camera lifecycle;
3. online snapshot/content synchronization;
4. modal/panel orchestration;
5. combat presentation effects.

Each extraction should preserve behavior first and only then add new game-feel features.
