from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))

# ----- Game engine -----
replace_once('server/engine/GameState.mjs',
"import { officialSystems } from './OfficialSystems.mjs';\nimport { contentDB } from './ContentDB.mjs';",
"import { officialSystems } from './OfficialSystems.mjs';\nimport { socialSystems } from './SocialSystems.mjs';\nimport { contentDB } from './ContentDB.mjs';")

replace_once('server/engine/GameState.mjs',
"  playerDisconnect(id) { questEngine.clearPlayer(id); this.players.delete(id); }",
"  playerDisconnect(id) { const player = this.players.get(id); if (player) socialSystems.onDisconnect(player); questEngine.clearPlayer(id); this.players.delete(id); }")

replace_once('server/engine/GameState.mjs',
"      case 'official': return this.handleOfficial(player, payload);\n      case 'quest_accept': return this.handleQuestAccept(player, payload);",
"      case 'official': return this.handleOfficial(player, payload);\n      case 'social': return this.handleSocial(player, payload);\n      case 'quest_accept': return this.handleQuestAccept(player, payload);")

replace_once('server/engine/GameState.mjs',
"  getQuestNpcRequirement(questId) {",
"  handleSocial(player, payload) {\n    const result = socialSystems.handle(player, payload, { players: this.players });\n    if (!result.ok) {\n      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: `❌ ${result.error || 'Social action rejected.'}`, color: '#ff6060', pos: { x: player.x, y: player.y } });\n      return false;\n    }\n    for (const notice of result.notices || []) {\n      const target = this.players.get(notice.playerId);\n      if (target) this.emitEvent(target.mapId, { kind: 'system', targetId: target.id, text: notice.text, color: '#7dd3fc', pos: { x: target.x, y: target.y } });\n    }\n    if (result.message && !(result.notices || []).some(notice => notice.playerId === player.id && notice.text === result.message)) {\n      this.emitEvent(player.mapId, { kind: 'system', targetId: player.id, text: result.message, color: '#7dd3fc', pos: { x: player.x, y: player.y } });\n    }\n    return true;\n  }\n\n  getQuestNpcRequirement(questId) {")

replace_once('server/engine/GameState.mjs',
"    official.state.combat = { sessionDamage, sessionSeconds: Math.floor(sessionSeconds), dps: Math.round((sessionDamage / sessionSeconds) * 10) / 10 };\n    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official };",
"    official.state.combat = { sessionDamage, sessionSeconds: Math.floor(sessionSeconds), dps: Math.round((sessionDamage / sessionSeconds) * 10) / 10 };\n    const social = socialSystems.snapshot(player, this.players);\n    return { player: playerData, nearbyPlayers, monsters, groundItems, events, official, social };")

# ----- Server chat routing + persistence -----
replace_once('server/server.js',
"import { officialSystems } from './engine/OfficialSystems.mjs';\nimport { validateContentReferences, findBlockingContentReferences } from './engine/ContentIntegrity.mjs';",
"import { officialSystems } from './engine/OfficialSystems.mjs';\nimport { socialSystems } from './engine/SocialSystems.mjs';\nimport { validateContentReferences, findBlockingContentReferences } from './engine/ContentIntegrity.mjs';")

old_chat = """    if (msg.kind === 'chat') {
      const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};
      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, 200) : '';
      if (!text) return;
      const allowedChannels = new Set(['world', 'say', 'party', 'guild', 'trade', 'system']);
      const channel = allowedChannels.has(payload.channel) ? payload.channel : 'world';
      const color = typeof payload.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(payload.color) ? payload.color : '#fff';
      const chatMsg = { id: `chat_${Date.now()}_${clientId}`, sender: authenticatedPlayer, text, color, time: Date.now(), channel };
      const data = JSON.stringify({ kind: 'chat', payload: chatMsg });
      for (const c of wss.clients) if (c.readyState === WebSocket.OPEN) c.send(data);
      return;
    }
"""
new_chat = """    if (msg.kind === 'chat') {
      const payload = msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {};
      const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, 200) : '';
      if (!text) return;
      const allowedChannels = new Set(['world', 'say', 'party', 'guild', 'trade']);
      const channel = allowedChannels.has(payload.channel) ? payload.channel : 'world';
      const senderPlayer = engine.getPlayer(clientId);
      if (!senderPlayer) return;
      const color = VOCATIONS[senderPlayer.vocation]?.color || '#d9e0eb';
      const chatMsg = { id: `chat_${Date.now()}_${clientId}`, sender: authenticatedPlayer, text, color, time: Date.now(), channel };
      const data = JSON.stringify({ kind: 'chat', payload: chatMsg });
      const recipients = new Set(socialSystems.chatRecipients(senderPlayer, channel, engine.players));
      for (const recipientId of recipients) {
        const entry = wsClients.get(recipientId);
        if (entry?.ws.readyState === WebSocket.OPEN) entry.ws.send(data);
      }
      return;
    }
"""
replace_once('server/server.js', old_chat, new_chat)

replace_once('server/server.js',
"setInterval(() => sessionManager.prune(), 10 * 60 * 1000);",
"setInterval(() => sessionManager.prune(), 10 * 60 * 1000);\nsetInterval(() => socialSystems.prune(), 60 * 1000);")
replace_once('server/server.js',
"process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); officialSystems.save(); process.exit(0); });\nprocess.on('SIGINT', () => { playerDB.save(); contentDB.save(); officialSystems.save(); process.exit(0); });",
"process.on('SIGTERM', () => { playerDB.save(); contentDB.save(); officialSystems.save(); socialSystems.save(); process.exit(0); });\nprocess.on('SIGINT', () => { playerDB.save(); contentDB.save(); officialSystems.save(); socialSystems.save(); process.exit(0); });")

