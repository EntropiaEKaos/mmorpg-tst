# Mor'ia 8.2 — Combat Feel

## Goal

Make combat easier to read and more satisfying without moving any authoritative decision to the browser.

## Player-facing improvements

- Target frame is now a dedicated combat component with health %, level danger, distance, boss/elite identity and optional combat stats.
- Authoritative online targets use the same target highlight path as locally simulated monsters.
- Bosses and elites have subtle world-space aura rings before selection.
- Spell impacts now drive particles and screen shake, with stronger critical feedback.
- Authoritative server damage/heal/spell/level events can trigger presentation-only particles, audio and shake after the server event is consumed.
- Action-bar cooldowns own a 10fps presentation clock, so countdowns remain fluid even when memoized parent props do not change.
- Cooldowns use a radial sweep plus exact remaining time.

## Authority boundary

The 8.2 feedback callback receives already-authoritative snapshot events. It cannot apply damage, healing, loot, XP or progression. The server remains the only source of gameplay truth.
