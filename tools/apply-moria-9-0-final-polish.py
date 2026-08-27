from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / 'server/server.js'
PANEL = ROOT / 'server/adminPanel.mjs'
README = ROOT / 'README.md'
TEST = ROOT / 'server/test/release-9-0.test.mjs'
DOC = ROOT / 'docs/MORIA_9_0_RELEASE.md'


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)

# ------------------------------------------------------------------
# Server: declarative Studio schema + semantic validation.
# ------------------------------------------------------------------
server = SERVER.read_text(encoding='utf-8')
server = replace_once(server,
"//  ⚔  MOR'IA MMO — AUTHORITATIVE SERVER v3.2 AUTH HARDENED",
"//  ⚔  MOR'IA MMO — AUTHORITATIVE SERVER v9.0 RELEASE",
'server version banner')
server = replace_once(server,
"import { validateContentReferences, findBlockingContentReferences, auditContentReferences } from './engine/ContentIntegrity.mjs';",
"import { validateContentReferences, findBlockingContentReferences, auditContentReferences } from './engine/ContentIntegrity.mjs';\nimport { getContentStudioSchema, validateStudioRecord, collectContentDiagnostics } from './engine/ContentStudio.mjs';",
'ContentStudio import')

server = replace_once(server,
'''    if (type === 'integrity') {
      const audit = auditContentReferences(contentDB);
      return json(res, 200, { ...audit, onlinePlayers: engine.getOnlineCount(), runtimeMaps: WORLD.getMapIds().length, contentVersion: contentDB.data.version });
    }''',
'''    if (type === 'integrity') {
      const referenceAudit = auditContentReferences(contentDB);
      const semanticAudit = collectContentDiagnostics(contentDB);
      const warnings = referenceAudit.issues.filter(issue => issue.severity === 'warning');
      return json(res, 200, {
        healthy: referenceAudit.healthy && semanticAudit.ok,
        errors: semanticAudit.issues.length,
        warnings: warnings.length,
        issues: [...semanticAudit.issues, ...warnings],
        counts: referenceAudit.counts,
        onlinePlayers: engine.getOnlineCount(), runtimeMaps: WORLD.getMapIds().length, contentVersion: contentDB.data.version,
      });
    }''', 'integrity canonical diagnostics')

fields_start = '''    const fieldsMap = {
      items: ['id','name','icon','slot','attack','defense','armor','hp','mana','magic','critChance','lifesteal','thorns','moveSpeed','xpBonus','goldBonus','damageReduction','rarity','level','value','description'],
      monsters: ['id','name','emoji','hp','attack','defense','xp','level','type','color','size','goldMin','goldMax','mapId','count','posX','posY','speed'],
      npcs: ['id','name','emoji','color','role','posX','posY','mapId','dialogue'],
      spells: ['id','name','icon','mana','cooldown','damage','range','color','type','vocation','levelRequired','buffType','buffDuration','buffValue','scalingCoeff'],
      quests: ['id','name','npcId','description','target','count','rewardGold','rewardXp','levelRequired','requires'],
      maps: ['id','name','biome','description','levelRequired','seed','spawnX','spawnY','townX','townY','townRange','portals'],
      events: ['id','name','icon','description','target','count','rewardGold','rewardXp','rewardCoins','mapId','durationMs'],
    };
    const readOnly = READ_ONLY_ADMIN_TYPES.has(type);
    const runtimeNotes = {
      maps: 'Authoritative runtime: edits regenerate deterministic terrain and synchronize the live world. Built-in maps cannot be deleted.',
      monsters: 'Monsters with mapId are reconciled into the live authoritative world immediately. Empty mapId keeps a catalog-only template.',
      items: 'Item edits feed the authoritative loot pool immediately; advanced combat bonuses are supported by the live derived-stat engine.',
      spells: 'Spell edits are merged into the authoritative vocation spell lists and broadcast to connected clients.',
      quests: 'Quest references and prerequisites are validated before save. NPC and prerequisite deletion remains reference-protected.',
      npcs: 'NPC map references are validated and content is broadcast immediately to connected clients.',
      events: 'World-event edits are synchronized into the authoritative event engine immediately.',
    };
    const runtimeNote = runtimeNotes[type] || '';
    const items = type === 'maps' ? WORLD.getDefinitions() : contentDB.get(type);
    return json(res, 200, { items, fields: fieldsMap[type] || [], readOnly, runtimeNote });'''
fields_new = '''    const readOnly = READ_ONLY_ADMIN_TYPES.has(type);
    const studio = getContentStudioSchema(type, contentDB);
    const items = type === 'maps' ? WORLD.getDefinitions() : contentDB.get(type);
    return json(res, 200, { items, ...studio, readOnly });'''
server = replace_once(server, fields_start, fields_new, 'declarative Studio schema')

