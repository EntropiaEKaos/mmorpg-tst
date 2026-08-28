from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'{label} anchor not found')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')


reference = Path('server/test/reference-visual-9-7.test.mjs')
replace_once(reference, "  assert.match(designer, /DIRECT MANIPULATION/);", "  assert.match(designer, /DESIGNER DE CIDADE · EDIÇÃO DIRETA/);", '9.7 direct-manipulation label contract')
replace_once(reference, "  assert.match(designer, /SELECTED BUILDING/);", "  assert.match(designer, /CONSTRUÇÃO SELECIONADA/);", '9.7 selected-building label contract')

identity = Path('server/test/world-identity-9-6.test.mjs')
replace_once(identity, "  assert.match(designer, /APPLY TO WORLD/);", "  assert.match(designer, /APLICAR AO MUNDO/);", '9.6 apply-to-world label contract')

print("Mor'ia 9.35B.1 legacy City Designer label tests aligned with PT-BR presentation")
