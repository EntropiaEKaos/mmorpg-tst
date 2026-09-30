# ISO Next — Migration Parity Matrix

> Completion contract for retiring the legacy renderer. A row is DONE only when authority, ISO adapter/UI, automated test and visual/runtime evidence are all present on the same certified HEAD.

## Gates

| Domain | Legacy authority preserved | ISO presentation/adaptor | Automated proof | Evidence | State |
|---|---:|---:|---:|---:|---|
| World movement / camera / collision | ✓ | ✓ | ✓ | ✓ | DONE |
| Eldoria world presentation | ✓ | ✓ | ✓ | ✓ | DONE |
| Sunreach regional presentation | ✓ | ✓ | ✓ | ✓ | DONE |
| Ironwood regional presentation | ✓ | ✓ | ✓ | ✓ | DONE |
| Frostpeak regional presentation | ✓ | ✓ | ✓ | ✓ | DONE |
| Shadowfen regional presentation | ✓ | ✓ | ✓ | ✓ | DONE |
| Character class identity | ✓ | ✓ | ✓ | ✓ | DONE |
| Named NPC identity (Maelis / Orwin) | ✓ | ✓ | partial | partial | ACTIVE |
| Combat presentation / telegraphs | ✓ | ✓ | ✓ | ✓ | DONE |
| Boss presentation | ✓ | ✓ | ✓ | ✓ | DONE |
| Inventory / equipment / item tooltips | ✓ | ✓ | ✓ | ✓ | DONE |
| Merchant / economy | ✓ | ✓ | ✓ | ✓ | DONE |
| Bank / depot | ✓ | ✓ | ✓ | ✓ | DONE |
| Dialogue / NPC interaction | ✓ | ✓ | ✓ | partial | ACTIVE |
| Quest / journal / tracker | ✓ | ✓ | ✓ | partial | ACTIVE |
| Crafting | ✓ | ✓ | partial | partial | ACTIVE |
| Skills / progression | ✓ | ✓ | ✓ | ✓ | DONE |
| Social / mail / library | ✓ | ✓ | ✓ | ✓ | DONE |
| Bestiary / creatures | ✓ | ✓ | ✓ | ✓ | DONE |
| Responsive / narrow viewport | ✓ | ✓ | ✓ | ✓ | DONE |
| Pixi + Three composition | n/a | ✓ | ✓ | ✓ | DONE |
| Reconnect / persistence / long session | ✓ | ✓ | partial | missing | BLOCKER |
| Legacy renderer fallback equivalence | ✓ | partial | partial | missing | BLOCKER |

## Immediate completion queue

1. Character lineup gate: Player + Maelis + Orwin + Guard + Mage + Warrior, names hidden in the proof image.
2. Named-NPC interaction proof: merchant and bank/depot flows from authoritative state to ISO UI.
3. Quest/dialogue/crafting end-to-end evidence on the same HEAD.
4. Reconnect + persisted state burn-in in a real browser session.
5. Cross-region smoke: Eldoria → Sunreach → Ironwood → Frostpeak → Shadowfen without legacy renderer takeover.
6. Legacy fallback equivalence audit: enumerate every remaining call/site that can enter the old renderer.
7. Final browser-console/network clean run and performance budget.
8. Only after all rows are DONE: disable legacy renderer by default, retain emergency feature flag for one release cycle, then remove dead code in a separate PR.

## Non-negotiable rules

- No green result from an older HEAD counts after a new commit.
- Presentation must never become gameplay authority.
- No legacy subsystem is deleted because it merely looks migrated.
- Every BLOCKER requires automated proof plus runtime/visual evidence before closure.
- PR #19 stays draft until the matrix has no ACTIVE/BLOCKER rows and the final HEAD is independently certified.
