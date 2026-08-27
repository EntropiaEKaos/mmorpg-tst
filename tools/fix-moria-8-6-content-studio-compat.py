from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / 'server/engine/ContentStudio.mjs'

source = STUDIO.read_text(encoding='utf-8')
old = """  if (type === 'events') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key, min, max] of [
      ['count',1,1_000_000], ['rewardGold',0,100_000_000], ['rewardXp',0,100_000_000], ['rewardCoins',0,1_000_000], ['durationMs',1_000,604_800_000],
    ]) { const error = numberIn(record, key, min, max, { required: true, integer: true }); if (error) return error; }
  }
"""
new = """  if (type === 'events') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key, min, max] of [
      ['count',1,1_000_000], ['rewardGold',0,100_000_000], ['rewardXp',0,100_000_000], ['rewardCoins',0,1_000_000],
    ]) { const error = numberIn(record, key, min, max, { required: true, integer: true }); if (error) return error; }
    const durationMs = record.durationMs !== undefined && record.durationMs !== null && record.durationMs !== ''
      ? Number(record.durationMs)
      : Number(record.duration) * 1000;
    if (!Number.isInteger(durationMs) || durationMs < 1_000 || durationMs > 604_800_000) return 'durationMs must be from 1000 to 604800000';
  }
"""
if old not in source:
    raise SystemExit('8.6 legacy event duration block not found')
STUDIO.write_text(source.replace(old, new, 1), encoding='utf-8')
print("Mor'ia 8.6 legacy event duration compatibility applied")