server = replace_once(server,
'''      const existing = contentDB.get(type).find(i => i.id === data.id);
      const candidate = existing ? { ...existing, ...data, id: data.id } : { ...data, id: data.id };
      const referenceError = validateContentReferences(contentDB, type, candidate);''',
'''      const existing = contentDB.get(type).find(i => i.id === data.id);
      const candidate = existing ? { ...existing, ...data, id: data.id } : { ...data, id: data.id };
      const semanticError = validateStudioRecord(type, candidate);
      if (semanticError) return json(res, 400, { error: semanticError });
      const referenceError = validateContentReferences(contentDB, type, candidate);''', 'semantic write validation')
SERVER.write_text(server, encoding='utf-8')

# ------------------------------------------------------------------
# Studio UI consumes declarative field metadata/options from server.
# ------------------------------------------------------------------
panel = PANEL.read_text(encoding='utf-8')
panel = replace_once(panel,
'''    const items = Array.isArray(data.items) ? data.items : [];
    const fields = Array.isArray(data.fields) ? data.fields : [];
    const readOnly = data.readOnly === true;''',
'''    const items = Array.isArray(data.items) ? data.items : [];
    const fields = Array.isArray(data.fields) ? data.fields : [];
    const schema = Array.isArray(data.schema) ? data.schema : [];
    const schemaByField = new Map(schema.map(entry => [entry.id, entry]));
    const options = data.options && typeof data.options === 'object' ? data.options : {};
    const readOnly = data.readOnly === true;''', 'Studio schema client state')

old_loop = '''      for (const f of fields) {
        html += '<div><label>' + escapeHtml(f) + '</label>';
        if (f === 'type' || f === 'buffType' || f === 'rarity' || f === 'slot' || f === 'role' || f === 'biome' || f === 'vocation' || f === 'mapId') {
          html += '<input value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '" list="' + f + '_list">';
          html += '<datalist id="' + f + '_list">' + (f==='type' && currentTab==='spells'?'<option>attack<option>heal<option>aoe<option>buff':'') + (f==='buffType'?'<option>shield<option>haste<option>invisible<option>frenzy':'') + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='role'?'<option>merchant<option>banker<option>innkeeper<option>trainer<option>guard':'') + (f==='biome'?'<option>plains<option>snow<option>swamp<option>desert<option>shadow':'') + (f==='vocation'?'<option>knight<option>paladin<option>sorcerer<option>druid<option>rogue<option>berserker<option>templar<option>ranger':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';
        } else if (f === 'portals' || f === 'requires') {
          html += '<textarea id="fld_' + f + '" rows="5">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';
        } else if (f === 'description' || f === 'dialogue') {
          html += '<textarea id="fld_' + f + '" rows="2">' + escapeHtml(item[f] ?? '') + '</textarea>';
        } else {
          html += '<input type="' + (typeof item[f] === 'number' ? 'number' : 'text') + '" value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '">';
        }
        html += '</div>';
      }'''
new_loop = '''      for (const f of fields) {
        const meta = schemaByField.get(f) || { id: f, label: f, kind: 'text' };
        html += '<div><label>' + escapeHtml(meta.label || f) + '</label>';
        if (meta.kind === 'select') {
          const values = Array.isArray(options[meta.optionKey]) ? options[meta.optionKey] : [];
          html += '<select id="fld_' + f + '">';
          if (meta.allowEmpty) html += '<option value=""></option>';
          const current = String(item[f] ?? '');
          if (current && !values.includes(current)) html += '<option selected value="' + escapeHtml(current) + '">' + escapeHtml(current) + '</option>';
          for (const value of values) html += '<option ' + (String(value) === current ? 'selected ' : '') + 'value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
          html += '</select>';
        } else if (meta.kind === 'json') {
          html += '<textarea id="fld_' + f + '" rows="5">' + escapeHtml(JSON.stringify(item[f] ?? [], null, 2)) + '</textarea>';
        } else if (meta.kind === 'textarea') {
          html += '<textarea id="fld_' + f + '" rows="2">' + escapeHtml(item[f] ?? '') + '</textarea>';
        } else {
          html += '<input type="' + (meta.kind === 'number' ? 'number' : 'text') + '" value="' + escapeHtml(item[f] ?? '') + '" id="fld_' + f + '">';
        }
        html += '</div>';
      }'''
panel = replace_once(panel, old_loop, new_loop, 'schema-driven editor controls')
PANEL.write_text(panel, encoding='utf-8')

# ------------------------------------------------------------------
# Retire one-shot migration debt that should not ship in 9.0.
# ------------------------------------------------------------------
for relative in [
    '.github/workflows/apply-content-expansion-8-0.yml',
    'tools/apply-content-expansion-8-0.py',
    'tools/apply-mvp-complete-6-0.py',
    'tools/apply-mvp-complete-6-1.py',
    'tools/fix-mvp-complete-6-0.py',
    'tools/fix-mvp-complete-6-1.py',
]:
    path = ROOT / relative
    if path.exists(): path.unlink()

