from pathlib import Path

ROOT = Path('.')
SYSTEMS = ROOT / 'server/engine/OfficialSystems.mjs'
DOC = ROOT / 'docs/FOUNDATION_7_16_SNAPSHOT_READ_MODEL.md'

text = SYSTEMS.read_text(encoding='utf-8')

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return source.replace(old, new, 1)

text = replace_once(
    text,
    "import { officialPlayerLifecycleDomain } from './OfficialPlayerLifecycleDomain.mjs';\n",
    "import { officialPlayerLifecycleDomain } from './OfficialPlayerLifecycleDomain.mjs';\nimport { officialSnapshotReadModel } from './OfficialSnapshotReadModel.mjs';\n",
    'snapshot read model import',
)

text = replace_once(
    text,
    "  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,\n  ACHIEVEMENTS,\n} from './OfficialCatalogs.mjs';",
    "  OFFICIAL_COIN_STORE, OFFICIAL_BOOKS,\n} from './OfficialCatalogs.mjs';",
    'remove facade achievement implementation import',
)

text = replace_once(
    text,
    "const clamp = (value, min, max, fallback = min) => {\n  const n = Number(value);\n  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;\n};\nconst int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));\nconst slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');\nconst cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';\nconst playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US');\n",
    "const cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';\n",
    'remove snapshot-only facade helpers',
)

old_snapshot = r'''  snapshot(player, nearbyPlayers = []) {
    const s = this.ensurePlayer(player);
    const event = this.ensureWorldEvent();
    const inbox = this.global.mail.filter(m => m.to === playerKey(player.name)).slice(-50).map(m => ({ ...m, body: cleanText(m.body, 500) }));
    const pendingRewards = officialWorldEventDomain.pendingRewards(this, player);
    return {
      state: {
        depot: s.depot, pets: s.pets, coins: s.coins, training: s.training, professions: s.professions,
        bestiary: s.bestiary, achievements: s.achievements, daily: s.daily, stamina: s.stamina,
        booksRead: s.booksRead, mysteries: s.mysteries, pvp: s.pvp, mastery: s.mastery,
        blessingsUntil: s.blessingsUntil, titles: s.titles, dungeon: s.dungeon,
        reputation: { ...(player.reputation || { town: 0 }) }, shopDiscount: this.getReputationDiscount(player),
      },
      catalogs: {
        pets: OFFICIAL_PETS, gems: OFFICIAL_GEMS, shop: OFFICIAL_SHOP, food: OFFICIAL_FOOD,
        recipes: OFFICIAL_RECIPES, coinStore: OFFICIAL_COIN_STORE, books: OFFICIAL_BOOKS,
        mysteries: officialExplorationKnowledgeDomain.publicMysteries(), achievements: ACHIEVEMENTS.map(({ test, ...rest }) => rest),
      },
      mail: inbox,
      auctions: this.global.auctions.slice(-100).map(a => ({ id: a.id, seller: a.seller, price: a.price, item: a.item, createdAt: a.createdAt })),
      worldEvent: { ...event, participants: undefined, pendingRewards },
      nearbyPvp: nearbyPlayers.map(p => ({ id: p.id, name: p.name, level: p.level, hp: p.hp, maxHp: p.maxHp, ...this.publicPvp(p) })),
    };
  }
'''
new_snapshot = r'''  snapshot(player, nearbyPlayers = []) {
    return officialSnapshotReadModel.snapshot(this, player, nearbyPlayers);
  }
'''
text = replace_once(text, old_snapshot, new_snapshot, 'snapshot facade body')

SYSTEMS.write_text(text, encoding='utf-8')

DOC.write_text("""# Foundation 7.16 — Snapshot Read Model

The official client snapshot is now assembled by `OfficialSnapshotReadModel` instead of the `OfficialSystems` facade.

## Guarantees

- Runtime and persisted objects are detached before crossing the client boundary.
- Inbox projection is recipient-scoped and capped.
- Auction projection exposes only public listing fields.
- World-event participants and arbitrary persisted fields are not exposed.
- Public mystery answers and achievement predicate functions never enter the snapshot.
- Nearby PvP entries are explicit, same-map, unique and bounded.
- Numeric public fields are clamped without mutating authoritative runtime state.
- Catalog snapshots are detached so consumers cannot mutate server catalogs through returned references.

`OfficialSystems.snapshot()` remains as a compatibility facade and delegates to the read model.
""", encoding='utf-8')

print('Foundation 7.16 snapshot read model wired into OfficialSystems')
