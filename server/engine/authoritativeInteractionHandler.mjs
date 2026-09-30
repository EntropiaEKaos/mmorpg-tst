import { resolveInteraction, interactionAcceptedEvent, interactionDeniedEvent } from './interactionResolver.mjs';
import { buildAuthoritativeInteractionTargets } from './authoritativeInteractionTargets.mjs';

/**
 * Composes server-owned content lookup + validation into one dispatcher-safe handler.
 * Returns a bounded event for the caller to append to the player's authoritative event stream.
 */
export function handleAuthoritativeInteraction({ player, payload, npcs, resolvePosition, maxDistance = 3 }) {
  const targets = buildAuthoritativeInteractionTargets({ player, npcs, resolvePosition });
  const result = resolveInteraction({ player, payload, targets, maxDistance });
  if (!result.ok) {
    return { ok: false, event: interactionDeniedEvent(result.reason) };
  }
  return { ok: true, event: interactionAcceptedEvent(result.interaction), interaction: result.interaction };
}
