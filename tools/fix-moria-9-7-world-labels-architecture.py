from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing marker: {label}')
    return text.replace(old, new, 1)

# Keep GameScreen as an orchestrator: the label module owns request construction too.
labels = read('src/game/worldNameplates.ts')
labels += r'''

export function createWorldLabelQueue(playerPos: { x: number; y: number }, targetId?: string | null) {
  const requests: WorldLabelRequest[] = [];
  return {
    npc(n: any, x: number, y: number, size: number) {
      requests.push({ kind: 'npc', x, y, size, distance: Math.hypot(n.pos.x - playerPos.x, n.pos.y - playerPos.y), entity: { name: n.name, role: n.role } });
    },
    monster(m: any, mx: number, my: number, x: number, y: number, size: number) {
      requests.push({ kind: 'monster', x, y, size, distance: Math.hypot(mx - playerPos.x, my - playerPos.y), targeted: targetId === m.id, entity: { name: m.name, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type } });
    },
    draw(ctx: CanvasRenderingContext2D, map?: Partial<GameMap> | null) { drawWorldNameplates(ctx, requests, map); },
  };
}
'''
write('src/game/worldNameplates.ts', labels)

game = read('src/components/GameScreen.tsx')
game = replace_once(game,
    "import { drawWorldNameplates, type WorldLabelRequest } from '../game/worldNameplates';",
    "import { createWorldLabelQueue } from '../game/worldNameplates';",
    'compact world label import')
game = replace_once(game,
    "    const worldLabelRequests: WorldLabelRequest[] = [];\n\n    // NPCs",
    "    const worldLabels=createWorldLabelQueue(p.pos,p.targetId);\n    // NPCs",
    'compact queue')
game = replace_once(game,
    "      worldLabelRequests.push({ kind: 'npc', x: sx, y: sy, size: TILE_SIZE, distance: Math.hypot(n.pos.x - p.pos.x, n.pos.y - p.pos.y), entity: { name: n.name, role: n.role } });",
    "      worldLabels.npc(n, sx, sy, TILE_SIZE);",
    'compact npc request')
game = replace_once(game,
    "      worldLabelRequests.push({ kind: 'monster', x: sx, y: sy, size: TILE_SIZE, distance: Math.hypot(mx - p.pos.x, my - p.pos.y), targeted: p.targetId === m.id, entity: { name: m.name, hp: m.hp, maxHp: m.maxHp, level: m.level, type: m.type } });",
    "      worldLabels.monster(m, mx, my, sx, sy, TILE_SIZE);",
    'compact monster request')
game = replace_once(game,
    "    // Nameplates are UI-over-world: draw after depth and atmosphere so labels remain\n    // readable, then globally resolve priority/collisions instead of overlapping blindly.\n    drawWorldNameplates(ctx, worldLabelRequests, MAPS[currentMapIdRef.current] || MAPS.eldoria);",
    "    worldLabels.draw(ctx, MAPS[currentMapIdRef.current]||MAPS.eldoria);",
    'compact draw')
write('src/components/GameScreen.tsx', game)

# Keep the legacy JSON fallback as an explicit compatibility boundary while the
# schema-driven path handles every current and future JSON editor field.
admin = read('server/adminPanel.mjs')
admin = replace_once(admin,
    "        if (meta.kind === 'json') {",
    "        if (meta.kind === 'json' || f === 'portals' || f === 'requires') {",
    'legacy json compatibility')
write('server/adminPanel.mjs', admin)

# Align the newly-added regression contract with the extracted queue API.
test = read('server/test/reference-visual-9-7.test.mjs')
test = replace_once(test,
    "  assert.match(screen, /drawWorldNameplates\\(ctx, worldLabelRequests/);",
    "  assert.match(screen, /createWorldLabelQueue\\(p\\.pos,p\\.targetId\\)/);",
    'world label regression assertion')
write('server/test/reference-visual-9-7.test.mjs', test)

print("Mor'ia 9.7 architecture budget and Studio compatibility fix applied.")
