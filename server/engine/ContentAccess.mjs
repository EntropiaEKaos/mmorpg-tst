// ===================================================================
// MOR'IA 9.1 — CONTENT ACCESS CONTROL
// GM access is server-owned and driven by the admin-editable gmRoster catalog.
// ===================================================================

const playerKey = value => String(value || '').trim().toLocaleLowerCase('en-US');

export function isGmCharacter(contentDB, playerOrName) {
  const name = typeof playerOrName === 'string' ? playerOrName : playerOrName?.name;
  const key = playerKey(name);
  if (!key || !contentDB || typeof contentDB.get !== 'function') return false;
  return contentDB.get('gmRoster').some(entry => playerKey(entry?.name || entry?.id) === key);
}

export function canAccessMap(contentDB, player, map) {
  if (!map || map.access !== 'gm') return true;
  return isGmCharacter(contentDB, player);
}

export function explainMapAccess(contentDB, player, map) {
  if (canAccessMap(contentDB, player, map)) return null;
  return `${map?.name || 'This area'} is restricted to Game Masters.`;
}
