from pathlib import Path

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

old = """  assert.match(sync, /sendIntent\\(\\{ type: 'appearance'/);\n  assert.match(sync, /sendIntent\\(\\{ type: 'task'/);\n  assert.match(sync, /sendIntent\\(\\{ type: 'housing'/);"""
strict = """  assert.match(sync, /sendAppearance\\(action: string/);\n  assert.match(sync, /sendTask\\(action: string/);\n  assert.match(sync, /sendHousing\\(action: string/);\n  assert.match(sync, /sendTypedIntent\\(type: 'appearance' \\| 'task' \\| 'housing'/);\n  assert.match(sync, /sendIntent\\(\\{ type, payload: \\{ action, \\.\\.\\.payload \\} \\}\\)/);\n  const network = fs.readFileSync(new URL('../../src/game/network.ts', import.meta.url), 'utf8');\n  for (const intent of ['appearance', 'task', 'housing']) assert.match(network, new RegExp(`'${intent}'`));"""
robust = """  assert.match(sync, /sendAppearance\\(action: string/);\n  assert.match(sync, /sendTask\\(action: string/);\n  assert.match(sync, /sendHousing\\(action: string/);\n  assert.match(sync, /sendTypedIntent\\(type:\\s*'appearance'\\s*\\|\\s*'task'\\s*\\|\\s*'housing'/);\n  assert.match(sync, /sendIntent\\(\\{\\s*type,\\s*payload:\\s*\\{\\s*action,\\s*\\.\\.\\.payload\\s*\\}\\s*\\}\\);?/);\n  const network = fs.readFileSync(new URL('../../src/game/network.ts', import.meta.url), 'utf8');\n  for (const intent of ['appearance', 'task', 'housing']) assert.match(network, new RegExp(`'${intent}'`));"""

if robust in test:
    print('9.2 typed intent test contract already robust')
elif strict in test:
    test_path.write_text(test.replace(strict, robust, 1), encoding='utf-8')
    print('9.2 typed intent test contract made whitespace-insensitive')
elif old in test:
    test_path.write_text(test.replace(old, robust, 1), encoding='utf-8')
    print('9.2 typed intent test contract aligned')
else:
    raise SystemExit('stale 9.2 intent assertion block not found')
