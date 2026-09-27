import {
  getContentStudioSchema as getLegacyContentStudioSchema,
  validateStudioRecord as validateLegacyStudioRecord,
  collectContentDiagnostics,
} from './ContentStudio.mjs';
import {
  extendStudioSchemaWithIsoInteractions,
  isoInteractionOptions,
  validateIsoStudioInteraction,
} from './IsoInteractionStudio.mjs';

export { collectContentDiagnostics };

export function getContentStudioSchema(type, contentDB) {
  const legacy = getLegacyContentStudioSchema(type, contentDB);
  const schema = extendStudioSchemaWithIsoInteractions(type, legacy.schema || []);
  return {
    ...legacy,
    schema,
    fields: schema.map((entry) => entry.id),
    options: { ...(legacy.options || {}), ...isoInteractionOptions() },
    runtimeNote: type === 'npcs'
      ? `${legacy.runtimeNote || ''} ISO interactions are authored as talk, trade or inspect and validated before publish.`.trim()
      : type === 'monsters'
        ? `${legacy.runtimeNote || ''} ISO interactions are authored as inspect or hostile and validated before publish.`.trim()
        : legacy.runtimeNote || '',
  };
}

export function validateStudioRecord(type, record, contentDB = null) {
  const legacyError = validateLegacyStudioRecord(type, record, contentDB);
  if (legacyError) return legacyError;
  return validateIsoStudioInteraction(type, record, contentDB);
}
