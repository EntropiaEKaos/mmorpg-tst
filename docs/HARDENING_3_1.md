# Mor'ia 3.1 — Server Hardening

This release hardens the authoritative MMO server before further feature work.

## Required production configuration

Set a strong `ADMIN_TOKEN` environment variable on the server before enabling the web admin panel.

Example (local shell):

```bash
ADMIN_TOKEN="replace-with-a-long-random-secret" npm start --prefix server
```

When `ADMIN_TOKEN` is missing, `/admin` and `/admin/api/*` remain unavailable by design.

To establish an admin browser session, open once:

```text
https://YOUR_SERVER/admin?token=YOUR_ADMIN_TOKEN
```

The server validates the token and redirects to `/admin` with an HttpOnly, SameSite=Strict cookie. Prefer HTTPS in production.

## Security changes

- Movement is restricted to one orthogonal integer grid tile per accepted intent.
- Client-supplied travel coordinates are ignored; spawn points are server-owned.
- Unknown maps are rejected.
- Equipment and talent bonuses are no longer double-counted.
- Talent IDs, ranks and prerequisites are enforced server-side.
- Talent reset is authoritative and costs 500 gold on the server.
- Character vocation is restored from the authoritative save instead of trusting reconnect input.
- Character saves use a server-owned whitelist and no longer merge arbitrary client payloads.
- Duplicate simultaneous sessions for the same character name are rejected.
- WebSocket payload and message-rate limits are enforced.
- Admin CRUD requires `ADMIN_TOKEN`.
- Admin request bodies have a size limit and malformed JSON is rejected.
- Static file serving validates path containment to block traversal.
- CORS is restricted to same-origin requests.
- CI builds the client, checks server syntax and executes server hardening tests.

## Remaining production blocker: account ownership

Version 3.1 prevents duplicate online sessions and preserves server-owned character state, but a player name is still not a real account credential. A user who knows an offline character name can still attempt to authenticate as that character.

Before opening the game to untrusted public players, add account authentication with password hashing or an external identity provider, session/token rotation, character ownership checks, recovery flow and persistent database-backed accounts.

## Verification

From the repository root:

```bash
npm ci
npm run build
npm ci --prefix server
npm run check --prefix server
npm test --prefix server
```
