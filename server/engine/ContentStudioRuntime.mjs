// Runtime-facing Content Studio contract.
// Keep server/admin consumers on this facade so ISO authoring can extend the
// mature legacy studio without replacing or shrinking its schemas.
export {
  CONTENT_STUDIO_SCHEMAS,
} from './ContentStudio.mjs';

export {
  getContentStudioSchema,
  validateStudioRecord,
  collectContentDiagnostics,
} from './ContentStudioIsoFacade.mjs';
