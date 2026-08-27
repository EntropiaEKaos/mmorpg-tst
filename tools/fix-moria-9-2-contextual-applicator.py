from pathlib import Path

path = Path(__file__).resolve().parent / 'apply-moria-9-2-day-night-contextual-skills.py'
text = path.read_text(encoding='utf-8')

replacements = [
    (
        'night_pattern = re.compile(r"      // Day/night overlay.*?ctx\\.restore\\(\\);", re.S)',
        'night_pattern = re.compile(r"    // Day/night cycle overlay \\(with override\\).*?    \\}\\n(?=\\n    drawWorldAtmosphere)", re.S)',
        'day/night regex',
    ),
    (
        'needle = "  if (profile.vignette > 0) {"',
        'needle = "  const vignette = ctx.createRadialGradient("',
        'worldAtmosphere vignette',
    ),
]

for old, new, label in replacements:
    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise SystemExit(f'contextual applicator {label} anchor missing')

path.write_text(text, encoding='utf-8')
print('contextual applicator anchors fixed for current 9.2 client')
