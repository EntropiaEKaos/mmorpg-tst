from pathlib import Path

root = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one anchor, found {count}')
    return text.replace(old, new, 1)


# -------------------------------------------------------------------
# GameScreen: enlarge world, overlay HUD, and feed mana to nameplates.
# -------------------------------------------------------------------
screen_path = root / 'src/components/GameScreen.tsx'
screen = screen_path.read_text(encoding='utf-8')
screen = replace_once(screen, 'const VIEW_W = 19;\nconst VIEW_H = 13;', 'const VIEW_W = 31;\nconst VIEW_H = 19;', 'viewport size')
screen = replace_once(
    screen,
    '      <div className="flex-1 flex overflow-hidden">\n        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#03060a]">',
    '      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#03060a]">',
    'fixed sidebar shell',
)
screen = replace_once(
    screen,
    '        </div>\n\n        <HUD player={player} tick={hudTick} spells={spells} onCastSpell={castSpell} monsters={monstersRef.current} official={serverSync.isActive() ? officialState : null} />\n      </div>\n\n    </div>',
    '          <HUD player={player} tick={hudTick} spells={spells} onCastSpell={castSpell} monsters={monstersRef.current} official={serverSync.isActive() ? officialState : null} />\n      </div>\n\n    </div>',
    'HUD overlay placement',
)
screen = replace_once(screen, '          <canvas\n            ref={canvasRef}', '          <canvas\n            className="moria-world-canvas"\n            ref={canvasRef}', 'world canvas class')
screen = replace_once(
    screen,
    "              maxWidth: '100%',\n              maxHeight: '100%',",
    "              width: '100%',\n              height: '100%',",
    'canvas fill sizing',
)
screen = replace_once(screen, "              borderRadius: '16px',", "              borderRadius: '0',", 'canvas radius')
screen = replace_once(
    screen,
    "              boxShadow: '0 28px 90px rgba(0,0,0,0.58), 0 0 0 1px rgba(164,184,216,0.10), 0 0 55px rgba(110,168,255,0.05)',",
    "              boxShadow: 'none',",
    'canvas shadow',
)
screen = replace_once(
    screen,
    '      <div className="moria-panel relative z-40 flex min-h-12 shrink-0 items-center gap-3 rounded-none border-x-0 border-t-0 px-3 py-1.5 text-xs">',
    '      <div className="moria-panel moria-topbar-95 relative z-40 flex min-h-12 shrink-0 items-center gap-3 rounded-none border-x-0 border-t-0 px-3 py-1.5 text-xs">',
    'topbar class',
)
screen = replace_once(
    screen,
    "    drawPlayer(ctx, px, py, TILE_SIZE, p.direction, p.name, p.hp, p.maxHp, now,\n      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon, p.appearance?.public, mount);",
    "    drawPlayer(ctx, px, py, TILE_SIZE, p.direction, p.name, p.hp, p.maxHp, now,\n      vocation?.color ?? '#8b2e2e', p.mounted, mount?.icon, p.appearance?.public, mount, p.mana, p.maxMana);",
    'local player mana',
)
screen = replace_once(
    screen,
    "        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, op.mount?.icon, op.appearance, op.mount);",
    "        drawPlayer(ctx, sx, sy, TILE_SIZE, op.direction || 'down', `${op.name} [Lv${op.level}]`, op.hp, op.maxHp, now, voc?.color || '#8b2e2e', op.mounted, op.mount?.icon, op.appearance, op.mount, Number(op.mana) || 0, Number(op.maxMana) || 0);",
    'authoritative player mana',
)
screen_path.write_text(screen, encoding='utf-8')


