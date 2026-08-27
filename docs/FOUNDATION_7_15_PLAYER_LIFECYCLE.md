# MOR'IA Foundation 7.15 — Player Lifecycle Domain

Foundation 7.15 extracts login-time entitlements into `OfficialPlayerLifecycleDomain`.

The domain owns offline-credit settlement, welcome-mail delivery and the login-time durability boundary. Welcome mail now uses a stable per-character identity and recognizes the legacy welcome format, making recovery idempotent even when a character flag and global mail state disagree. Combined login mutations require one global save, and a failed durable save rolls back credit and newly queued welcome mutations in memory.

`OfficialSystems.onLogin()` remains as a compatibility façade. This boundary prepares transactional account entitlements, compensation ledgers, referral rewards, subscription perks, seasonal grants and migration rewards without mixing lifecycle rules into the core runtime.
