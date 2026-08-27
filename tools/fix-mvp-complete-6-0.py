from pathlib import Path

p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = s.replace("💎 Earn Mor'ia Coins from hunts, dungeons, events and achievements, then spend them in the official Coin Shop.", "💎 Earn Moria Coins from hunts, dungeons, events and achievements, then spend them in the official Coin Shop.")
p.write_text(s)

p = Path('src/components/OfficialSystemsHub.tsx')
s = p.read_text()
s = s.replace("String(name).replaceAll('_', ' ')", "String(name).replace(/_/g, ' ')")
p.write_text(s)
print('MVP Complete 6.0 generated source normalized')
