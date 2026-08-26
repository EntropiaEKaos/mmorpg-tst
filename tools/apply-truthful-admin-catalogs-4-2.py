from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# API: Maps and Events remain readable catalogs, but mutations are rejected until
# they have a real authoritative runtime implementation.
p = Path('server/server.js')
s = p.read_text()
s = replace_once(s,
"const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events']);\n",
"const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events']);\nconst READ_ONLY_ADMIN_TYPES = new Set(['maps', 'events']);\n",
'read-only admin types')
s = replace_once(s,
"    return json(res, 200, { items: contentDB.get(type), fields: fieldsMap[type] || [] });\n",
"    const readOnly = READ_ONLY_ADMIN_TYPES.has(type);\n    const runtimeNote = type === 'maps'\n      ? 'Reference catalog only: authoritative terrain, portals and map lifecycle are still defined by World.mjs.'\n      : type === 'events'\n        ? 'Reference catalog only: online world-event runtime is not connected to ContentDB yet.'\n        : '';\n    return json(res, 200, { items: contentDB.get(type), fields: fieldsMap[type] || [], readOnly, runtimeNote });\n",
'admin GET runtime truth')
s = replace_once(s,
"  if (req.method === 'POST') {\n    return readJsonBody(req, res, data => {\n",
"  if (req.method === 'POST') {\n    if (READ_ONLY_ADMIN_TYPES.has(type)) {\n      return json(res, 409, { error: `${type} catalog is read-only until its authoritative runtime is connected` });\n    }\n    return readJsonBody(req, res, data => {\n",
'reject fake catalog writes')
s = replace_once(s,
"  if (req.method === 'DELETE' && id) {\n    if (!ALLOWED_ADMIN_TYPES.has(type)) return json(res, 404, { error: 'Unknown content type' });\n",
"  if (req.method === 'DELETE' && id) {\n    if (!ALLOWED_ADMIN_TYPES.has(type)) return json(res, 404, { error: 'Unknown content type' });\n    if (READ_ONLY_ADMIN_TYPES.has(type)) {\n      return json(res, 409, { error: `${type} catalog is read-only until its authoritative runtime is connected` });\n    }\n",
'reject fake catalog deletes')
p.write_text(s)

# Admin UI: render catalog note and remove mutation controls when API says read-only.
p = Path('server/adminPanel.mjs')
s = p.read_text()
s = replace_once(s,
"    const fields = Array.isArray(data.fields) ? data.fields : [];\n    renderedItems = items;\n    \n    let html = '<div class=\"card\"><h2>' + currentTab.toUpperCase() + ' (' + items.length + ')</h2>';\n",
"    const fields = Array.isArray(data.fields) ? data.fields : [];\n    const readOnly = data.readOnly === true;\n    renderedItems = items;\n    if (readOnly) editing = null;\n    \n    let html = '<div class=\"card\"><h2>' + currentTab.toUpperCase() + ' (' + items.length + ')</h2>';\n    if (readOnly) {\n      html += '<div class=\"catalog-note\"><strong>READ-ONLY CATALOG</strong><br>' + escapeHtml(data.runtimeNote || 'This catalog is not connected to the authoritative runtime yet.') + '</div>';\n    }\n",
'truthful read-only banner')
s = replace_once(s,
"    if (editing !== null) {\n",
"    if (!readOnly && editing !== null) {\n",
'disable read-only edit form')
s = replace_once(s,
"    html += '<button class=\"btn btn-amber\" onclick=\"editing=\\\\'new\\\\';render()\">➕ New ' + currentTab.replace(/s$/,'') + '</button>';\n",
"    if (!readOnly) html += '<button class=\"btn btn-amber\" onclick=\"editing=\\\\'new\\\\';render()\">➕ New ' + currentTab.replace(/s$/,'') + '</button>';\n",'disable read-only create')
s = replace_once(s,
"      html += '<td><button class=\"btn btn-blue\" onclick=\"editRow(' + index + ')\">Edit</button> ';\n      html += '<button class=\"btn btn-red\" onclick=\"deleteRow(' + index + ')\">🗑</button></td></tr>';\n",
"      if (readOnly) html += '<td><span class=\"readonly-label\">Catalog only</span></td></tr>';\n      else {\n        html += '<td><button class=\"btn btn-blue\" onclick=\"editRow(' + index + ')\">Edit</button> ';\n        html += '<button class=\"btn btn-red\" onclick=\"deleteRow(' + index + ')\">🗑</button></td></tr>';\n      }\n",'disable read-only row actions')
s = replace_once(s,
"  .stat .lbl { font-size:.8rem; color:#f4e04d80; }\n",
"  .stat .lbl { font-size:.8rem; color:#f4e04d80; }\n  .catalog-note { margin:0 0 1rem; padding:.8rem 1rem; border:1px solid #e6a81755; border-radius:6px; background:#e6a81712; color:#f7dda0; font-size:.8rem; line-height:1.45; }\n  .readonly-label { color:#f4e04d80; font-size:.75rem; font-weight:700; letter-spacing:.06em; }\n",
'read-only admin styles')
p.write_text(s)

# UI regression coverage. Use literal includes so HTML quoting cannot accidentally
# create an invalid JavaScript regular expression in the generated test.
p = Path('server/test/admin-panel.test.mjs')
s = p.read_text()
block = r'''

test('admin panel supports read-only catalogs without fake mutation controls', () => {
  const html = adminPanelHTML();
  assert.equal(html.includes('data.readOnly === true'), true);
  assert.equal(html.includes('READ-ONLY CATALOG'), true);
  assert.equal(html.includes("if (!readOnly) html += '<button class=\"btn btn-amber\""), true);
  assert.equal(html.includes("if (readOnly) html += '<td><span class=\"readonly-label\">Catalog only</span>"), true);
});
'''
if "read-only catalogs without fake mutation controls" not in s:
    s += block
p.write_text(s)

print('truthful admin catalogs 4.2 applied')
