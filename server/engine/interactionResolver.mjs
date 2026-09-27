const ALLOWED_KINDS = new Set(['talk', 'trade', 'inspect', 'hostile']);

function cleanString(value, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function distance(a, b) {
  return Math.hypot(Number(a?.x) - Number(b?.x), Number(a?.y) - Number(b?.y));
}

/**
 * Pure server-side validation for contextual interactions.
 * The caller supplies only authoritative targets from the current map.
 * No client coordinates, labels, rewards or quest state are trusted here.
 */
export function resolveInteraction({ player, payload, targets, maxDistance = 3 }) {
  if (!player || !payload || typeof payload !== 'object') return { ok: false, reason: 'invalid_request' };
  const targetEntityId = cleanString(payload.targetEntityId);
  const kind = cleanString(payload.kind, 24);
  if (!targetEntityId || !ALLOWED_KINDS.has(kind)) return { ok: false, reason: 'invalid_request' };

  const authoritativeTargets = Array.isArray(targets) ? targets : [];
  const target = authoritativeTargets.find(candidate => candidate && cleanString(candidate.id) === targetEntityId);
  if (!target) return { ok: false, reason: 'target_not_found' };
  if (cleanString(target.mapId) && cleanString(target.mapId) !== cleanString(player.mapId)) return { ok: false, reason: 'wrong_map' };
  if (!Number.isFinite(Number(target.x)) || !Number.isFinite(Number(target.y))) return { ok: false, reason: 'invalid_target' };
  if (distance(player, target) > maxDistance) return { ok: false, reason: 'out_of_range' };

  const allowedKinds = Array.isArray(target.interactionKinds) ? target.interactionKinds.filter(value => ALLOWED_KINDS.has(value)) : [];
  if (!allowedKinds.includes(kind)) return { ok: false, reason: 'kind_not_allowed' };

  return {
    ok: true,
    interaction: {
      targetEntityId,
      kind,
      targetType: cleanString(target.type, 40) || 'entity',
      targetName: cleanString(target.name, 80) || targetEntityId,
    },
  };
}

export function interactionDeniedEvent(reason) {
  return { type: 'interaction_denied', reason: cleanString(reason, 40) || 'denied' };
}

export function interactionAcceptedEvent(interaction) {
  return { type: 'interaction_accepted', interaction };
}
