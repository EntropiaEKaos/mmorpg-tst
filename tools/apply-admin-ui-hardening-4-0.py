from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

p = Path('server/adminPanel.mjs')
s = p.read_text()

for tab in ['dashboard', 'items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'players', 'broadcast']:
    s = s.replace(f'onclick="showTab(\'{tab}\')"', f'onclick="showTab(\'{tab}\', this)"')

s = replace_once(s,
'''  let currentTab = 'dashboard';\n  let editing = null;\n\n  async function api(method, path, body) {\n    const res = await fetch('/admin/api' + path, {\n      method, headers: {'Content-Type':'application/json'},\n      body: body ? JSON.stringify(body) : undefined\n    });\n    return res.json();\n  }\n\n  function showTab(tab) {\n    currentTab = tab; editing = null;\n    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));\n    event.target.classList.add('active');\n    render();\n  }\n''',
'''  let currentTab = 'dashboard';\n  let editing = null;\n  let renderedItems = [];\n\n  function escapeHtml(value) {\n    return String(value ?? '').replace(/[&<>"']/g, ch => ({\n      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'\n    })[ch]);\n  }\n\n  function displayValue(value) {\n    if (value && typeof value === 'object') {\n      try { return JSON.stringify(value).slice(0, 80); } catch { return '[object]'; }\n    }\n    return String(value ?? '');\n  }\n\n  async function api(method, path, body) {\n    const res = await fetch('/admin/api' + path, {\n      method, headers: {'Content-Type':'application/json'},\n      body: body ? JSON.stringify(body) : undefined\n    });\n    let payload = {};\n    try { payload = await res.json(); } catch {}\n    if (!res.ok) throw new Error(payload.error || `Admin API failed (${res.status})`);\n    return payload;\n  }\n\n  function showTab(tab, button) {\n    currentTab = tab; editing = null;\n    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));\n    if (button instanceof HTMLElement) button.classList.add('active');\n    render();\n  }\n\n  function editRow(index) {\n    const item = renderedItems[index];\n    if (!item || typeof item.id !== 'string') return;\n    editing = item.id;\n    render();\n  }\n\n  function deleteRow(index) {\n    const item = renderedItems[index];\n    if (!item || typeof item.id !== 'string') return;\n    del(item.id);\n  }\n''', 'safe admin helpers and explicit tab event')

s = replace_once(s,
'''  async function render() {\n    const el = document.getElementById('content');\n    const data = await api('GET', '/' + currentTab);\n    \n    if (currentTab === 'dashboard') {\n''',
'''  async function render() {\n    const el = document.getElementById('content');\n    try {\n      const data = await api('GET', '/' + currentTab);\n    \n    if (currentTab === 'dashboard') {\n''', 'render error boundary open')

s = replace_once(s,
'''    const items = data.items || [];\n    const fields = data.fields || [];\n''',
'''    const items = Array.isArray(data.items) ? data.items : [];\n    const fields = Array.isArray(data.fields) ? data.fields : [];\n    renderedItems = items;\n''', 'stable rendered items')

s = replace_once(s,
'''        html += '<div><label>' + f + '</label>';\n''',
'''        html += '<div><label>' + escapeHtml(f) + '</label>';\n''', 'escape field labels')

s = s.replace("html += '<input value=\"' + (item[f]||'') + '\" id=\"fld_' + f + '\" list=\"' + f + '_list\">';",
              "html += '<input value=\"' + escapeHtml(item[f] ?? '') + '\" id=\"fld_' + f + '\" list=\"' + f + '_list\">';")
s = s.replace("html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + (item[f]||'') + '</textarea>';",
              "html += '<textarea id=\"fld_' + f + '\" rows=\"2\">' + escapeHtml(item[f] ?? '') + '</textarea>';" )
s = s.replace("html += '<input type=\"' + (typeof item[f] === 'number' ? 'number' : 'text') + '\" value=\"' + (item[f]||'') + '\" id=\"fld_' + f + '\">';",
              "html += '<input type=\"' + (typeof item[f] === 'number' ? 'number' : 'text') + '\" value=\"' + escapeHtml(item[f] ?? '') + '\" id=\"fld_' + f + '\">';")

s = replace_once(s,
'''    for (const f of fields.slice(0, 6)) html += '<th>' + f + '</th>';\n    html += '<th>Actions</th></tr></thead><tbody>';\n    for (const item of items) {\n      html += '<tr>';\n      for (const f of fields.slice(0, 6)) {\n        let v = item[f] || '';\n        if (typeof v === 'object') v = JSON.stringify(v).slice(0,30);\n        html += '<td>' + v + '</td>';\n      }\n      html += '<td><button class="btn btn-blue" onclick="editing=\\'' + item.id + '\\';render()">Edit</button> ';\n      html += '<button class="btn btn-red" onclick="del(\\'' + item.id + '\\')">🗑</button></td></tr>';\n    }\n''',
'''    for (const f of fields.slice(0, 6)) html += '<th>' + escapeHtml(f) + '</th>';\n    html += '<th>Actions</th></tr></thead><tbody>';\n    for (let index = 0; index < items.length; index++) {\n      const item = items[index];\n      html += '<tr>';\n      for (const f of fields.slice(0, 6)) {\n        html += '<td>' + escapeHtml(displayValue(item?.[f])) + '</td>';\n      }\n      html += '<td><button class="btn btn-blue" onclick="editRow(' + index + ')">Edit</button> ';\n      html += '<button class="btn btn-red" onclick="deleteRow(' + index + ')">🗑</button></td></tr>';\n    }\n''', 'index-based safe table rendering')

s = replace_once(s,
'''    html += '</tbody></table></div>';\n    el.innerHTML = html;\n  }\n\n  async function saveItem() {\n''',
'''    html += '</tbody></table></div>';\n    el.innerHTML = html;\n    } catch (error) {\n      renderedItems = [];\n      el.textContent = error instanceof Error ? error.message : 'Failed to load admin data';\n    }\n  }\n\n  async function saveItem() {\n''', 'render error boundary close')

s = replace_once(s,
'''  async function del(id) {\n    if (!confirm('Delete this?')) return;\n    await api('DELETE', '/' + currentTab + '/' + id);\n    render();\n  }\n''',
'''  async function del(id) {\n    if (!confirm('Delete this?')) return;\n    try {\n      await api('DELETE', '/' + currentTab + '/' + encodeURIComponent(id));\n      editing = null;\n      render();\n    } catch (error) {\n      alert(error instanceof Error ? error.message : 'Delete failed');\n    }\n  }\n''', 'encoded safe delete')

s = replace_once(s,
'''    await api('POST', '/' + currentTab, body);\n    editing = null;\n    render();\n''',
'''    try {\n      await api('POST', '/' + currentTab, body);\n      editing = null;\n      render();\n    } catch (error) {\n      alert(error instanceof Error ? error.message : 'Save failed');\n    }\n''', 'admin save errors')

p.write_text(s)

# Static regression coverage for generated admin HTML.
p = Path('server/test/admin-panel.test.mjs')
p.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { adminPanelHTML } from '../adminPanel.mjs';

test('admin panel escapes persisted content and avoids raw IDs in inline handlers', () => {
  const html = adminPanelHTML();
  assert.match(html, /function escapeHtml\(value\)/);
  assert.match(html, /escapeHtml\(displayValue\(item\?\.\[f\]\)\)/);
  assert.match(html, /onclick="editRow\(' \+ index \+ '\)"/);
  assert.match(html, /onclick="deleteRow\(' \+ index \+ '\)"/);
  assert.match(html, /encodeURIComponent\(id\)/);
  assert.doesNotMatch(html, /event\.target/);
  assert.doesNotMatch(html, /editing=\\'' \+ item\.id/);
  assert.doesNotMatch(html, /del\(\\'' \+ item\.id/);
});

test('admin tab navigation passes the clicked element explicitly', () => {
  const html = adminPanelHTML();
  assert.match(html, /showTab\('dashboard', this\)/);
  assert.match(html, /function showTab\(tab, button\)/);
  assert.match(html, /button instanceof HTMLElement/);
});
''')

print('admin UI hardening 4.0 applied')
