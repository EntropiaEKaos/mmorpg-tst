# MOR'IA MVP Adventure 5.0

## Goal

Turn the hardened MMO foundation into a repeatable 10–20 minute gameplay loop that always gives the player a clear next objective.

## Hunt Board

- Press **H** or click **Hunts** in the top bar.
- Each region offers two server-owned hunt contracts tuned to that area's monsters and level range.
- Only one hunt can be active at a time.
- Progress is awarded by authoritative monster kills, not client messages.
- The board, active hunt, progress, streak and completion count are all delivered in server snapshots.

## Momentum

Kills chained within 8 seconds build Momentum:

- 1x: normal XP
- 2x: +5% kill XP
- 3x: +10%
- 4x: +15%
- 5x: +20%
- 6x and higher: +25% cap

Momentum is intentionally transient and is not restored after reconnect.

## Reward streak

Claiming completed contracts builds a persistent streak. The next contract reward gains +10% per streak, capped at +50%.

Every third completed contract awards an authoritative equipment cache selected from the live item/content pool near the player's current level.

## Persistence and trust boundary

Persisted:
- active contract and progress
- completed hunt count
- reward streak
- best combo

Not persisted:
- current Momentum combo timer/count

The client can only send `adventure_start`, `adventure_abandon`, and `adventure_claim` intents. Kills, progress, rewards, cache items, XP multipliers and persistence are server-owned.
