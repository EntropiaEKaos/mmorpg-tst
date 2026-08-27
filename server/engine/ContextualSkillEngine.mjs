// ===================================================================
// MOR'IA 9.2 — CONTEXTUAL SKILL ENGINE
// Same skill can resolve differently for allies, self and enemies.
// Clients request a cast; the authoritative server resolves every effect.
// ===================================================================

import { worldPhaseMultiplier } from './WorldClock.mjs';

export const SKILL_TARGET_MODES = Object.freeze(['smart', 'self', 'target', 'area']);
export const ALLY_EFFECTS = Object.freeze(['none', 'heal', 'buff']);
export const ENEMY_EFFECTS = Object.freeze(['none', 'damage', 'drain']);

const PRESETS = Object.freeze({
  divine_healing: { targetMode: 'smart', range: 5, allyEffect: 'heal', allyMultiplier: 1.15, enemyEffect: 'damage', enemyMultiplier: 0.7, dayMultiplier: 1.1, nightMultiplier: 0.95 },
  greater_heal: { targetMode: 'smart', range: 5, allyEffect: 'heal', allyMultiplier: 1.2, enemyEffect: 'damage', enemyMultiplier: 0.55, dayMultiplier: 1.05, nightMultiplier: 1 },
  mass_heal: { targetMode: 'area', range: 4, allyEffect: 'heal', allyMultiplier: 1.1, enemyEffect: 'damage', enemyMultiplier: 0.45, dayMultiplier: 1.05, nightMultiplier: 1 },
  light_heal: { targetMode: 'smart', range: 5, allyEffect: 'heal', allyMultiplier: 1.15, enemyEffect: 'damage', enemyMultiplier: 0.6, dayMultiplier: 1.15, nightMultiplier: 0.9 },
  holy_nova: { targetMode: 'area', range: 3, allyEffect: 'heal', allyMultiplier: 0.8, enemyEffect: 'damage', enemyMultiplier: 1, dayMultiplier: 1.15, nightMultiplier: 0.9 },
  holy_smite: { targetMode: 'smart', range: 5, allyEffect: 'heal', allyMultiplier: 0.5, enemyEffect: 'damage', enemyMultiplier: 1, dayMultiplier: 1.12, nightMultiplier: 0.92 },
  judgment: { targetMode: 'smart', range: 4, allyEffect: 'heal', allyMultiplier: 0.5, enemyEffect: 'damage', enemyMultiplier: 1, dayMultiplier: 1.1, nightMultiplier: 0.95 },
  consecration: { targetMode: 'area', range: 3, allyEffect: 'buff', allyMultiplier: 0.75, enemyEffect: 'damage', enemyMultiplier: 1, dayMultiplier: 1.12, nightMultiplier: 0.95, buffType: 'shield', buffDuration: 7000, buffValue: 18 },
  dark_heal: { targetMode: 'smart', range: 5, allyEffect: 'heal', allyMultiplier: 0.9, enemyEffect: 'drain', enemyMultiplier: 0.75, drainPercent: 35, dayMultiplier: 0.9, nightMultiplier: 1.2 },
  soul_drain: { targetMode: 'smart', range: 5, allyEffect: 'heal', allyMultiplier: 0.55, enemyEffect: 'drain', enemyMultiplier: 1, drainPercent: 35, dayMultiplier: 0.9, nightMultiplier: 1.2 },
  blood_tap: { targetMode: 'smart', range: 2, allyEffect: 'heal', allyMultiplier: 0.65, enemyEffect: 'drain', enemyMultiplier: 0.8, drainPercent: 45, dayMultiplier: 0.95, nightMultiplier: 1.15 },
  serenity: { targetMode: 'smart', range: 4, allyEffect: 'heal', allyMultiplier: 1.25, enemyEffect: 'damage', enemyMultiplier: 0.5, dayMultiplier: 1, nightMultiplier: 1 },
});

function slug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function number(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function legacyDefaults(spell) {
  const type = String(spell?.type || 'attack').toLowerCase();
  if (type === 'heal') return { targetMode: 'self', allyEffect: 'heal', enemyEffect: 'none' };
  if (type === 'buff') return { targetMode: 'self', allyEffect: 'buff', enemyEffect: 'none' };
  if (type === 'aoe') return { targetMode: 'area', allyEffect: 'none', enemyEffect: 'damage' };
  return { targetMode: 'target', allyEffect: 'none', enemyEffect: 'damage' };
}

export function contextualizeSpell(rawSpell) {
  const raw = rawSpell && typeof rawSpell === 'object' ? rawSpell : {};
  const preset = PRESETS[slug(raw.contentSpellId || raw.id || raw.name)] || {};
  const legacy = legacyDefaults(raw);
  const merged = { ...legacy, ...preset, ...raw };

  const targetMode = SKILL_TARGET_MODES.includes(String(merged.targetMode)) ? String(merged.targetMode) : legacy.targetMode;
  const allyEffect = ALLY_EFFECTS.includes(String(merged.allyEffect)) ? String(merged.allyEffect) : legacy.allyEffect;
  const enemyEffect = ENEMY_EFFECTS.includes(String(merged.enemyEffect)) ? String(merged.enemyEffect) : legacy.enemyEffect;

  return {
    ...merged,
    targetMode,
    allyEffect,
    enemyEffect,
    allyMultiplier: number(merged.allyMultiplier, 1, 0, 5),
    enemyMultiplier: number(merged.enemyMultiplier, 1, 0, 5),
    selfMultiplier: number(merged.selfMultiplier, 1, 0, 5),
    dayMultiplier: number(merged.dayMultiplier, 1, 0.25, 3),
    nightMultiplier: number(merged.nightMultiplier, 1, 0.25, 3),
    drainPercent: number(merged.drainPercent, 0, 0, 100),
  };
}

export function effectForRelation(spell, relation) {
  if (relation === 'enemy') return spell.enemyEffect || 'none';
  return spell.allyEffect || 'none';
}

export function multiplierForRelation(spell, relation, clock) {
  const relationMultiplier = relation === 'enemy'
    ? Number(spell.enemyMultiplier) || 0
    : relation === 'self'
      ? (Number(spell.allyMultiplier) || 0) * (Number(spell.selfMultiplier) || 0)
      : Number(spell.allyMultiplier) || 0;
  return relationMultiplier * worldPhaseMultiplier(clock, spell.dayMultiplier, spell.nightMultiplier);
}

export function contextualSkillSummary(spell, clock) {
  const normalized = contextualizeSpell(spell);
  return {
    targetMode: normalized.targetMode,
    allyEffect: normalized.allyEffect,
    enemyEffect: normalized.enemyEffect,
    allyMultiplier: normalized.allyMultiplier,
    enemyMultiplier: normalized.enemyMultiplier,
    selfMultiplier: normalized.selfMultiplier,
    phaseMultiplier: worldPhaseMultiplier(clock, normalized.dayMultiplier, normalized.nightMultiplier),
    dayMultiplier: normalized.dayMultiplier,
    nightMultiplier: normalized.nightMultiplier,
    drainPercent: normalized.drainPercent,
  };
}
