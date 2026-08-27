from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)

# ContentDB: migrate populated 9.0/v1 stores exactly once, preserving admin edits.
p = 'server/engine/ContentDB.mjs'
s = read(p)
s = replace_once(s,
"    if (!this.load()) this.seedDefaults();\n  }",
"    if (!this.load()) this.seedDefaults();\n    else this.migrateAlphaV2();\n  }", 'ContentDB constructor migration')
anchor = "  save() {\n    const tempFile = `${this.dbFile}.tmp`;"
migration = """  migrateAlphaV2() {
    if (Number(this.data.version) >= 2) return false;
    const hasExistingContent = COLLECTION_KEYS.some(key => Array.isArray(this.data[key]) && this.data[key].length > 0);
    if (hasExistingContent) {
      // Alpha records provide missing defaults while every existing admin value wins.
      this.data.items = mergeById(ALPHA_CONTENT.items, this.data.items);
      this.data.monsters = mergeById(ALPHA_CONTENT.monsters, this.data.monsters);
      this.data.npcs = mergeById(ALPHA_CONTENT.npcs, this.data.npcs);
      this.data.quests = mergeById(ALPHA_CONTENT.quests, this.data.quests);
      this.data.spells = mergeById(ALPHA_CONTENT.spells, this.data.spells);
      this.data.maps = mergeById(ALPHA_CONTENT.maps, this.data.maps);
      this.data.worldEvents = mergeById(ALPHA_CONTENT.events, this.data.worldEvents);
      this.data.shops = mergeById(ALPHA_CONTENT.shops, this.data.shops);
      this.data.lootTables = mergeById(ALPHA_CONTENT.lootTables, this.data.lootTables);
      this.data.gmRoster = mergeById(ALPHA_CONTENT.gmRoster, this.data.gmRoster);
    }
    // Empty v1 stores stay intentionally empty, but are marked migrated so a
    // later admin-created record cannot unexpectedly trigger the alpha seed.
    this.data.version = 2;
    this.save();
    return true;
  }

  save() {
    const tempFile = `${this.dbFile}.tmp`;"""
s = replace_once(s, anchor, migration, 'ContentDB migrate method')
write(p, s)

# Merchant service: any authoritative NPC with role=merchant can serve shops.
p = 'server/engine/OfficialActionRegistry.mjs'
s = read(p)
s = replace_once(s,
"  merchant: Object.freeze({ npcId: 'merchant_gorn', label: 'Merchant' }),",
"  merchant: Object.freeze({ npcRole: 'merchant', label: 'Merchant' }),", 'Registry merchant role')
write(p, s)

p = 'server/engine/OfficialActionGateway.mjs'
s = read(p)
old = """  const npc = npcs.find(entry => entry && entry.id === rule.npcId);
  if (!npc) return { ok: false, npc: null, error: `${rule.label} is unavailable.` };

  const mapId = text(npc.mapId, OFFICIAL_ACTION_GATEWAY_RULES.npcMapMaxLength);
  const x = Number(npc.posX);
  const y = Number(npc.posY);
  const px = Number(player.x);
  const py = Number(player.y);
  const near = mapId === player.mapId
    && Number.isFinite(x) && Number.isFinite(y)
    && Number.isFinite(px) && Number.isFinite(py)
    && Math.abs(px - x) <= OFFICIAL_ACTION_GATEWAY_RULES.serviceRange
    && Math.abs(py - y) <= OFFICIAL_ACTION_GATEWAY_RULES.serviceRange;

  return near
    ? { ok: true, npc }
    : { ok: false, npc: null, error: `Move near ${text(npc.name, OFFICIAL_ACTION_GATEWAY_RULES.npcNameMaxLength) || rule.label} to use this service.` };"""
new = """  const candidates = npcs.filter(entry => entry && (
    (rule.npcId && entry.id === rule.npcId)
    || (rule.npcRole && entry.role === rule.npcRole)
  ));
  if (!candidates.length) return { ok: false, npc: null, error: `${rule.label} is unavailable.` };

  const px = Number(player.x);
  const py = Number(player.y);
  const nearNpc = candidates.find(npc => {
    const mapId = text(npc.mapId, OFFICIAL_ACTION_GATEWAY_RULES.npcMapMaxLength);
    const x = Number(npc.posX);
    const y = Number(npc.posY);
    return mapId === player.mapId
      && Number.isFinite(x) && Number.isFinite(y)
      && Number.isFinite(px) && Number.isFinite(py)
      && Math.abs(px - x) <= OFFICIAL_ACTION_GATEWAY_RULES.serviceRange
      && Math.abs(py - y) <= OFFICIAL_ACTION_GATEWAY_RULES.serviceRange;
  });

  return nearNpc
    ? { ok: true, npc: nearNpc }
    : { ok: false, npc: null, error: `Move near ${rule.label} to use this service.` };"""
s = replace_once(s, old, new, 'Gateway merchant role proximity')
write(p, s)

# Registry regression now codifies role-based merchant service.
p = 'server/test/official-action-registry.test.mjs'
s = read(p)
s = replace_once(s,
"  assert.deepEqual(getOfficialActionService('shop_buy'), { npcId: 'merchant_gorn', label: 'Merchant' });",
"  assert.deepEqual(getOfficialActionService('shop_buy'), { npcRole: 'merchant', label: 'Merchant' });", 'Registry test merchant')
write(p, s)

