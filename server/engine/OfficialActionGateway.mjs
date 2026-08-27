// ===================================================================
// MOR'IA — OFFICIAL ACTION GATEWAY
// Single transport-facing boundary for official commands. It validates action
// names, authoritative NPC proximity and normalizes domain failures.
// ===================================================================

import {
  executeOfficialAction,
  getOfficialActionService,
  hasOfficialAction,
} from './OfficialActionRegistry.mjs';

const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const isRecord = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));

export const OFFICIAL_ACTION_GATEWAY_RULES = Object.freeze({
  actionMaxLength: 80,
  serviceRange: 2,
  npcNameMaxLength: 80,
  npcMapMaxLength: 50,
});

function serviceAccess(player, action, npcs = []) {
  const rule = getOfficialActionService(action);
  if (!rule) return { ok: true, npc: null };
  if (!player || !Array.isArray(npcs)) return { ok: false, npc: null, error: `${rule.label} is unavailable.` };

  const npc = npcs.find(entry => entry && entry.id === rule.npcId);
  if (!npc) return { ok: false, npc: null, error: `${rule.label} is unavailable.` };

  const mapId = text(npc.mapId, OFFICIAL_ACTION_GATEWAY_RULES.npcMapMaxLength);
  const x = Number(npc.posX);
  const y = Number(npc.posY);
  const px = Number(player.x);
  const py = Number(player.y);
  const near = mapId === player.mapId
    && Number.isFinite(x) && Number.isFinite(y)
    && Number.isFinite(px) && Number.isFinite(py)
    && Math.abs(px - x) <= OFFICIAL_ACTION_GATEWAY_RULES.serviceRange
    && Math.abs(py - y) <= OFFICIAL_ACTION_GATEWAY_RULES.serviceRange;

  return near
    ? { ok: true, npc }
    : { ok: false, npc: null, error: `Move near ${text(npc.name, OFFICIAL_ACTION_GATEWAY_RULES.npcNameMaxLength) || rule.label} to use this service.` };
}

export class OfficialActionGateway {
  serviceProximity(player, action, npcs = []) {
    return serviceAccess(player, action, npcs);
  }

  handle(host, player, rawPayload, rawContext = {}) {
    if (!host || !player) return { ok: false, detail: null, action: '', error: 'Invalid official action context.' };
    const payload = isRecord(rawPayload) ? rawPayload : {};
    const ctx = isRecord(rawContext) ? rawContext : {};
    const action = text(payload.action, OFFICIAL_ACTION_GATEWAY_RULES.actionMaxLength);
    if (!hasOfficialAction(action)) return { ok: false, detail: null, action, error: 'Unknown official action.' };

    const proximity = serviceAccess(player, action, ctx.contentNpcs || []);
    if (!proximity.ok) return { ok: false, detail: null, action, error: proximity.error || 'Move near the required NPC.' };

    try {
      const result = executeOfficialAction(host, player, action, payload, ctx);
      const ok = Boolean(result?.ok);
      const detail = result?.detail ?? null;
      if (ok && typeof host.refreshAchievements === 'function') host.refreshAchievements(player);
      return { ok, detail, action, error: ok ? null : 'Action rejected by authoritative server.' };
    } catch (error) {
      // Domain failures stay server-side. Transport receives a stable fail-closed result.
      console.warn(`⚠ Official action failed (${action}):`, error?.message || error);
      return { ok: false, detail: null, action, error: 'Action failed safely on the authoritative server.' };
    }
  }
}

export const officialActionGateway = new OfficialActionGateway();
