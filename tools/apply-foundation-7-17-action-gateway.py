from pathlib import Path

ROOT = Path('.')
SYSTEMS = ROOT / 'server/engine/OfficialSystems.mjs'
DOC = ROOT / 'docs/FOUNDATION_7_17_ACTION_GATEWAY.md'

text = SYSTEMS.read_text(encoding='utf-8')

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return source.replace(old, new, 1)

text = replace_once(
    text,
    "import { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';\n",
    "import { officialActionGateway } from './OfficialActionGateway.mjs';\n",
    'action gateway import',
)

text = replace_once(
    text,
    "\nconst cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';\n\n\n",
    "\n",
    'remove action facade helper',
)

old_service = r'''  serviceProximity(player, action, npcs = []) {
    const rule = getOfficialActionService(action);
    if (!rule) return { ok: true, npc: null };
    const npc = Array.isArray(npcs) ? npcs.find(entry => entry?.id === rule.npcId) : null;
    if (!npc) return { ok: false, error: `${rule.label} is unavailable.` };
    const mapId = cleanText(npc.mapId, 50);
    const x = Number(npc.posX);
    const y = Number(npc.posY);
    const near = mapId === player.mapId && Number.isFinite(x) && Number.isFinite(y)
      && Math.abs(player.x - x) <= 2 && Math.abs(player.y - y) <= 2;
    return near
      ? { ok: true, npc }
      : { ok: false, error: `Move near ${cleanText(npc.name, 80) || rule.label} to use this service.` };
  }
'''
new_service = r'''  serviceProximity(player, action, npcs = []) {
    return officialActionGateway.serviceProximity(player, action, npcs);
  }
'''
text = replace_once(text, old_service, new_service, 'service proximity facade')

old_handle = r'''  handle(player, payload, ctx = {}) {
    const action = cleanText(payload?.action, 80);
    if (!hasOfficialAction(action)) return { ok: false, error: 'Unknown official action.' };
    const proximity = this.serviceProximity(player, action, ctx.contentNpcs || []);
    if (!proximity.ok) return { ok: false, error: proximity.error || 'Move near the required NPC.' };

    const result = executeOfficialAction(this, player, action, payload, ctx);
    const ok = Boolean(result?.ok);
    const detail = result?.detail ?? null;
    if (ok) this.refreshAchievements(player);
    return { ok, detail, action, error: ok ? null : 'Action rejected by authoritative server.' };
  }
'''
new_handle = r'''  handle(player, payload, ctx = {}) {
    return officialActionGateway.handle(this, player, payload, ctx);
  }
'''
text = replace_once(text, old_handle, new_handle, 'action handle facade')

SYSTEMS.write_text(text, encoding='utf-8')

DOC.write_text("""# Foundation 7.17 — Official Action Gateway

`OfficialActionGateway` is now the single command boundary for official systems.

## Responsibilities

- Validates and bounds transport-facing action names.
- Rejects malformed and unknown actions before domain execution.
- Enforces authoritative NPC/service proximity from registry metadata.
- Preserves registry-driven context side effects.
- Refreshes achievements only after successful actions.
- Converts unexpected domain exceptions into stable fail-closed transport errors without exposing internal exception messages.

`OfficialSystems.handle()` and `serviceProximity()` remain compatibility delegates only.
""", encoding='utf-8')

print('Foundation 7.17 official action gateway wired into OfficialSystems')
