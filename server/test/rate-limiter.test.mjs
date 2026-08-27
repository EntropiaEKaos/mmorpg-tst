import test from 'node:test';
import assert from 'node:assert/strict';
import { BoundedWindowRateLimiter } from '../engine/RateLimiter.mjs';

test('allows requests inside the window and blocks after the limit', () => {
  const limiter = new BoundedWindowRateLimiter({ maxEntries: 10 });
  const options = { limit: 2, windowMs: 1_000, now: 10_000 };

  assert.equal(limiter.consume('login:1.2.3.4', options).allowed, true);
  assert.equal(limiter.consume('login:1.2.3.4', options).allowed, true);
  const blocked = limiter.consume('login:1.2.3.4', options);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.count, 3);
  assert.equal(blocked.retryAfterMs, 1_000);
});

test('starts a fresh window after expiration', () => {
  const limiter = new BoundedWindowRateLimiter({ maxEntries: 10 });

  assert.equal(limiter.consume('recover:ip', { limit: 1, windowMs: 500, now: 1_000 }).allowed, true);
  assert.equal(limiter.consume('recover:ip', { limit: 1, windowMs: 500, now: 1_100 }).allowed, false);
  const fresh = limiter.consume('recover:ip', { limit: 1, windowMs: 500, now: 1_500 });
  assert.equal(fresh.allowed, true);
  assert.equal(fresh.count, 1);
});

test('never grows beyond maxEntries under distributed-key traffic', () => {
  const limiter = new BoundedWindowRateLimiter({ maxEntries: 3 });

  for (let index = 0; index < 20; index += 1) {
    limiter.consume(`login:203.0.113.${index}`, { limit: 10, windowMs: 60_000, now: 5_000 + index });
    assert.ok(limiter.size <= 3);
  }

  assert.equal(limiter.size, 3);
});

test('prune removes expired windows', () => {
  const limiter = new BoundedWindowRateLimiter({ maxEntries: 10 });
  limiter.consume('a', { limit: 1, windowMs: 100, now: 100 });
  limiter.consume('b', { limit: 1, windowMs: 500, now: 100 });

  assert.equal(limiter.prune(250), 1);
  assert.equal(limiter.size, 1);
  assert.equal(limiter.prune(700), 0);
});