# ------------------------------------------------------------------
# Release documentation and regression checks.
# ------------------------------------------------------------------
readme = README.read_text(encoding='utf-8')
marker = "---\n\n## ✨ Principais Funcionalidades"
release = """---

## ✅ Mor'ia 9.0 — Linha Validada

A linha 9.0 consolida o servidor autoritativo e as evoluções 8.x: combate com feedback visual sem transferir autoridade ao cliente, regiões vivas, itemização procedural server-side, social persistente com ignore autoritativo e um Content Studio com diagnóstico de integridade e validação semântica antes da publicação.

O gate oficial de qualidade executa `npm audit`, TypeScript, build de produção, syntax check do servidor e a suíte server-side completa em Node.js 22. O painel `/admin` exige autenticação administrativa quando exposto fora de localhost; configure `ADMIN_TOKEN` em produção.

---

## ✨ Principais Funcionalidades"""
if '## ✅ Mor\'ia 9.0 — Linha Validada' not in readme:
    readme = replace_once(readme, marker, release, 'README 9.0 release section')
README.write_text(readme, encoding='utf-8')

TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContentStudioSchema, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { contentDB } from '../engine/ContentDB.mjs';
import { adminPanelHTML } from '../adminPanel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('9.0 Studio schema is declarative, dynamic and covers every writable catalog', () => {
  for (const type of ['items','monsters','npcs','spells','quests','maps','events']) {
    const result = getContentStudioSchema(type, contentDB);
    assert.ok(result.fields.length > 0, `${type} must expose fields`);
    assert.equal(result.fields.length, result.schema.length);
    assert.ok(result.runtimeNote.length > 0);
  }
  const maps = getContentStudioSchema('npcs', contentDB).options.maps;
  assert.ok(maps.includes('eldoria'));
});

test('9.0 semantic validation rejects malformed power and coordinates before persistence', () => {
  assert.match(validateStudioRecord('items', { id: 'bad_item', name: 'Bad', slot: 'weapon', rarity: 'legendary', level: 1, value: 1, critChance: 500 }), /critChance/);
  assert.match(validateStudioRecord('monsters', { id: 'bad_monster', name: 'Bad', hp: 10, attack: 1, defense: 1, xp: 1, level: 1, type: 'normal', posX: -1, posY: 4 }), /posX/);
  assert.match(validateStudioRecord('spells', { id: 'bad_spell', name: 'Bad', mana: 1, cooldown: 100, damage: 1, range: 1, type: 'attack', vocation: 'knight', levelRequired: 1 }), /cooldown/);
});

test('9.0 Studio HTML consumes server schema instead of hard-coded editor choices', () => {
  const html = adminPanelHTML();
  assert.match(html, /schemaByField/);
  assert.match(html, /meta\.kind === 'select'/);
  assert.match(html, /options\[meta\.optionKey\]/);
});

test('9.0 release tree contains no retired one-shot 6.x or 8.0 applicators', () => {
  for (const relative of [
    '.github/workflows/apply-content-expansion-8-0.yml',
    'tools/apply-content-expansion-8-0.py',
    'tools/apply-mvp-complete-6-0.py',
    'tools/apply-mvp-complete-6-1.py',
    'tools/fix-mvp-complete-6-0.py',
    'tools/fix-mvp-complete-6-1.py',
  ]) assert.equal(fs.existsSync(path.join(root, relative)), false, `${relative} must be retired`);
});

test('9.0 server write path performs semantic validation before reference validation', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const semantic = source.indexOf('validateStudioRecord(type, candidate)');
  const references = source.indexOf('validateContentReferences(contentDB, type, candidate)');
  assert.ok(semantic > 0 && references > semantic);
  assert.match(source, /AUTHORITATIVE SERVER v9\.0 RELEASE/);
});
''', encoding='utf-8')

DOC.write_text("""# Mor'ia 9.0 — Final Polish / Release Candidate

## Consolidated line
Mor'ia 9.0 is based on the fully validated 8.6 line, preserving 8.4 authoritative itemization, 8.5 persistent friends/ignore enforcement and 8.6 Content Health.

## Studio hardening
- Content authoring schemas now live in `server/engine/ContentStudio.mjs`.
- The API and browser Studio consume the same field metadata and dynamic options.
- Semantic bounds are validated before cross-reference validation and before persistence.
- Content Health combines semantic diagnostics with non-blocking reference warnings.

## Repository cleanup
Retired one-shot 6.0, 6.1 and 8.0 migration/apply scripts and the obsolete 8.0 apply workflow. These migrations already landed and should not remain as production maintenance surface.

## Release gate
A release candidate is acceptable only after:
1. client `npm audit` reports zero vulnerabilities;
2. client TypeScript passes;
3. production client build passes;
4. server `npm audit` reports zero vulnerabilities;
5. server syntax check passes;
6. the complete server test suite passes;
7. normal branch CI passes on the resulting commit.
""", encoding='utf-8')

print("Mor'ia 9.0 final polish prepared")
