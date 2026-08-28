from pathlib import Path

root = Path(__file__).resolve().parents[1]

avatar_path = root / 'src/game/playerAvatar.ts'
avatar = avatar_path.read_text(encoding='utf-8')
avatar = avatar.replace('function drawPixelMount(', 'function drawMount(')
avatar = avatar.replace('drawPixelMount(ctx,', 'drawMount(ctx,')
avatar_path.write_text(avatar, encoding='utf-8')

test_path = root / 'server/test/reference-visual-9-7.test.mjs'
test = test_path.read_text(encoding='utf-8')
test = test.replace(
    "  assert.match(render, /Dense warm cobble/);",
    "  assert.match(render, /const cellH = Math\\.max\\(4, Math\\.round\\(s \\/ 6\\)\\)/);\n  assert.match(render, /#a79270/);"
)
test_path.write_text(test, encoding='utf-8')

print("Mor'ia 9.7 legacy visual contracts preserved")
