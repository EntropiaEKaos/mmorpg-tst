# Hardening 3.3 verification checklist

- [x] Client sends bearer session token + character name to authoritative WebSocket auth.
- [x] `tsc --noEmit` is a blocking CI gate.
- [x] Server terrain generation is deterministic and aligned with client seeds.
- [x] Travel requires a server-owned portal and target level gate.
- [x] Map events are delivered to all snapshot recipients before consumption.
- [x] Player-private events are filtered out of other players' snapshots.
- [x] Online inventory actions are intents (use/equip/unequip/drop/pickup).
- [x] Local-only progression systems cannot mutate authenticated online state.
- [x] Online accounts fail closed while auth/snapshot is pending; Quick Play stays local.
- [x] Quest active/completed state round-trips through authoritative persistence.
- [x] Direct deployments ignore spoofed `X-Forwarded-For`; proxy trust is explicit with `TRUST_PROXY`.
- [x] Potion no-op consumption, mount progression gate, death-map events and quest-XP level-up are covered.
- [x] Full client/server dependency audits report 0 vulnerabilities.
- [x] Typecheck, Vite production build and server syntax validation pass.
- [x] Security/authority suite passes **20/20 tests**.