# -------------------------------------------------------------------
# Player avatar: classic overhead name + HP + mana stack.
# -------------------------------------------------------------------
avatar_path = root / 'src/game/playerAvatar.ts'
avatar = avatar_path.read_text(encoding='utf-8')
avatar = replace_once(
    avatar,
    '  appearance?: AvatarAppearance | null,\n  mount?: AvatarMount | null,\n) {',
    '  appearance?: AvatarAppearance | null,\n  mount?: AvatarMount | null,\n  mana = 0,\n  maxMana = 0,\n) {',
    'avatar mana signature',
)
old_status = '''  // Nameplate.\n  ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';\n  ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 3; ctx.strokeText(name, cx, y - 2);\n  ctx.fillStyle = '#f4e04d'; ctx.fillText(name, cx, y - 2);\n\n  // HP bar.\n  const hpBarW = size * 0.9, hpBarH = 3, hpX = cx - hpBarW / 2, hpY = y + size - 6;\n  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(hpX - 1, hpY - 1, hpBarW + 2, hpBarH + 2);\n  ctx.fillStyle = '#3a1a1a'; ctx.fillRect(hpX, hpY, hpBarW, hpBarH);\n  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));\n  ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';\n  ctx.fillRect(hpX, hpY, hpBarW * hpPct, hpBarH);\n  ctx.restore();'''
new_status = '''  // Classic overhead status stack: name, health and mana all stay above the sprite.\n  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));\n  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));\n  const barW = Math.max(30, size * 1.05);\n  const barH = 5;\n  const barX = Math.round(cx - barW / 2);\n  const hpBarY = Math.round(y - 14);\n  const manaBarY = Math.round(y - 8);\n\n  ctx.textAlign = 'center';\n  ctx.textBaseline = 'alphabetic';\n  ctx.font = 'bold 10px monospace';\n  ctx.strokeStyle = 'rgba(0,0,0,0.95)';\n  ctx.lineWidth = 3;\n  ctx.strokeText(name, cx, y - 18);\n  ctx.fillStyle = '#f4e6bd';\n  ctx.fillText(name, cx, y - 18);\n\n  ctx.fillStyle = '#080808';\n  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);\n  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);\n  ctx.fillStyle = '#4b1115';\n  ctx.fillRect(barX, hpBarY, barW, barH);\n  ctx.fillStyle = '#b91f32';\n  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);\n  ctx.fillStyle = '#10274d';\n  ctx.fillRect(barX, manaBarY, barW, barH);\n  ctx.fillStyle = '#226bc5';\n  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);\n\n  if (size >= 30) {\n    ctx.font = 'bold 6px monospace';\n    ctx.textBaseline = 'middle';\n    ctx.fillStyle = '#fff7ef';\n    ctx.fillText(`${Math.max(0, Math.round(hp))}/${Math.max(0, Math.round(maxHp))}`, cx, hpBarY + 2.5);\n    ctx.fillStyle = '#dbeeff';\n    ctx.fillText(`${Math.max(0, Math.round(mana))}/${Math.max(0, Math.round(maxMana))}`, cx, manaBarY + 2.5);\n  }\n  ctx.restore();'''
avatar = replace_once(avatar, old_status, new_status, 'avatar status stack')
avatar_path.write_text(avatar, encoding='utf-8')


# -------------------------------------------------------------------
# Renderer: route NPC/monster bodies through crisp pixel silhouettes.
# -------------------------------------------------------------------
render_path = root / 'src/game/render.ts'
render = render_path.read_text(encoding='utf-8')
render = replace_once(
    render,
    "import { drawAvatar, type AvatarAppearance, type AvatarMount } from './playerAvatar';",
    "import { drawAvatar, type AvatarAppearance, type AvatarMount } from './playerAvatar';\nimport { drawClassicMonsterSprite, drawClassicNpcSprite } from './classicEntityPresentation';",
    'classic entity import',
)
render = replace_once(
    render,
    '  appearance?: AvatarAppearance | null,\n  mount?: AvatarMount | null,\n) {\n  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount);',
    '  appearance?: AvatarAppearance | null,\n  mount?: AvatarMount | null,\n  mana = 0,\n  maxMana = 0,\n) {\n  drawAvatar(ctx, x, y, size, direction, name, hp, maxHp, time, vocationColor, mounted, mountIcon, appearance, mount, mana, maxMana);',
    'drawPlayer mana signature',
)
monster_body = '''  // Body\n  ctx.fillStyle = monster.color;\n  ctx.beginPath();\n  ctx.arc(cx, cy, entitySize * 0.35, 0, Math.PI * 2);\n  ctx.fill();\n\n  // Highlight\n  ctx.fillStyle = 'rgba(255,255,255,0.15)';\n  ctx.beginPath();\n  ctx.arc(cx - entitySize * 0.12, cy - entitySize * 0.12, entitySize * 0.15, 0, Math.PI * 2);\n  ctx.fill();\n\n  // Emoji\n  ctx.font = `${entitySize * 0.55}px system-ui`;\n  ctx.textAlign = 'center';\n  ctx.textBaseline = 'middle';\n  ctx.fillText(monster.emoji, cx, cy + 1);'''
render = replace_once(render, monster_body, '  drawClassicMonsterSprite(ctx, cx, cy, entitySize, monster, time);', 'monster bubble renderer')
npc_body = '''  ctx.fillStyle = npc.color;\n  ctx.beginPath();\n  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);\n  ctx.fill();\n\n  const pulse = 0.5 + Math.sin(time / 300) * 0.3;\n  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.2})`;\n  ctx.beginPath();\n  ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);\n  ctx.fill();\n\n  ctx.font = `${size * 0.5}px system-ui`;\n  ctx.textAlign = 'center';\n  ctx.textBaseline = 'middle';\n  ctx.fillText(npc.emoji, cx, cy + 1);'''
render = replace_once(render, npc_body, '  drawClassicNpcSprite(ctx, cx, cy, size, npc, time);', 'NPC bubble renderer')
render = replace_once(
    render,
    'export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {\n  buildTileCache(size);',
    'export function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {\n  ctx.imageSmoothingEnabled = false;\n  buildTileCache(size);',
    'pixelated tile renderer',
)
render_path.write_text(render, encoding='utf-8')


