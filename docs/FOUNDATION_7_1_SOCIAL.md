# MOR'IA Foundation 7.1 — Authoritative Social Layer

Foundation 7.1 turns the MMO social placeholders into server-owned systems.

- Party: create, nearby invite, accept, leader kick, leave, five-member cap and private party chat.
- Guild: persistent guild database, level/gold creation gate, invitations, leader/officer/member roles, MOTD, kick/promote/demote and private guild chat.
- Direct trade: proximity-gated request/accept, gold and up to eight whole inventory entries per offer, confirmation reset on offer changes, final inventory/gold revalidation and atomic settlement.
- Chat routing: `say` is range/map scoped; `party` and `guild` are membership scoped; `world` and `trade` remain realm channels. Clients can no longer send the reserved `system` channel or choose arbitrary chat colors.
- Social state is included in authoritative snapshots and rendered through the Social Hall UI.
- Disconnect automatically cancels trades and removes the character from session-scoped parties while guild membership persists.
