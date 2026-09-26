# Mor'ia ISO Next — Phase 0 Implementation Log

## Batch 0.1 — renderer-neutral foundation

Implemented the first executable primitives without touching authoritative simulation or the legacy renderer:

- `src/game/iso-next/projection.ts` — deterministic world-to-isometric projection plus inverse projection.
- `src/game/iso-next/camera.ts` — renderer-neutral camera state with bounded zoom.
- `src/game/iso-next/worldAdapter.ts` — maps authoritative visual entities into projected presentation entities and deterministic depth order.
- `src/game/iso-next/index.ts` — public boundary for the ISO Next presentation layer.

### Safety properties

This batch intentionally contains no movement validation, collision, combat resolution, loot, targeting, persistence or network authority. Existing world coordinates are copied, not mutated. RendererLegacy is untouched.

### Next batch

1. Wire PixiJS as the scene renderer.
2. Add `RendererIsoNext` lifecycle (`mount`, `resize`, `render`, `destroy`).
3. Add a development-only Eldoria scene fixture fed through the same adapter contract.
4. Add projection/adapter tests.
5. Run TypeScript/build/server regression gates.
6. Launch Chromium against the built prototype and commit the first real screenshot only after browser verification.

### Evidence status

No screenshot is claimed for Batch 0.1. Screenshot gate remains OPEN until a real browser-rendered PixiJS vertical slice exists.
