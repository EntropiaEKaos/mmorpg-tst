# ISO Next — Migration Parity Closure Matrix

> Goal: retire the legacy visual client only after every gameplay capability has an ISO Next path, automated validation, and evidence. Server authority is never migrated into presentation code.

## Exit rule

A row may be marked **DONE** only when all six columns are satisfied: legacy capability identified, authority preserved, ISO adapter wired, ISO UI/visual path wired, automated test green, and evidence captured on the same HEAD.

| Capability | Authority | ISO adapter | ISO UI / visual | Automated proof | Evidence | State |
|---|---|---|---|---|---|---|
| World snapshot / movement | server | worldAdapter | Pixi ISO renderer | bootstrap/CI | world screenshots | VERIFY |
| Camera / zoom / viewport | client presentation | camera adapter | Pixi + Three composition | visual gate | desktop + narrow | VERIFY |
| Player character identity | server identity | scene model | CharacterVisualSystem | CI | character lineup | IN PROGRESS |
| NPC identity / roles | server NPC data | worldAdapter | CharacterVisualSystem | CI | Maelis/Orwin/Guard lineup | IN PROGRESS |
| Creatures / bestiary | server creature data | scene model | creature visuals | visual gate | bestiary set | VERIFY |
| Combat state | server | combat adapter | Combat HUD + world cues | combat/progression gates | combat screenshot | VERIFY |
| Attack / cast / hit / death cues | server events | combat adapter | character/world FX | visual gate | combat sequence | VERIFY |
| Boss telegraphs | server encounter | encounter adapter | boss visual pass | visual gate | telegraph + danger | VERIFY |
| Skills / spells | server | skill adapter | action bar/tooltips | combat gates | spell tooltip | VERIFY |
| Inventory | server | inventory adapter | inventory HUD | items/economy gates | item tooltip | VERIFY |
| Equipment | server | equipment adapter | visible equipment + HUD | items gates | equipped character | OPEN |
| Loot | server | loot adapter | loot interaction | gameplay gate | loot proof | OPEN |
| Merchant | server economy | economy adapter | merchant HUD | economy gate | merchant screenshot | VERIFY |
| Bank / depot | server economy | economy adapter | bank/depot HUD | economy gate | bank screenshot | VERIFY |
| Crafting | server | crafting adapter | crafting UI | crafting gate | crafting evidence | OPEN |
| Quests / journal | server | quest adapter | journal/tracker | quest gates | tracker evidence | VERIFY |
| Dialogue | server | dialogue adapter | dialogue UI | dialogue gates | dialogue evidence | VERIFY |
| Mail / social | server | social adapters | social HUD | social gate | social screenshot | VERIFY |
| Map / minimap | server world data | realm/world adapter | minimap HUD | navigation gate | exploration evidence | OPEN |
| Regions: Eldoria | server world | worldAdapter | regional passes | region gates | Eldoria evidence | VERIFY |
| Regions: Sunreach | server world | worldAdapter | regional renderer | region gates | regional evidence | VERIFY |
| Regions: Ironwood | server world | worldAdapter | regional renderer | region gates | regional evidence | VERIFY |
| Regions: Frostpeak | server world | worldAdapter | regional renderer | region gates | regional evidence | VERIFY |
| Regions: Shadowfen | server world | worldAdapter | regional renderer | region gates | regional evidence | VERIFY |
| Interiors / transitions | server world | worldAdapter | ISO scene transition | browser gate | transition evidence | OPEN |
| Persistence / reconnect | server | session adapters | reconnect UX | burn-in | reconnect report | OPEN |
| Responsive/mobile | presentation | viewport adapter | responsive HUD | visual gate | narrow screenshot | VERIFY |
| Pixi + Three atmosphere | presentation only | camera sync | hybrid composition | visual gate | Eldoria screenshot | VERIFY |
| Accessibility / reduced motion | presentation | settings | renderer/HUD | UI gate | settings evidence | OPEN |
| Performance / long session | mixed | telemetry | renderer lifecycle | burn-in | performance report | OPEN |
| Legacy renderer fallback | client | compatibility switch | legacy renderer | regression gate | fallback proof | KEEP UNTIL EXIT |

## Closure order

1. Finish Character Identity evidence: Player + Maelis + Orwin + Guard + Mage + Warrior without labels.
2. Resolve every **OPEN** row, prioritizing equipment, loot, crafting, minimap, interiors and reconnect.
3. Re-verify all **VERIFY** rows on the final candidate HEAD; historical green runs do not certify a new HEAD.
4. Run full browser burn-in and responsive evidence.
5. Freeze feature work; only migration blockers/regressions may change.
6. Produce final parity report and artifact bundle.
7. Only after final candidate is green may the legacy renderer fallback be scheduled for removal.

## Non-negotiable invariants

- Server remains authoritative for movement, combat, inventory, economy, quests, NPC state, loot, crafting and persistence.
- Pixi/Three layers consume state; they never invent authoritative gameplay state.
- Presentation-only micro-events must stay explicitly non-authoritative.
- No legacy subsystem is deleted because a replacement merely exists; replacement must be wired, tested and evidenced.
- No green result from an older SHA is reused after HEAD changes.