# ----- Network protocol -----
replace_once('src/game/network.ts',
"        'adventure_start' | 'adventure_abandon' | 'adventure_claim' | 'official';",
"        'adventure_start' | 'adventure_abandon' | 'adventure_claim' | 'official' | 'social';")
replace_once('src/game/network.ts',
"  official?: any;\n}",
"  official?: any;\n  social?: any;\n}")

# ----- Client types -----
replace_once('src/game/types.ts',
"  channel: 'world' | 'system' | 'battle' | 'loot' | 'quest';",
"  channel: 'world' | 'say' | 'party' | 'guild' | 'trade' | 'system' | 'battle' | 'loot' | 'quest';")

# ----- ServerSync -----
replace_once('src/game/ServerSync.ts',
"  official: any;\n}",
"  official: any;\n  social: any;\n}")
replace_once('src/game/ServerSync.ts',
"  sendOfficial(action: string, payload: Record<string, unknown> = {}) {\n    if (!this.isActive() || !action) return;\n    sendIntent({ type: 'official', payload: { action, ...payload } });\n  }",
"  sendOfficial(action: string, payload: Record<string, unknown> = {}) {\n    if (!this.isActive() || !action) return;\n    sendIntent({ type: 'official', payload: { action, ...payload } });\n  }\n\n  sendSocial(action: string, payload: Record<string, unknown> = {}) {\n    if (!this.isActive() || !action) return;\n    sendIntent({ type: 'social', payload: { action, ...payload } });\n  }")
replace_once('src/game/ServerSync.ts',
"      official: snap.official || null,\n    };",
"      official: snap.official || null,\n      social: snap.social || null,\n    };")

# ----- GameScreen UI / state -----
replace_once('src/components/GameScreen.tsx',
"import OfficialSystemsHub, { type OfficialTab } from './OfficialSystemsHub';",
"import OfficialSystemsHub, { type OfficialTab } from './OfficialSystemsHub';\nimport SocialHub from './SocialHub';")

replace_once('src/components/GameScreen.tsx',
"  const [officialState, setOfficialState] = useState<any>(null);\n  const lastOfficialSignatureRef = useRef('');",
"  const [officialState, setOfficialState] = useState<any>(null);\n  const lastOfficialSignatureRef = useRef('');\n  const [showSocialHub, setShowSocialHub] = useState(false);\n  const [socialState, setSocialState] = useState<any>(null);\n  const lastSocialSignatureRef = useRef('');")

replace_once('src/components/GameScreen.tsx',
"          const serverOfficial = renderState.official;\n          Object.assign(p, compatibleServerPlayer);",
"          const serverOfficial = renderState.official;\n          const serverSocial = renderState.social;\n          Object.assign(p, compatibleServerPlayer);")

replace_once('src/components/GameScreen.tsx',
"          if (serverQuestState && typeof serverQuestState === 'object') {",
"          if (serverSocial && typeof serverSocial === 'object') {\n            const signature = JSON.stringify(serverSocial);\n            if (signature !== lastSocialSignatureRef.current) {\n              lastSocialSignatureRef.current = signature;\n              setSocialState(serverSocial);\n            }\n          }\n          if (serverQuestState && typeof serverQuestState === 'object') {")

replace_once('src/components/GameScreen.tsx',
"    inv: { icon: '📦', label: 'Inv', hotkey: 'I', onClick: () => setShowInventory((v) => !v) },",
"    social: { icon: '👥', label: 'Social', hotkey: '', onClick: () => onlineAccount && setShowSocialHub(true) },\n    inv: { icon: '📦', label: 'Inv', hotkey: 'I', onClick: () => setShowInventory((v) => !v) },")

old_chat_render = """          <Chat messages={messages} onSendMessage={(text) => { addMessage(player.name, text, '#ffffff', 'world'); broadcastChat(player.name, text, '#ffffff', 'world'); }} />"""
new_chat_render = """          <Chat messages={messages} social={socialState} onSendMessage={(text, channel) => {
            if (serverSync.isActive()) broadcastChat(player.name, text, '#ffffff', channel);
            else { addMessage(player.name, text, '#ffffff', 'world'); broadcastChat(player.name, text, '#ffffff', 'world'); }
          }} />"""
replace_once('src/components/GameScreen.tsx', old_chat_render, new_chat_render)

replace_once('src/components/GameScreen.tsx',
"          {showOfficialHub && serverSync.isActive() && officialState && (",
"          {showSocialHub && serverSync.isActive() && socialState && (\n            <SocialHub player={player} inventory={inventory} social={socialState} onAction={(action, payload) => serverSync.sendSocial(action, payload)} onClose={() => setShowSocialHub(false)} />\n          )}\n\n          {showOfficialHub && serverSync.isActive() && officialState && (")

DOC = '''# MOR'IA Foundation 7.1 — Authoritative Social Layer

Foundation 7.1 turns the MMO social placeholders into server-owned systems.

- Party: create, nearby invite, accept, leader kick, leave, five-member cap and private party chat.
- Guild: persistent guild database, level/gold creation gate, invitations, leader/officer/member roles, MOTD, kick/promote/demote and private guild chat.
- Direct trade: proximity-gated request/accept, gold and up to eight whole inventory entries per offer, confirmation reset on offer changes, final inventory/gold revalidation and atomic settlement.
- Chat routing: `say` is range/map scoped; `party` and `guild` are membership scoped; `world` and `trade` remain realm channels. Clients can no longer send the reserved `system` channel or choose arbitrary chat colors.
- Social state is included in authoritative snapshots and rendered through the Social Hall UI.
- Disconnect automatically cancels trades and removes the character from session-scoped parties while guild membership persists.
'''
write('docs/FOUNDATION_7_1_SOCIAL.md', DOC)

print('Foundation 7.1 social wiring applied')
