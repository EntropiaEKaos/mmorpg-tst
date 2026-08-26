# Hardening 3.3 verification checklist

- [x] Client sends bearer session token + character name to authoritative WebSocket auth.
- [x] `tsc --noEmit` is a blocking CI gate.
- [x] Server terrain generation is deterministic and aligned with client seeds.
- [ ] Travel requires a server-owned portal and target level gate.
- [ ] Map events are delivered to all snapshot recipients before consumption.
- [ ] Online inventory actions are intents (use/equip/unequip/drop/pickup).
- [ ] Local-only progression systems cannot mutate authoritative online state.
- [ ] Full audit, typecheck, build, server syntax and security tests pass on final head.
