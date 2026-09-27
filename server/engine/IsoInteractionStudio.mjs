import { INTERACTION_KINDS, normalizeInteractionProfile, validateInteractionProfile } from './InteractionAuthoring.mjs';

export const ISO_INTERACTION_FIELDS = Object.freeze([
  Object.freeze({ id: 'interactionKind', label: 'ISO interaction', kind: 'select', optionKey: 'interactionKinds' }),
  Object.freeze({ id: 'interactionPrompt', label: 'Interaction prompt', kind: 'text' }),
  Object.freeze({ id: 'interactionProfile', label: 'ISO interaction profile', kind: 'json' }),
]);

export function extendStudioSchemaWithIsoInteractions(type, schema = []) {
  if (type !== 'npcs' && type !== 'monsters') return schema;
  const existing = new Set(schema.map((field) => field?.id));
  return Object.freeze([...schema, ...ISO_INTERACTION_FIELDS.filter((field) => !existing.has(field.id))]);
}

export function isoInteractionOptions() {
  return { interactionKinds: [...INTERACTION_KINDS] };
}

export function validateIsoStudioInteraction(type, record, contentDB = null) {
  if (type !== 'npcs' && type !== 'monsters') return null;
  const normalized = normalizeInteractionProfile({
    ...record,
    interactionProfile: {
      ...(record?.interactionProfile && typeof record.interactionProfile === 'object' ? record.interactionProfile : {}),
      ...(record?.interactionKind ? { kind: record.interactionKind } : {}),
      ...(record?.interactionPrompt ? { prompt: record.interactionPrompt } : {}),
    },
  });
  return validateInteractionProfile({ ...record, interactionProfile: normalized }, contentDB);
}
