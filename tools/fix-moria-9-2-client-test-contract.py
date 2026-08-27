from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
sync_path = root / 'src/game/ServerSync.ts'
test_path = root / 'server/test/client-alpha-systems-9-2.test.mjs'
network_path = root / 'src/game/network.ts'

sync = sync_path.read_text(encoding='utf-8')
test = test_path.read_text(encoding='utf-8')
network = network_path.read_text(encoding='utf-8')

if 'sendTypedIntent(' not in sync:
    print('ServerSync uses direct 9.2 intent dispatch; no helper-contract rewrite needed')
    raise SystemExit(0)

for method in ('sendAppearance', 'sendTask', 'sendHousing'):
    if f'{method}(action: string' not in sync:
        raise SystemExit(f'missing public 9.2 sync method: {method}')
for intent in ("'appearance'", "'task'", "'housing'"):
    if intent not in network:
        raise SystemExit(f'missing network Intent member: {intent}')

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
updated, count = pattern.subn(lambda _match: replacement, test, count=1)
if count != 1:
    raise SystemExit(f'expected one 9.2 client intent test block, found {count}')

test_path.write_text(updated, encoding='utf-8')
print('9.2 typed intent test contract now validates alias, helper dispatch, and all public routes')
