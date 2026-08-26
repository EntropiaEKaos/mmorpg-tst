import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_DIR = path.resolve(__dirname, '..');

function startServer(t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-http-auth-'));
  const accountDb = path.join(tempDir, 'accounts.json');
  const port = 41000 + Math.floor(Math.random() * 8000);
  const child = spawn(process.execPath, ['server.js'], {
    cwd: SERVER_DIR,
    env: { ...process.env, PORT: String(port), MORIA_ACCOUNT_DB: accountDb },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  t.after(() => {
    try { child.kill('SIGKILL'); } catch {}
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const ready = new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`Server did not start. Output:\n${output}`)), 5000);
    const check = () => {
      if (output.includes(`localhost:${port}`)) {
        clearTimeout(deadline);
        resolve();
        return;
      }
      if (child.exitCode !== null) {
        clearTimeout(deadline);
        reject(new Error(`Server exited early (${child.exitCode}). Output:\n${output}`));
        return;
      }
      setTimeout(check, 25);
    };
    check();
  });

  return { port, ready };
}

async function post(port, pathname, payload) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { status: response.status, body, retryAfter: response.headers.get('retry-after') };
}

test('login endpoint throttles brute-force attempts', async t => {
  const { port, ready } = startServer(t);
  await ready;

  const username = `brutetest_${Date.now()}`;
  const password = 'StrongPasswordForTest123';
  const registered = await post(port, '/api/auth/register', { username, password });
  assert.equal(registered.status, 201);
  assert.ok(registered.body?.sessionToken);

  for (let i = 0; i < 10; i++) {
    const attempt = await post(port, '/api/auth/login', { username, password: `wrong-password-${i}` });
    assert.equal(attempt.status, 401, `attempt ${i + 1} should be rejected as bad credentials`);
  }

  const throttled = await post(port, '/api/auth/login', { username, password: 'wrong-password-final' });
  assert.equal(throttled.status, 429);
  assert.ok(Number(throttled.retryAfter) >= 1);
});
