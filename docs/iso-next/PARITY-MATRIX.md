# Mor'ia ISO Next — Full Legacy Parity Matrix

## Mission
ISO Next is the future presentation client for the existing authoritative Mor'ia MMORPG. It must not fork game rules or silently drop legacy content. RendererLegacy remains the fallback/reference until every required domain below is certified.

## Certification rule
A domain is `CERTIFIED` only when:
1. server remains authoritative;
2. legacy content/state is represented in ISO Next;
3. player actions travel through existing/new bounded intents;
4. reconnect/snapshot behavior is verified where applicable;
5. automated regression tests pass;
6. browser evidence proves the user flow;
7. the current HEAD passes CI + ISO Next Bootstrap + ISO Next Visual Evidence.

## Matrix
| Domain | Server authority | ISO Next presentation | Interaction/action bridge | Tests | Visual evidence | State |
|---|---|---|---|---|---|---|
| World renderer / camera | preserved | PixiJS 2.5D vertical slice | n/a | yes | yes | IN PROGRESS |
| Eldoria | preserved | vertical slice | partial | yes | yes | IN PROGRESS |
| Euphoria | preserved | vertical slice | partial | yes | yes | IN PROGRESS |
| NPC targeting | preserved | contextual HUD | intent transport | yes | yes | IN PROGRESS |
| NPC dialog | preserved | pending full parity | pending dispatcher bridge | partial | pending | NEXT |
| Merchants / trade | preserved | pending | resolver supports bounded kind | partial | pending | NEXT |
| Quests | preserved | pending | legacy quest intents preserved | legacy coverage | pending | PLANNED |
| Classes | preserved | pending | existing state/contracts | legacy coverage | pending | PLANNED |
| Skills / abilities | preserved | pending | existing combat intents | legacy coverage | pending | PLANNED |
| Combat | preserved | pending ISO FX/feedback | existing authoritative combat | legacy coverage | pending | PLANNED |
| Inventory | preserved | pending ISO UI | existing inventory intents | legacy coverage | pending | PLANNED |
| Equipment / character | preserved | pending ISO UI | existing authoritative actions | legacy coverage | pending | PLANNED |
| Monsters / bosses | preserved | pending ISO actors/FX | authoritative simulation | legacy coverage | pending | PLANNED |
| Travel / maps | preserved | partial world slice | travel intent preserved | legacy coverage | partial | PLANNED |
| Dungeons | preserved | pending | authoritative domain | legacy coverage | pending | PLANNED |
| Crafting / professions | preserved | pending | authoritative domain | legacy coverage | pending | PLANNED |
| Economy | preserved | pending | authoritative domain | legacy coverage | pending | PLANNED |
| Factions / diplomacy | preserved | pending | authoritative domain | legacy coverage | pending | PLANNED |
| Housing | preserved | pending | existing housing intents | legacy coverage | pending | PLANNED |
| Social / chat | preserved | pending ISO shell parity | existing network path | legacy coverage | pending | PLANNED |
| Persistent/dynamic world | preserved | pending visualization | authoritative domain | legacy coverage | pending | PLANNED |
| Localization / accessibility | preserved | pending UI parity | n/a | pending | pending | PLANNED |

## Current authoritative interaction stack
- `interactionResolver.mjs`: validates target/map/range/kind and rejects client authority escalation.
- `authoritativeInteractionTargets.mjs`: derives candidates only from server-owned content and positions.
- `authoritativeInteractionHandler.mjs`: composes authoritative target derivation + resolver + bounded accepted/denied result.
- `ServerSync.sendInteraction()`: sends intent only.

## Migration order
1. Finish authoritative interaction dispatcher bridge and accepted/denied feedback.
2. NPC dialog + merchant/trade + quest giver vertical slice.
3. Combat + skills + classes + monsters with ISO feedback/FX.
4. Inventory + equipment + character/progression UI.
5. All cities/maps/travel/interiors/dungeons.
6. Crafting/professions/economy/factions/housing/social.
7. Dynamic/persistent world and remaining advanced systems.
8. Full parity audit against RendererLegacy.
9. Only after complete certification: make ISO Next primary and retain a rollback window before removing legacy paths.

## Non-negotiable guardrails
- Never trust client position, rewards, quest completion, inventory mutation, currency, permissions, damage or target metadata.
- Never delete legacy behavior merely because an ISO screen exists.
- Never call a domain migrated from screenshots alone.
- Every new HEAD is uncertified until its own gates pass.
- No production promotion while parity-critical regressions remain open.
