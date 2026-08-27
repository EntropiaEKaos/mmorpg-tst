# Mor'ia 8.5 — Social UX & Durability

## Goals

8.5 improves the existing authoritative party, guild and direct-trade stack rather than creating client-owned social state.

## Server integrity

- Guild creation now restores both guild state and the 1000g creation fee if durable persistence fails.
- Guild join, leave, MOTD, role and kick mutations roll back in-memory state when their atomic social save fails.
- Party leadership transfers are validated by the server.
- Party, guild and trade invites can be explicitly declined and are removed server-side.
- Social snapshots publish bounded UI limits and invite TTLs instead of requiring the client to duplicate policy constants.

## Player experience

- Invite cards show remaining lifetime and Accept/Decline controls.
- Party roster shows online level/vocation and HP bars, with explicit leadership transfer.
- Guild members are sorted online-first and leaders can transfer leadership deliberately.
- Trade confirmation is blocked when local offer controls differ from the server-owned offer; the player must update the offer first.

## Authority boundary

The browser renders social state and sends intents only. Membership, permissions, invite validity, trade proximity, item ownership, gold conservation and settlement remain authoritative on the server.
