# ISO Next — Legacy Migration Parity Matrix

> Completion rule: a legacy capability is **DONE** only when authority is preserved, the ISO adapter/UI path exists, automated validation is green, and browser evidence exists where the capability is visual.

## Current certified checkpoint

- Branch: `feat/moria-iso-next`
- Character Identity renderer checkpoint: `3cf73cde4d572e01b9d2914bcef973972d6687c2`
- Required gates per new HEAD: CI + ISO Next Bootstrap + ISO Next Visual Evidence.
- Legacy renderer remains available until every blocker below reaches DONE.

## Matrix

| Domain | Authority / data | ISO presentation path | Automated proof | Visual/browser proof | State | Exit blocker |
|---|---|---|---|---|---|---|
| World snapshot / movement | Server-authoritative snapshot + world adapter | Pixi ISO scene/camera | Bootstrap + CI | Eldoria desktop/mobile | VERIFY | Long-session movement/reconnect burn-in |
| Character identity | Authoritative entity IDs/stats preserved | `characterIdentity.ts` + `characterVisualSystem.ts` | CI + visual gate | Warrior/Mage/Ranger + identity lineup | VERIFY | Review lineup silhouettes and add named-NPC proof |
| Eldoria | Existing world content | District/architecture/life/micro-event passes | regional workflows + CI | Eldoria desktop/mobile | VERIFY | Full interaction traversal |
| Sunreach | Existing region content | ISO regional presentation | historical regional gates | historical visual proof | AUDIT | Re-run on final migration HEAD |
| Ironwood | Existing region content | ISO regional presentation | historical regional gates | historical visual proof | AUDIT | Re-run on final migration HEAD |
| Frostpeak | Existing region content | ISO regional presentation | historical regional gates | historical visual proof | AUDIT | Re-run on final migration HEAD |
| Shadowfen | Existing region content | ISO regional presentation | historical regional gates | historical visual proof | AUDIT | Re-run on final migration HEAD |
| Combat | Server authoritative | Combat world/HUD + character cues | combat/progression workflows | combat HUD + boss telegraph/danger | VERIFY | Full attack/cast/hit/death loop and reconnect |
| Skills / spells | Server authoritative | HUD slots/tooltips + world FX | combat/progression workflows | spell tooltip | VERIFY | Multi-skill cooldown/status proof |
| Monsters / bestiary | Server authoritative | creature renderer | visual gate | 6 creatures + Thorn Colossus states | VERIFY | Spawn/death/loot lifecycle |
| Boss encounters | Server authoritative | boss HUD + danger telegraphs | visual gate | Thorn Colossus telegraph + danger | VERIFY | Resolution/death/reward lifecycle |
| Inventory | Server authoritative | ISO inventory UI | items/economy + visual gate | item tooltip + multi-window | VERIFY | Mutating equip/use/drop proof |
| Equipment | Server authoritative | character visual equipment + UI | CI | class screenshots | VERIFY | Equip/unequip must update world silhouette |
| Economy / merchant | Server authoritative | merchant interaction/HUD | items/economy workflows | merchant screenshot | VERIFY | Buy/sell balance mutation round-trip |
| Bank / depot | Server authoritative | bank/depot HUD | visual gate | bank/depot screenshot | VERIFY | Deposit/withdraw persistence round-trip |
| Dialogue | Server authoritative | dialogue tracker/UI | dialogue workflows | interaction evidence | AUDIT | Branching choice + persisted consequence proof |
| Quests / journal | Server authoritative | journal/quest UI | adventure/quest workflows | existing UI evidence | AUDIT | Accept/progress/complete/reconnect proof |
| Crafting | Server authoritative | crafting UI/service adapter | bootstrap/CI coverage | pending dedicated evidence | BLOCKED | Recipe -> consume -> craft -> persist proof |
| Loot | Server authoritative | world/inventory feedback | partial combat/inventory coverage | pending dedicated evidence | BLOCKED | Drop -> pickup -> inventory persistence proof |
| Social | Server authoritative | social HUD | library/mail/social workflows | social screenshot | VERIFY | Live party/friend/mail mutation proof |
| Mail / library | Server authoritative | ISO panels | library/mail/social workflows | panel evidence | AUDIT | Mutation + reconnect persistence proof |
| Minimap / navigation | Snapshot/world data | ISO minimap | bootstrap | exploration screenshot | VERIFY | Cross-region/interior navigation proof |
| Interiors / portals | Server authoritative | world adapter + ISO renderer | partial | pending migration sweep | BLOCKED | Enter/exit/return position persistence |
| Death / respawn | Server authoritative | character/combat presentation | partial | pending dedicated evidence | BLOCKED | Death -> respawn -> state restoration |
| Reconnect / session recovery | Server authoritative | client adapter | partial | none dedicated | BLOCKED | Disconnect during movement/combat/UI mutation |
| Persistence | Server/database authoritative | no visual ownership | existing backend gates | n/a | AUDIT | Final end-to-end save/reload matrix |
| Pixi + Three composition | Presentation only | Pixi world + Three atmosphere | visual gate | Three canvas mounted/visible | VERIFY | Performance/resize/mobile burn-in |
| Legacy renderer retirement | n/a | ISO Next replaces visual path | final parity suite | final evidence pack | BLOCKED | Zero BLOCKED rows + final burn-in |

## Closure order

1. Character lineup review + named NPC identity evidence.
2. Crafting authoritative round-trip.
3. Loot authoritative lifecycle.
4. Interiors/portals traversal and return-state persistence.
5. Death/respawn lifecycle.
6. Reconnect/session recovery under movement, combat and inventory mutation.
7. Re-run regional parity on one final HEAD: Eldoria, Sunreach, Ironwood, Frostpeak, Shadowfen.
8. Final browser burn-in: desktop + narrow/mobile, repeated region transitions, HUD windows, combat and economy.
9. Only after zero BLOCKED rows: remove/disable legacy renderer fallback in a dedicated reversible commit.

## Non-negotiable migration rules

- Never move combat, economy, quest, inventory, NPC or persistence authority into Pixi/Three.
- Presentation events may visualize authoritative state but may not invent authoritative outcomes.
- A historical green is supporting evidence, not certification for a changed HEAD; final promotion requires fresh gates on the final SHA.
- Do not remove legacy code in the same commit that proves parity. Retirement is a separate reversible change.
