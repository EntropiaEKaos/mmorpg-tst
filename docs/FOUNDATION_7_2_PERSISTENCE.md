# MOR'IA Foundation 7.2 — Persistence Durability

Foundation 7.2 closes a durability gap between authoritative in-memory gameplay and JSON persistence.

## Durable player state

- The server now performs authoritative autosaves for every authenticated online character; the client is not responsible for keeping the canonical save current.
- `MORIA_AUTOSAVE_MS` configures the interval, clamped to 1–300 seconds; the default is 15 seconds.
- Graceful SIGTERM/SIGINT first materializes every online player into PlayerDB before flushing content, official and social stores.
- `/health` exposes autosave interval, last autosave/critical flush timestamps and the number of players written by the last flush.

## Critical economic flushes

Successful `official` intents are immediately followed by a durable online-player flush. This covers auction, mail, depot, bank, shop, coin, PvP and other server-owned mutations, including changes to another online character such as auction seller credit or PvP damage.

Successful direct-trade confirmation and guild creation also trigger immediate critical persistence. A completed two-player trade therefore writes both canonical player records in one PlayerDB save before control returns to normal gameplay.

Official and social databases retain atomic temp-file rename persistence and are re-flushed after critical player writes, sharply reducing the crash window across the MVP JSON stores.

## Verification

The integration suite starts real server processes with isolated DB files and proves:

1. movement is autosaved while the WebSocket remains connected and without any client `save` message;
2. a completed direct trade is present in both PlayerDB records before the long autosave interval or disconnect can occur.
