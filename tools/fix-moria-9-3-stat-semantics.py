from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'server/engine/ClassIdentity.mjs'
text = path.read_text(encoding='utf-8')
old = "  stats.totalDefense *= Number(identity.defenseMultiplier) || 1;\n"
if old not in text:
    raise SystemExit('class defense anchor missing')
text = text.replace(old, "  // Equipment defense keeps exact authored values; tanks specialize through damage reduction.\n", 1)
old = "  if (effect === 'heal' || effect === 'buff') multiplier = Number(identity.healPowerMultiplier) || multiplier;\n"
if old not in text:
    raise SystemExit('class spell support anchor missing')
text = text.replace(old, "  if (effect === 'buff') return 1; // Content-authored buff values remain exact.\n  if (effect === 'heal') multiplier = Number(identity.healPowerMultiplier) || multiplier;\n", 1)
path.write_text(text, encoding='utf-8')
print('9.3 class stat semantics aligned')
