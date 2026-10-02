import type { AuthoritativeVisualEntity } from './worldAdapter';

/** Deterministic visual-development fixture. Never used as gameplay authority. */
export const ELDORIA_ISO_FIXTURE: readonly AuthoritativeVisualEntity[] = [
  { id: 'preview-player', kind: 'player', world: { x: 8, y: 8 }, visualId: 'hero-v1' },
  { id: 'preview-guard-a', kind: 'npc', world: { x: 6, y: 9 }, visualId: 'eldoria-guard' },
  { id: 'preview-guard-b', kind: 'npc', world: { x: 10, y: 7 }, visualId: 'eldoria-guard' },
  { id: 'preview-wolf', kind: 'monster', world: { x: 12, y: 11 }, visualId: 'shadow-wolf' },
  { id: 'preview-cart', kind: 'prop', world: { x: 5, y: 5 }, visualId: 'eldoria-cart' },
];
