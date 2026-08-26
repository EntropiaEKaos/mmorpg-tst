from pathlib import Path

p = Path('src/components/GameScreen.tsx')
s = p.read_text()
marker = "const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe'];"
quest_marker = 'function serverQuestToClient(raw: any): Quest | null {'

positions = []
start = 0
while True:
    idx = s.find(marker, start)
    if idx < 0:
        break
    positions.append(idx)
    start = idx + len(marker)

if len(positions) > 1:
    # The applicator inserts its helper block immediately before serverQuestToClient.
    # Preserve the first pre-existing canonical block and remove every later duplicate.
    while s.count(marker) > 1:
        second = s.find(marker, s.find(marker) + len(marker))
        end = s.find(quest_marker, second)
        if second < 0 or end < 0:
            raise SystemExit('unable to locate duplicate spell helper boundary')
        s = s[:second] + s[end:]

p.write_text(s)
print('authoritative spell helpers deduplicated')
