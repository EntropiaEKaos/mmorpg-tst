// Runtime-facing Content Studio contract.
// Keep server/admin consumers on this facade so ISO authoring can extend the
// mature legacy studio without replacing or shrinking its schemas.
export {
  CONTENT_STUDIO_SCHEMAS,
  collectContentDiagnostics,
} from './ContentStudio.mjs';

export {
  getContentStudioSchemaWithIso as getContentStudioSchema,
  validateStudioRecordWithIso as validateStudioRecord,
} from './ContentStudioIsoFacade.mjs';
