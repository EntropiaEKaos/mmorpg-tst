from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
sync_path = root / 'src/game/ServerSync.ts'
test_path = root / 'server/test/client-alpha-systems-9-2.test.mjs'
network_path = root / 'src/game/network.ts'

sync = sync_path.read_text(encoding='utf-8')
test = test_path.read_text(encoding='utf-8')
network = network_path.read_text(encoding='utf-8')

# The 9.2 client applicator writes this JS test from a Python raw string.
# That historically left regex literals double-escaped (for example
# /sendTask\\(/), which makes the generated JavaScript regex invalid or
# semantically wrong. Collapse those Python-level escapes before the suite runs.
test = test.replace('\\\\', '\\')

for method in ('sendAppearance', 'sendTask', 'sendHousing'):
    if f'{method}(action: string' not in sync:
        raise SystemExit(f'missing public 9.2 sync method: {method}')
for intent in ("'appearance'", "'task'", "'housing'"):
    if intent not in network:
        raise SystemExit(f'missing network Intent member: {intent}')

# Some iterations route the three life-system intents through a typed helper.
# When that helper exists, keep a semantic architecture guard for the alias,
# helper dispatch and all public routes. Direct dispatch remains valid too.
if 'sendTypedIntent(' in sync:
    replacement = r"""test('9.2 client sync exposes dedicated authoritative intents', () => {
  assert.match(sync, /type AlphaLifeIntentType\s*=\s*'appearance'\s*\|\s*'task'\s*\|\s*'housing'\s*;/);
  assert.match(sync, /sendTypedIntent\(type:\s*AlphaLifeIntentType,/);
  assert.match(sync, /sendTypedIntent\(type:\s*AlphaLifeIntentType,[\s\S]*?sendIntent\(\{\s*type,\s*payload:\s*\{\s*action,\s*\.\.\.payload\s*\}\s*\}\);?/);
  assert.match(sync, /sendAppearance\(action:\s*string[\s\S]*?this\.sendTypedIntent\('appearance',\s*action,\s*payload\);/);
  assert.match(sync, /sendTask\(action:\s*string[\s\S]*?this\.sendTypedIntent\('task',\s*action,\s*payload\);/);
  assert.match(sync, /sendHousing\(action:\s*string[\s\S]*?this\.sendTypedIntent\('housing',\s*action,\s*payload\);/);
  const network = fs.readFileSync(new URL('../../src/game/network.ts', import.meta.url), 'utf8');
  for (const intent of ['appearance', 'task', 'housing']) assert.match(network, new RegExp(`'${intent}'`));
});"""

    pattern = re.compile(
        r"test\('9\.2 client sync exposes dedicated authoritative intents', \(\) => \{.*?^\}\);",
        re.MULTILINE | re.DOTALL,
    )
    if pattern.search(test):
        test = pattern.sub(lambda _match: replacement, test, count=1)
    else:
        test = test.rstrip() + '\n\n' + replacement + '\n'

# Guard against regression of the exact malformed literals that caused the
# server suite to fail before any assertions could execute.
for malformed in ('/drawAvatar\\\\(ctx/', '/sendTask\\\\(/', '/sendHousing\\\\(/', '/sendAppearance\\\\(/'):
    if malformed in test:
        raise SystemExit(f'malformed generated JavaScript regex remains: {malformed}')

test_path.write_text(test, encoding='utf-8')
print('9.2 client test regexes normalized and authoritative intent contract validated')