# Alpha regression: migration, restart persistence and regional merchant proximity.
p = 'server/test/alpha-content-9-1.test.mjs'
s = read(p)
s = replace_once(s,
"import { rollContentLootTable, buildEquipmentLootPool } from '../engine/Items.mjs';",
"import { rollContentLootTable, buildEquipmentLootPool } from '../engine/Items.mjs';\nimport { officialActionGateway } from '../engine/OfficialActionGateway.mjs';", 'Alpha test gateway import')
s += r'''

test('9.0 content migrates to alpha v2 once while preserving admin edits across restart', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-alpha-migrate-'));
  const file = path.join(dir, 'content.json');
  try {
    fs.writeFileSync(file, JSON.stringify({
      version: 1,
      items: [{ id:'iron_sword', name:'Admin Iron Sword', slot:'weapon', attack:99, rarity:'epic', level:1, value:999 }],
      monsters: [], npcs: [], quests: [], spells: [], maps: [], worldEvents: [], shops: [], lootTables: [],
    }));
    const migrated = new ContentDB(file);
    assert.equal(migrated.data.version, 2);
    assert.ok(migrated.get('maps').length >= 11);
    assert.equal(migrated.get('items').find(item => item.id === 'iron_sword').name, 'Admin Iron Sword');
    assert.equal(migrated.get('items').find(item => item.id === 'iron_sword').attack, 99);
    const alphaItem = migrated.get('items').find(item => item.id.startsWith('eldoria_'));
    assert.ok(alphaItem);
    migrated.update('items', alphaItem.id, { name:'Admin Edited Alpha Item', attack:321 });
    const restarted = new ContentDB(file);
    assert.equal(restarted.get('items').find(item => item.id === alphaItem.id).name, 'Admin Edited Alpha Item');
    assert.equal(restarted.get('items').find(item => item.id === alphaItem.id).attack, 321);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});

test('intentionally empty legacy content remains empty after v2 migration marker', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-alpha-empty-'));
  const file = path.join(dir, 'content.json');
  try {
    fs.writeFileSync(file, JSON.stringify({ version:1, items:[], monsters:[], npcs:[], quests:[], spells:[], maps:[], worldEvents:[], shops:[], lootTables:[] }));
    const db = new ContentDB(file);
    assert.equal(db.data.version, 2);
    assert.equal(db.get('items').length, 0);
    db.add('items', { id:'admin_only_item', name:'Admin Only' });
    const restarted = new ContentDB(file);
    assert.equal(restarted.get('items').length, 1);
    assert.equal(restarted.get('items')[0].id, 'admin_only_item');
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});

test('regional quartermasters satisfy authoritative shop proximity by merchant role', () => {
  const { db, dir } = tempDb();
  try {
    const npc = db.get('npcs').find(entry => entry.id === 'merchant_frostpeak');
    assert.ok(npc);
    const player = { mapId:npc.mapId, x:npc.posX, y:npc.posY };
    const result = officialActionGateway.serviceProximity(player, 'shop_buy', db.get('npcs'));
    assert.equal(result.ok, true);
    assert.equal(result.npc.id, 'merchant_frostpeak');
    assert.equal(officialActionGateway.serviceProximity({ ...player, x:1, y:1 }, 'shop_buy', db.get('npcs')).ok, false);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});
'''
write(p, s)

# Release-facing documentation.
p = 'README.md'
s = read(p)
needle = "## ✨ Principais Funcionalidades"
section = """## 🚀 Mor'ia 9.1 — Alpha Content Expansion

A linha 9.1 adiciona uma base de lançamento alpha orientada a conteúdo: **11 mapas** (10 regiões públicas + **Astra Sanctum, a Ilha dos GMs**), mais de **70 itens**, mais de **70 monstros**, mais de **40 NPCs**, mais de **45 quests**, novos feitiços para as 14 vocações, eventos regionais, lojas e loot tables autoritativas.

Todo esse conteúdo é materializado no ContentDB e pode ser criado/editado/removido pelo `/admin`. Servidores 9.0 existentes migram uma única vez para a base 9.1 preservando valores já personalizados pelo admin. A Ilha GM usa acesso `gm` validado no servidor pela lista **GM Roster** do próprio Admin.

"""
s = replace_once(s, needle, section + needle, 'README 9.1 section')
write(p, s)

p = 'server/README.md'
s = read(p)
s = s.replace('# ⚔ Mor\'ia MMO Server — Production Edition 6.2', '# ⚔ Mor\'ia MMO Server — Alpha Edition 9.1', 1)
s = replace_once(s,
"- Conteúdo data-driven com painel administrativo e validação de referências.",
"- Conteúdo data-driven com painel administrativo e validação de referências.\n- Alpha 9.1: 11 mapas, conteúdo regional 1–60, shops/loot tables editáveis e Ilha GM com roster server-side.", 'Server README state')
s = replace_once(s,
"- Mapas permanecem catálogo read-only enquanto o runtime autoritativo de terreno/portais continuar pertencendo a `World.mjs`.",
"- Catálogos editáveis: items, monsters, NPCs, spells, quests, maps, events, shops, loot tables e GM roster. Mapas publicados reconstroem o runtime determinístico; referências inválidas são bloqueadas antes da persistência.", 'Server README admin')
write(p, s)

p = 'docs/MORIA_9_1_ALPHA_CONTENT.md'
s = read(p)
s += "\n## Upgrade de servidores 9.0\nBancos ContentDB v1 já populados são migrados uma única vez para v2. Registros existentes do admin têm precedência sobre defaults alpha; após a migração, edições e exclusões persistem normalmente entre reinícios. Bancos v1 intencionalmente vazios permanecem vazios e apenas recebem o marcador de schema v2.\n\n## Quartermasters regionais\nA proximidade de `shop_buy` agora aceita qualquer NPC autoritativo com `role: merchant`, então os quartermasters criados pelo Studio são serviços reais, sem abrir compra remota.\n"
write(p, s)

print('9.1 migration and merchant hardening applied')
