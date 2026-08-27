from pathlib import Path

TEST = Path('server/test/official-combat-augmentation-domain.test.mjs')
text = TEST.read_text(encoding='utf-8')
replacements = {
    "  assert.equal(result.totalAttack, 110);": "  assert.ok(Math.abs(result.totalAttack - 110) < 1e-9);",
    "  assert.equal(result.totalAttack, 115);": "  assert.ok(Math.abs(result.totalAttack - 115) < 1e-9);",
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected one match for {old!r}, found {count}')
    text = text.replace(old, new, 1)
TEST.write_text(text, encoding='utf-8')
print('Foundation 7.12 floating point assertions hardened')
