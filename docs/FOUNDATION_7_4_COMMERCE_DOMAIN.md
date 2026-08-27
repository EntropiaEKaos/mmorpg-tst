# MOR'IA Foundation 7.4 — Commerce Domain Extraction

Foundation 7.4 performs the first domain extraction from the large official-systems service without changing the public gameplay protocol or persistence format.

## Commerce & Messaging domain

`OfficialCommerceDomain.mjs` now owns:

- auction listing;
- auction purchase and online/offline seller settlement;
- auction cancellation and item return;
- player mail creation, postage, gold and item attachments;
- mail read/claim/delete lifecycle.

`OfficialSystems` retains compatibility wrappers with the same method names and signatures, so the action registry, GameState and clients require no protocol changes.

The domain receives the official host explicitly rather than importing the singleton. This keeps tests isolated and avoids a circular dependency while preserving the existing global JSON schema.

## Why this matters

Auction and mail are the natural expansion point for marketplace search, buy orders, COD, guild banking, escrow and system deliveries. Those features can now evolve in a focused domain instead of adding more stateful transaction code to `OfficialSystems.mjs`.

The new unit suite verifies offline credits, online seller settlement, cancellation, mail attachment/gold claims, one-time claiming and fail-closed host validation. Existing end-to-end official and persistence tests continue to validate the compatibility wrappers.
