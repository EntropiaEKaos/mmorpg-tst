# Mor'ia 3.2 — Account Authentication and Character Ownership

## Security model

Online identity is no longer a character name. A player must authenticate an account, obtain a server-issued bearer session, and then select a character owned by that account.

### Passwords

- Passwords are never stored in plaintext by the server.
- The server uses Node.js `crypto.scrypt` with a unique random salt for each password.
- The browser no longer stores the legacy `tibia_accounts` plaintext account list.
- Minimum password length is 10 characters; maximum is 128.

### Recovery

Account registration returns a high-entropy recovery code once. The server stores only a scrypt hash of that code. Successful recovery changes the password, invalidates active sessions, rotates the recovery code, and shows the replacement code once.

The recovery code must be stored by the player outside the game. It is effectively a recovery credential and should never be shared.

### Sessions

- Session tokens contain 32 cryptographically random bytes.
- Only SHA-256 token identifiers are held server-side.
- Absolute session lifetime: 24 hours.
- Idle timeout: 2 hours.
- Session validation at application startup rotates the bearer token and invalidates the previous token.
- Login, password changes, and recovery revoke older sessions for the account.
- WebSocket gameplay revalidates the authenticated session and disconnects expired sessions.
- Sessions are currently in-memory; restarting the server logs players out. This is intentionally fail-closed for this release.

### Character ownership

Account registration and character creation are separate operations. The WebSocket accepts a character only when the authenticated account owns it. Vocation is read from server-owned character metadata, never trusted from the gameplay authentication payload.

Character names are unique case-insensitively. Names already present in the legacy player database are reserved and cannot be claimed automatically by a newly registered account.

## Legacy characters

The previous system did not have trustworthy account ownership metadata. Automatically attaching those saves to whoever asks for their character name would recreate the takeover vulnerability. For that reason, legacy names are reserved by default.

After the player has been verified out-of-band by an administrator and has created a new account, migrate the legacy character from the server shell:

```bash
cd server
npm run migrate:legacy -- <accountUsername> "<legacyCharacterName>"
```

The migration tool requires an existing account and an existing legacy PlayerDB save, rejects characters already owned by another account, obtains the vocation from the legacy server save, and adds only the ownership metadata. The original progression save remains intact and is loaded after authenticated login.

There is deliberately no public endpoint that claims a legacy character by name alone.

## Rate limiting

Authentication endpoints apply IP-based limits:

- register: 5 attempts / 15 minutes;
- login: 10 attempts / 5 minutes;
- recovery: 5 attempts / 15 minutes.

The HTTP integration suite starts the real server and verifies that repeated invalid login attempts are rejected and that the next attempt is throttled with HTTP `429` and `Retry-After`.

This is a baseline control. A future distributed deployment should move rate-limit state to a shared backing store and can add account-keyed throttling and abuse telemetry.

## Client behavior

Online mode stores only the bearer session token in `localStorage`. Passwords and recovery codes are not persisted by the client. The one-time recovery code must be acknowledged before continuing after registration or recovery.

Offline Quick Play remains separate and does not create or authenticate an online account.

## Admin security

The 3.1 `ADMIN_TOKEN` requirement remains in force. Authentication accounts do not grant admin access. `/admin` and `/admin/api/*` are a separate privilege boundary.

## CI security gates

The hardening CI now blocks on:

- root `npm audit`;
- server `npm audit`;
- production client build;
- syntax validation of every server runtime module and migration tool;
- authentication unit and HTTP integration tests;
- duplicate-session/replay tests;
- anti-cheat/server-authority tests.

A dependency advisory, brute-force throttling regression, ownership regression, or authentication regression therefore makes the hardening PR fail instead of being silently reported.
