# Mor'ia 3.3 — Authoritative Client/World Boundary

This hardening pass closes integration gaps between the authenticated client and the authoritative MMO server.

Work in this pass includes:

- authenticated WebSocket session wiring in the game client;
- TypeScript typecheck as a blocking CI gate;
- deterministic server terrain aligned with the client map seeds;
- server-owned portal topology and travel authorization;
- level-gated portal travel;
- multi-client snapshot event delivery before event consumption;
- authoritative inventory intents for equip/unequip/drop/pickup/use-item;
- strict separation of local-only simulation from online authoritative play.

The branch remains `hardening-3.1`; this document tracks the 3.3 hardening milestone inside PR #1.
