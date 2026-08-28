from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
path = root / 'src/game/render.ts'
text = path.read_text(encoding='utf-8')

def replace_tile(name: str, body: str):
    global text
    pattern = re.compile(rf"  tileCache\.set\(`{re.escape(name)}_\$\{{size\}}`, createTileCanvas\(\(ctx, s\) => \{{.*?  \}}, size\)\);", re.S)
    if not pattern.search(text):
        raise SystemExit(f'missing tile block: {name}')
    text = pattern.sub(body.rstrip(), text, count=1)

replace_tile('tree', r'''  tileCache.set(`tree_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#355d2d';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));

    // Ground detail and tight pixel shadow.
    ctx.fillStyle = '#294d27';
    ctx.fillRect(u, s-u*2, s-u*2, u);
    ctx.fillStyle = 'rgba(20,24,16,.45)';
    ctx.fillRect(s/2-u*5, s-u*3, u*10, u*2);

    // Trunk, roots and bark highlights.
    ctx.fillStyle = '#2c1d13';
    ctx.fillRect(s/2-u*2, s-u*8, u*4, u*6);
    ctx.fillStyle = '#5f3d23';
    ctx.fillRect(s/2-u, s-u*8, u*2, u*6);
    ctx.fillStyle = '#8a5b31';
    ctx.fillRect(s/2-u, s-u*7, u, u*3);
    ctx.fillStyle = '#382418';
    ctx.fillRect(s/2-u*5, s-u*3, u*4, u);
    ctx.fillRect(s/2+u, s-u*3, u*4, u);

    // Stepped canopy clusters, intentionally no vector circles/gradients.
    ctx.fillStyle = '#132d1b';
    ctx.fillRect(s/2-u*7, u*5, u*14, u*7);
    ctx.fillRect(s/2-u*6, u*3, u*12, u*10);
    ctx.fillRect(s/2-u*4, u*2, u*8, u*11);
    ctx.fillStyle = '#214529';
    ctx.fillRect(s/2-u*6, u*4, u*5, u*5);
    ctx.fillRect(s/2+u, u*5, u*5, u*5);
    ctx.fillRect(s/2-u*3, u*2, u*6, u*5);
    ctx.fillStyle = '#35683a';
    ctx.fillRect(s/2-u*4, u*4, u*3, u*3);
    ctx.fillRect(s/2+u, u*3, u*3, u*3);
    ctx.fillRect(s/2-u, u*6, u*3, u*3);
    ctx.fillStyle = '#5b8a4c';
    ctx.fillRect(s/2-u*3, u*3, u*2, u*2);
    ctx.fillRect(s/2+u, u*4, u*2, u*2);
    ctx.fillStyle = '#86a85c';
    ctx.fillRect(s/2-u*2, u*3, u, u);
  }, size));''')

replace_tile('bush', r'''  tileCache.set(`bush_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#355d2d';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));
    ctx.fillStyle = 'rgba(20,24,16,.35)';
    ctx.fillRect(u*3, s-u*4, s-u*6, u*2);
    ctx.fillStyle = '#17341e';
    ctx.fillRect(u*2, u*6, s-u*4, u*7);
    ctx.fillRect(u*4, u*4, s-u*8, u*10);
    ctx.fillStyle = '#28542f';
    ctx.fillRect(u*3, u*6, u*5, u*4);
    ctx.fillRect(u*9, u*7, u*4, u*4);
    ctx.fillStyle = '#47783d';
    ctx.fillRect(u*5, u*5, u*3, u*3);
    ctx.fillRect(u*9, u*6, u*2, u*2);
    ctx.fillStyle = '#b74e55';
    ctx.fillRect(u*5, u*9, u, u);
    ctx.fillRect(u*10, u*8, u, u);
    ctx.fillStyle = '#e0c261';
    ctx.fillRect(u*7, u*7, u, u);
  }, size));''')

replace_tile('path', r'''  tileCache.set(`path_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#816b4f';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));
    for (let row = 0; row < 5; row++) {
      const yy = row * Math.max(u*3, Math.floor(s/5));
      const offset = row % 2 ? u*3 : 0;
      for (let xx = -offset; xx < s; xx += u*6) {
        const tone = hash(xx + row, row, 7) > .5 ? '#967b58' : '#755e45';
        ctx.fillStyle = '#5d4937';
        ctx.fillRect(xx, yy, u*5, u*3);
        ctx.fillStyle = tone;
        ctx.fillRect(xx+u, yy+u, u*4-1, u*2-1);
        ctx.fillStyle = 'rgba(226,199,151,.16)';
        ctx.fillRect(xx+u, yy+u, u*3, 1);
      }
    }
  }, size));''')

# Pixel-native monster rarity markers instead of smooth vector rings.
text = re.sub(
    r"  // Type indicator \(glow ring\)\n  if \(monster\.type === 'elite' \|\| monster\.type === 'boss'\) \{.*?\n  \}\n\n  drawClassicMonsterSprite",
    r'''  // Pixel-native rarity corners: readable without a vector glow halo.
  if (monster.type === 'elite' || monster.type === 'boss') {
    const marker = monster.type === 'boss' ? '#e2b64f' : '#c265ef';
    const m = Math.max(2, Math.round(size / 12));
    const r = entitySize * .40;
    ctx.fillStyle = marker;
    ctx.fillRect(cx-r, cy-r, m*3, m);
    ctx.fillRect(cx-r, cy-r, m, m*3);
    ctx.fillRect(cx+r-m*3, cy-r, m*3, m);
    ctx.fillRect(cx+r-m, cy-r, m, m*3);
  }

  drawClassicMonsterSprite''',
    text,
    count=1,
    flags=re.S,
)

# Remove on-world emoji role glyphs and modern system font from NPC labels.
text = re.sub(
    r"\n  const roleIcon =\n    npc\.role === 'merchant'.*?: '💬';\n\n  ctx\.font = 'bold 9px system-ui';",
    "\n  ctx.font = 'bold 9px monospace';",
    text,
    count=1,
    flags=re.S,
)
text = text.replace("ctx.strokeText(`${roleIcon} ${npc.name}`, cx, y - Math.round(size * 0.34));", "ctx.strokeText(npc.name, cx, y - Math.round(size * 0.34));")
text = text.replace("ctx.fillText(`${roleIcon} ${npc.name}`, cx, y - Math.round(size * 0.34));", "ctx.fillText(npc.name, cx, y - Math.round(size * 0.34));")
text = text.replace("ctx.font = 'bold 9px system-ui, sans-serif';", "ctx.font = 'bold 9px monospace';")

path.write_text(text, encoding='utf-8')
print("Mor'ia 9.7 pixel world refinement materialized")
