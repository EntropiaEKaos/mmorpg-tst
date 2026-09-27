const ROLE_KINDS = Object.freeze({
  merchant: ['talk', 'trade'],
  shop: ['talk', 'trade'],
  trader: ['talk', 'trade'],
  guard: ['talk'],
  quest: ['talk'],
  npc: ['talk'],
});

function text(value, max = 100) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function kindsForNpc(npc) {
  const explicit = Array.isArray(npc?.interactionKinds)
    ? npc.interactionKinds.filter(kind => ['talk', 'trade', 'inspect', 'hostile'].includes(kind))
    : [];
  if (explicit.length) return [...new Set(explicit)];
  const role = text(npc?.role, 40).toLowerCase();
  return ROLE_KINDS[role] ? [...ROLE_KINDS[role]] : ['talk'];
}

/** Build interaction candidates exclusively from server-owned content and positions. */
export function buildAuthoritativeInteractionTargets({ player, npcs, resolvePosition }) {
  if (!player || !Array.isArray(npcs)) return [];
  const targets = [];
  for (const npc of npcs) {
    if (!npc || text(npc.mapId) !== text(player.mapId)) continue;
    const id = text(npc.id);
    if (!id || !Number.isFinite(Number(npc.posX)) || !Number.isFinite(Number(npc.posY))) continue;
    const requested = { x: Number(npc.posX), y: Number(npc.posY) };
    const safe = typeof resolvePosition === 'function' ? resolvePosition(player.mapId, requested) : requested;
    if (!safe || !Number.isFinite(Number(safe.x)) || !Number.isFinite(Number(safe.y))) continue;
    targets.push({
      id,
      mapId: text(npc.mapId),
      x: Number(safe.x),
      y: Number(safe.y),
      type: 'npc',
      name: text(npc.name, 80) || id,
      interactionKinds: kindsForNpc(npc),
    });
  }
  return targets;
}
