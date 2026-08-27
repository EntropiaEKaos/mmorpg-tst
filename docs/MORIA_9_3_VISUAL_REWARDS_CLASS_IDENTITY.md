# Mor'ia 9.3 — Visual Rewards & Class Identity

Mor'ia 9.3 makes progression feel valuable on screen and makes every vocation play with a recognizable authoritative rhythm. The server owns combat numbers, ranges, cooldowns, reward rarity and progression; the browser only turns approved events into presentation.

## Reward feedback

Authoritative events now expose presentation metadata for important reward moments:

- `loot_reward`: rarity-aware loot burst; rare/epic/legendary drops receive stronger particles, shake and floating callouts.
- `boss_defeated`: large victory burst and message at the defeated boss position.
- `levelup`: class-accented level celebration.
- `quest_complete`, `task_ready`, `adventure_ready` and `adventure_claimed`: completion callouts plus layered particles.
- `class_sustain`: visible HP/mana return for class-specific kill sustain.
- outfit, mount and housing updates reuse the same presentation recipe layer.

`RewardFeedback.mjs` derives loot/boss presentation data from authoritative server results. `rewardPresentation.ts` and `combatPresentation.ts` translate those events into particles, shake, sound and floating feedback without altering gameplay state.

## Class combat identities

| Vocation | Role | Signature | Core gameplay identity |
|---|---|---|---|
| Knight | Vanguard Tank | Iron Bulwark | Heavy mitigation, deliberate melee cadence |
| Paladin | Holy Marksman | Dawnshot | 7-tile basic range, strong ranged hits, hybrid healing |
| Sorcerer | Burst Caster | Arcane Cataclysm | Highest burst spell multiplier and amplified magic |
| Druid | Nature Healer | Lifebloom | Strong healing with mobile nature support |
| Warlock | Drain Caster | Soul Covenant | Drain amplification, lifesteal and mana return on kills |
| Rogue | Assassin | Nightblade | Very fast melee, highest crit profile and execute damage |
| Priest | Divine Support | Beacon of Grace | Highest direct healing specialization |
| Death Knight | Drain Tank | Dreadguard | Mitigation, lifesteal and HP return on kills |
| Monk | Tempo Fighter | Flow State | Fastest basic cadence, mobility and sustained pressure |
| Ranger | Predator Marksman | Hunter's Mark | 8-tile basic range, mobility, crit and execute pressure |
| Necromancer | Death Caster | Grave Harvest | Death-magic amplification, lifesteal and mana harvest |
| Berserker | Blood Bruiser | Bloodfury | High melee pressure that spikes while critically wounded |
| Shaman | Elemental Support | Stormweaver | Elemental spell pressure plus strong hybrid healing |
| Templar | Holy Tank | Sunward Aegis | Heavy mitigation with extra protection while healthy |

## Combat rules

`ClassIdentity.mjs` is server-owned and provides class-specific:

- basic attack range;
- basic attack cadence;
- base attack multiplier;
- crit chance and crit multiplier;
- movement bonuses;
- damage reduction;
- lifesteal;
- magic specialization;
- heal/spell/drain multipliers;
- execute and low-HP conditions;
- kill sustain.

Paladin and Ranger therefore no longer behave like melee characters during normal attacks. Rogue and Monk no longer share the same basic cadence as tanks. Healers and casters receive different spell profiles, while death-oriented classes gain sustain mechanics tied to confirmed server kills.

Equipment semantics remain stable: class identity does not multiply authored equipment-defense values, so an item bonus is still applied exactly once. Data-driven buff values are also kept exact; class specialization changes heal/damage/drain output instead of rewriting Admin-authored buff values.

## Visual class signatures

`classIdentity.ts` gives every vocation a presentation palette, accent, combat style and particle bias. Server combat events include the caster's vocation, allowing `combatPresentation.ts` to produce different visual weight for tanks, assassins, marksmen, arcane casters, nature healers, divine support, death casters, blood fighters and elemental support.

This visual layer is deliberately presentation-only: changing a client palette or particle recipe cannot change damage, range, cooldowns, crits, healing, sustain or rewards.

## Architecture guard

No 9.3 reward logic was added to `GameScreen.tsx`. The existing orchestrator remains below the 155 KB architecture budget. Reward/class presentation lives in extracted modules and is driven through the existing `ServerSync.processEvents(...)` callback.

## Validation

The 9.3 gate covers all 14 class IDs, unique roles/signatures, ranged identities, attack cadence, execute/low-HP mechanics, caster/healer/drain multipliers, kill sustain, rarity summarization, boss rewards, client reward recipes and the GameScreen size budget. The full release line must also pass dependency audits, TypeScript, production build, server syntax and the complete Node test suite before integration.
