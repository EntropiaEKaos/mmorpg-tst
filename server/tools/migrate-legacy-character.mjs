#!/usr/bin/env node

// Administrative migration only. This intentionally requires shell access to
// the server and never exposes public "claim by character name" behavior.

import { accountStore } from '../engine/AuthService.mjs';
import { playerDB } from '../engine/PlayerDB.mjs';
import { VOCATIONS } from '../engine/Vocations.mjs';

const [username, requestedCharacter] = process.argv.slice(2);

if (!username || !requestedCharacter) {
  console.error('Usage: node tools/migrate-legacy-character.mjs <accountUsername> <legacyCharacterName>');
  process.exit(2);
}

const account = accountStore.getByUsername(username);
if (!account) {
  console.error(`Account not found: ${username}`);
  process.exit(1);
}

const legacyKey = playerDB.findNameCaseInsensitive(requestedCharacter);
if (!legacyKey) {
  console.error(`Legacy character save not found: ${requestedCharacter}`);
  process.exit(1);
}

const alreadyOwned = accountStore.findCharacter(legacyKey);
if (alreadyOwned) {
  console.error(`Character is already owned by account ${alreadyOwned.accountId}`);
  process.exit(1);
}

const saved = playerDB.get(legacyKey);
const vocation = typeof saved?.vocation === 'string' ? saved.vocation.toLowerCase() : '';
if (!VOCATIONS[vocation]) {
  console.error(`Legacy character has invalid or missing vocation: ${saved?.vocation ?? 'none'}`);
  process.exit(1);
}

const result = accountStore.createCharacter(account.id, legacyKey, vocation);
if (!result.ok) {
  console.error(`Migration failed: ${result.error}`);
  process.exit(1);
}

console.log(`Migrated legacy character "${legacyKey}" to account "${account.username}".`);
console.log('The original PlayerDB save remains intact and will be loaded after authenticated login.');
