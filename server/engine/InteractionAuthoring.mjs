export const INTERACTION_KINDS = Object.freeze(['talk', 'trade', 'inspect', 'hostile']);

const asObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : null;

export function normalizeInteractionProfile(record = {}) {
  const profile = asObject(record.interactionProfile) || {};
  const kind = String(profile.kind || record.interactionKind || inferInteractionKind(record));
  return {
    kind,
    prompt: String(profile.prompt || defaultPrompt(kind)),
    inspect: asObject(profile.inspect) || null,
    combat: asObject(profile.combat) || null,
    dialogueId: profile.dialogueId ? String(profile.dialogueId) : null,
    shopId: profile.shopId ? String(profile.shopId) : null,
  };
}

export function validateInteractionProfile(record = {}, contentDB = null) {
  const profile = normalizeInteractionProfile(record);
  if (!INTERACTION_KINDS.includes(profile.kind)) return 'interaction kind is not supported';
  if (profile.prompt.length > 80) return 'interaction prompt cannot exceed 80 characters';

  if (profile.kind === 'talk' && !String(record.dialogue || profile.dialogueId || '').trim()) {
    return 'talk interaction requires dialogue or dialogueId';
  }
  if (profile.kind === 'trade') {
    const shops = contentDB?.get?.('shops') || [];
    const linked = profile.shopId
      ? shops.some((shop) => shop?.id === profile.shopId)
      : shops.some((shop) => shop?.npcId === record.id);
    if (!linked) return 'trade interaction requires a valid shop';
  }
  if (profile.kind === 'inspect') {
    const inspect = profile.inspect || {};
    if (!String(inspect.description || record.description || '').trim()) return 'inspect interaction requires a description';
    if (inspect.bestiaryId !== undefined && typeof inspect.bestiaryId !== 'string') return 'inspect.bestiaryId must be a string';
  }
  if (profile.kind === 'hostile') {
    const combat = profile.combat || {};
    if (combat.targetable === false) return 'hostile interaction must be targetable';
    if (record.hp !== undefined && (!Number.isFinite(Number(record.hp)) || Number(record.hp) <= 0)) return 'hostile interaction requires positive hp';
  }
  return null;
}

export function inferInteractionKind(record = {}) {
  const role = String(record.role || '');
  if (role === 'merchant') return 'trade';
  if (record.hostile === true || record.aiArchetype || record.type === 'monster') return 'hostile';
  if (record.inspectOnly === true) return 'inspect';
  return 'talk';
}

function defaultPrompt(kind) {
  if (kind === 'trade') return 'Negociar';
  if (kind === 'inspect') return 'Inspecionar';
  if (kind === 'hostile') return 'Selecionar alvo';
  return 'Conversar';
}
