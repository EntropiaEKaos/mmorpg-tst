from pathlib import Path

# Replace the brittle old table block by structural line anchors so the main
# applicator can remain idempotent regardless of escaped quote representation.
p = Path('server/adminPanel.mjs')
s = p.read_text()
if "onclick=\"editRow(' + index + ')\"" not in s:
    lines = s.splitlines()
    start = next((i for i, line in enumerate(lines) if "for (const f of fields.slice(0, 6)) html += '<th>' + f + '</th>';" in line), None)
    if start is None:
        raise SystemExit('table start anchor not found')
    end = next((i for i in range(start, len(lines)) if "button class=\"btn btn-red\"" in lines[i] and "item.id" in lines[i]), None)
    if end is None:
        raise SystemExit('table end anchor not found')
    # Include the closing brace of the old for (const item of items) loop.
    if end + 1 >= len(lines) or lines[end + 1].strip() != '}':
        raise SystemExit('table loop closing brace not found')
    replacement = [
        "    for (const f of fields.slice(0, 6)) html += '<th>' + escapeHtml(f) + '</th>';",
        "    html += '<th>Actions</th></tr></thead><tbody>';",
        "    for (let index = 0; index < items.length; index++) {",
        "      const item = items[index];",
        "      html += '<tr>';",
        "      for (const f of fields.slice(0, 6)) {",
        "        html += '<td>' + escapeHtml(displayValue(item?.[f])) + '</td>';",
        "      }",
        "      html += '<td><button class=\"btn btn-blue\" onclick=\"editRow(' + index + ')\">Edit</button> ';",
        "      html += '<button class=\"btn btn-red\" onclick=\"deleteRow(' + index + ')\">🗑</button></td></tr>';",
        "    }",
    ]
    lines[start:end + 2] = replacement
    p.write_text('\n'.join(lines) + '\n')

# Avoid embedding a nested JavaScript template literal inside the server-side
# template string returned by adminPanelHTML().
p = Path('tools/apply-admin-ui-hardening-4-0.py')
s = p.read_text()
s = s.replace("`Admin API failed (${res.status})`", "'Admin API failed (' + res.status + ')'" )
p.write_text(s)
print('admin UI 4.0 prepass applied')
