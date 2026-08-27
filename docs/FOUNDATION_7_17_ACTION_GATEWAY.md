# Foundation 7.17 — Official Action Gateway

`OfficialActionGateway` is now the single command boundary for official systems.

## Responsibilities

- Validates and bounds transport-facing action names.
- Rejects malformed and unknown actions before domain execution.
- Enforces authoritative NPC/service proximity from registry metadata.
- Preserves registry-driven context side effects.
- Refreshes achievements only after successful actions.
- Converts unexpected domain exceptions into stable fail-closed transport errors without exposing internal exception messages.

`OfficialSystems.handle()` and `serviceProximity()` remain compatibility delegates only.
