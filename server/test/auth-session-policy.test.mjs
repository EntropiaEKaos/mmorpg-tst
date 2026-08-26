import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionManager } from '../engine/AuthService.mjs';

test('new exclusive login revokes older sessions for the same account', () => {
  const sessions = new SessionManager();
  const first = sessions.create('acct_duplicate');
  const second = sessions.create('acct_duplicate', { revokeExisting: true });

  assert.equal(sessions.validate(first.token), null);
  assert.equal(sessions.validate(second.token)?.accountId, 'acct_duplicate');
});
