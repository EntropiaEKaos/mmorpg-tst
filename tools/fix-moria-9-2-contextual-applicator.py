from pathlib import Path

path = Path(__file__).resolve().parent / 'apply-moria-9-2-day-night-contextual-skills.py'
text = path.read_text(encoding='utf-8')
old = 'night_pattern = re.compile(r"      // Day/night overlay.*?ctx\\.restore\\(\\);", re.S)'
new = 'night_pattern = re.compile(r"    // Day/night cycle overlay \\(with override\\).*?    \\}\\n(?=\\n    drawWorldAtmosphere)", re.S)'
if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise SystemExit('contextual applicator day/night regex anchor missing')
path.write_text(text, encoding='utf-8')
print('contextual applicator day/night regex fixed')