# -------------------------------------------------------------------
# HUD styling: original Mor'ia bronze frame / classic MMO geometry.
# -------------------------------------------------------------------
css_path = root / 'src/index.css'
css = css_path.read_text(encoding='utf-8')
marker = '/* Mor\'ia 9.5 — movable classic HUD */'
if marker not in css:
    css += r'''

/* Mor'ia 9.5 — movable classic HUD */
.moria-topbar-95 {
  background: linear-gradient(180deg, #17140e 0%, #090a0b 58%, #050607 100%);
  border-bottom: 2px solid #72572d;
  box-shadow: 0 2px 0 #1a1208, 0 6px 18px rgba(0,0,0,.55), inset 0 1px rgba(255,226,160,.12);
  backdrop-filter: none;
}

.moria-world-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  background: #111;
}

.moria-hud-window {
  border: 1px solid #7b6035;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(15,17,18,.98), rgba(5,7,8,.985));
  box-shadow: 0 0 0 1px #171108, 0 4px 12px rgba(0,0,0,.72), inset 0 0 0 1px rgba(239,196,111,.045);
  color: #e9e0cf;
  backdrop-filter: none;
}

.moria-hud-window::before {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 2px;
  border: 1px solid rgba(228,183,100,.08);
}

.moria-hud-titlebar {
  cursor: grab;
  position: relative;
  z-index: 3;
  border-bottom: 1px solid #5f4828;
  background: linear-gradient(180deg, #242018, #0d0e0f 72%);
  box-shadow: inset 0 1px rgba(255,226,166,.09), inset 0 -1px rgba(0,0,0,.8);
}

.moria-hud-titlebar:active,
.moria-hud-dragging .moria-hud-titlebar { cursor: grabbing; }

.moria-hud-dragging {
  z-index: 80;
  box-shadow: 0 0 0 1px #b8904c, 0 12px 30px rgba(0,0,0,.78), 0 0 22px rgba(207,155,72,.12);
}

.moria-hud-cell {
  border: 1px solid #31291e;
  border-radius: 2px;
  background: linear-gradient(180deg, #161819, #090a0b);
  box-shadow: inset 0 1px rgba(255,255,255,.025), inset 0 -1px rgba(0,0,0,.8);
}

.moria-hotbar-window {
  max-width: calc(100vw - 16px);
}

.moria-hotbar-window > div:last-child {
  overflow-x: auto;
  scrollbar-width: thin;
}

.moria-hotbar-grid {
  width: max-content;
  min-width: 100%;
}

.moria-hotbar-slot {
  border: 1px solid #5a4728;
  border-radius: 2px;
  background:
    radial-gradient(circle at 50% 34%, rgba(255,255,255,.045), transparent 42%),
    linear-gradient(180deg, #17191a, #070809);
  box-shadow: inset 0 0 0 1px #080706, inset 0 1px rgba(255,222,151,.08), 0 1px 2px rgba(0,0,0,.8);
  transition: border-color 100ms ease, filter 100ms ease;
}

.moria-hotbar-slot:hover:not(:disabled) {
  border-color: #c49a50;
  filter: brightness(1.12);
}

@media (max-width: 1100px) {
  .moria-hotbar-slot { width: 56px !important; height: 56px !important; }
  .moria-hotbar-window { max-width: calc(100vw - 8px); }
}
'''
css_path.write_text(css, encoding='utf-8')

print('Mor\'ia 9.5 HUD/world presentation materialized')
