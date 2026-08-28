from pathlib import Path

p=Path('src/game/render.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("drawClassicNpcSprite(ctx, cx, cy, size, { ...npc, name: translateGameText(npc.name), role: translateGameText(npc.role) }, time);","drawClassicNpcSprite(ctx, cx, cy, size, { ...npc, role: translateGameText(npc.role) }, time);")
p.write_text(s,encoding='utf-8')

p=Path('src/i18n/index.ts')
s=p.read_text(encoding='utf-8')
s=s.replace("text = text.replaceAll(`{${key}}`, String(value));","text = text.split(`{${key}}`).join(String(value));")
p.write_text(s,encoding='utf-8')

p=Path('server/test/i18n-character-9-28.test.mjs')
s=p.read_text(encoding='utf-8')
s=s.replace("  assert.match(src, /translateGameText\\(npc\\.name\\)/);","  assert.match(src, /translateGameText\\(npc\\.role\\)/);")
p.write_text(s,encoding='utf-8')
print('9.28 TypeScript compatibility fixes applied')
