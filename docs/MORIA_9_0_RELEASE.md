# Mor'ia 9.0 — Final Polish / Release Candidate

## Consolidated line
Mor'ia 9.0 is based on the fully validated 8.6 line, preserving 8.4 authoritative itemization, 8.5 persistent friends/ignore enforcement and 8.6 Content Health.

## Studio hardening
- Content authoring schemas now live in `server/engine/ContentStudio.mjs`.
- The API and browser Studio consume the same field metadata and dynamic options.
- Semantic bounds are validated before cross-reference validation and before persistence.
- Content Health combines semantic diagnostics with non-blocking reference warnings.

## Repository cleanup
Retired one-shot 6.0, 6.1 and 8.0 migration/apply scripts and the obsolete 8.0 apply workflow. These migrations already landed and should not remain as production maintenance surface.

## Release gate
A release candidate is acceptable only after:
1. client `npm audit` reports zero vulnerabilities;
2. client TypeScript passes;
3. production client build passes;
4. server `npm audit` reports zero vulnerabilities;
5. server syntax check passes;
6. the complete server test suite passes;
7. normal branch CI passes on the resulting commit.
