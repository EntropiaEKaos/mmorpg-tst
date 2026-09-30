# ISO Next — Migration Parity Matrix

> Goal: retire the legacy visual client only after every legacy capability has an authoritative ISO path, automated proof and visual evidence where applicable.

## Definition of Done
A row is **DONE** only when: (1) server authority is preserved; (2) ISO adapter exists; (3) ISO UI/render path exists; (4) automated regression is green on the same HEAD; (5) browser evidence exists for visual/user-facing behavior; (6) legacy fallback can be disabled without losing the capability.

| Capability | Authority | ISO path | Automated proof | Visual proof | Legacy retirement |
|---|---|---|---|---|---|
| Movement / camera / collision | server | implemented | CI + bootstrap | visual evidence | VERIFY |
| Eldoria world presentation | server world + presentation passes | implemented | CI + visual | desktop + narrow | VERIFY |
| Character rendering / identity | server entity state + presentation | implemented | CI + visual | warrior/mage/ranger; lineup pending | BLOCKED: lineup |
| Combat state / cues | server | implemented | combat/progression gates | combat HUD + boss evidence | VERIFY |
| Boss telegraphs | server cue + presentation | implemented | visual gate | Thorn Colossus telegraph/danger | VERIFY |
| Inventory / equipment / items | server | implemented UI path | items/economy gates | item tooltip | VERIFY |
| Merchant / economy | server | implemented UI path | items/economy gates | merchant HUD | VERIFY |
| Bank / depot | server | implemented UI path | UI gates | bank/depot HUD | VERIFY |
| Skills / spells | server | implemented UI path | combat/progression gates | spell tooltip | VERIFY |
| Stats / progression | server | implemented UI path | combat/progression gates | stat tooltip | VERIFY |
| Dialogue / NPC interaction | server | implemented UI path | dialogue gates | REQUIRED FINAL SWEEP | VERIFY |
| Quests / journal | server | implemented UI path | adventure/quest gates | REQUIRED FINAL SWEEP | VERIFY |
| Crafting | server | adapter/UI present | REQUIRED FINAL SWEEP | REQUIRED FINAL SWEEP | OPEN |
| Loot / drops | server | adapter present | REQUIRED FINAL SWEEP | REQUIRED FINAL SWEEP | OPEN |
| Social / mail / library | server | implemented UI path | social gates | social HUD | VERIFY |
| Bestiary | server/content | implemented UI path | character/bestiary gates | multiple creatures | VERIFY |
| Sunreach | server world/content | region migration present | regional gates | REQUIRED CURRENT-HEAD PROOF | VERIFY |
| Ironwood | server world/content | region migration present | regional gates | REQUIRED CURRENT-HEAD PROOF | VERIFY |
| Frostpeak | server world/content | region migration present | regional gates | REQUIRED CURRENT-HEAD PROOF | VERIFY |
| Shadowfen | server world/content | region migration present | regional gates | REQUIRED CURRENT-HEAD PROOF | VERIFY |
| Mobile/narrow viewport | presentation | implemented | visual gate | Eldoria narrow | VERIFY |
| Pixi + Three composition | presentation only | implemented | CI + visual | current-head screenshot | VERIFY |
| Reconnect / persistence | server/session | existing authority | REQUIRED BURN-IN | n/a | OPEN |
| Long-session stability | server/client | n/a | REQUIRED BURN-IN | n/a | OPEN |
| Performance / memory | client | n/a | REQUIRED BUDGET GATE | evidence metrics | OPEN |
| RendererLegacy fallback | legacy | intentionally retained | n/a | n/a | DO NOT REMOVE YET |

## Closure order
1. Character identity lineup: Player + Maelis + Orwin + Guard + Mage + Warrior, names hidden.
2. Current-HEAD regional evidence sweep: Eldoria, Sunreach, Ironwood, Frostpeak, Shadowfen.
3. Functional sweep: dialogue, quests, crafting, loot, inventory/equipment, merchant, bank/depot, skills/progression, social.
4. Authoritative combat journey: acquire quest -> travel -> engage -> skill/cast -> damage/status -> loot -> progression -> persist/reconnect.
5. Mobile + desktop journey and browser console/network cleanliness.
6. Burn-in, reconnect/persistence, performance/memory budgets.
7. Disable legacy renderer behind a reversible feature flag and rerun the complete certification suite.
8. Only after the flag-off suite is green may RendererLegacy deletion be proposed.

## Safety rule
Never reuse a green result from an older SHA after a new HEAD. Never delete or bypass legacy behavior merely to make the matrix green. Fix the ISO path or keep the fallback.
