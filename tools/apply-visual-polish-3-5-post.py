from pathlib import Path

p = Path('src/components/GameScreen.tsx')
s = p.read_text()

# The pre-pass and main transform both know about crafting; retain exactly one import.
craft_import = "import { RECIPES, canCraft } from '../game/crafting';\n"
if s.count(craft_import) > 1:
    first = s.find(craft_import)
    before = s[: first + len(craft_import)]
    after = s[first + len(craft_import):].replace(craft_import, '')
    s = before + after
if s.count(craft_import) != 1:
    raise SystemExit(f'unexpected crafting import count: {s.count(craft_import)}')

# The generic healing replacement can hit Blood Tap before the spell-specific
# replacement. Blood Tap lives in castSpell and must use derivedForSpell.
bad = """      } else if (spell.id === 'blood_tap') {\n        const heal = 80;\n        p.hp = Math.min(derived.totalMaxHp, p.hp + heal);\n"""
good = """      } else if (spell.id === 'blood_tap') {\n        const heal = 80;\n        p.hp = Math.min(derivedForSpell.totalMaxHp, p.hp + heal);\n"""
if bad in s:
    s = s.replace(bad, good, 1)
elif good not in s:
    raise SystemExit('Blood Tap derived max pattern missing')

p.write_text(s)
print('post-transform regression repairs applied')
