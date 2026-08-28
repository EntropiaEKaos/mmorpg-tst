from pathlib import Path

p=Path('tools/upgrade-moria-9-40b-shadowfen-visual-proof.py')
text=p.read_text(encoding='utf-8')
if text.endswith("\n'''\n"):
    text=text[:-4]
elif text.endswith("\n'''"):
    text=text[:-3]
p.write_text(text,encoding='utf-8')
