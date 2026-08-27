// ===================================================================
//  SERVER SYNC MANAGER — turns the client into a "dumb terminal"
// ===================================================================

import { sendAuth, sendIntent, setSnapshot, getSnapshot, isAuthoritative, net, type ServerSnapshot } from './network';
import { type PlayerSave } from './SaveManager';

export { net };

let pendingLoadResponse: ((save: PlayerSave | null) => void) | null = null;

export interface RenderState {
  player: any;
  nearbyPlayers: any[];
  monsters: any[];
  groundItems: any[];
  events: any[];
  official: any;
  social: any;
  worldClock?: any;
}

class ServerSyncManager {
  private authed = false;
  private currentMapId = 'eldoria';
  private lastProcessedEvents: any[] | null = null;

  // GameScreen historically passed (characterName, vocation). During the auth
  // migration we resolve the actual credential from the session token store so
  // no password/account secret is pushed through gameplay props.
  authenticate(characterOrToken: string, characterOrVocation: string) {
    let sessionToken = characterOrToken;
    let characterName = characterOrVocation;
    if (characterOrToken.length < 32) {
      sessionToken = localStorage.getItem('moria_session_token') || '';
      characterName = characterOrToken;
    }
    if (!sessionToken || !characterName) return;
    sendAuth(sessionToken, characterName);
  }

  handleAuthOk() {
    this.authed = true;
  }

  handleAuthError() {
    this.authed = false;
    this.lastProcessedEvents = null;
    setSnapshot(null);
  }

  isActive(): boolean {
    return isAuthoritative() && this.authed && getSnapshot() !== null;
  }

  uploadSave(_player: any, _inventory: any[]) {
    if (!this.isActive()) return;
    net.send({ kind: 'save', payload: {} });
  }

  requestServerSave(): Promise<PlayerSave | null> {
    return new Promise(resolve => {
      pendingLoadResponse = resolve;
      net.send({ kind: 'load_request', payload: {} });
      setTimeout(() => {
        if (pendingLoadResponse) {
          pendingLoadResponse(null);
          pendingLoadResponse = null;
        }
      }, 3000);
    });
  }

  handleLoadResponse(save: PlayerSave | null) {
    if (pendingLoadResponse) {
      pendingLoadResponse(save);
      pendingLoadResponse = null;
    }
  }

  sendMove(dx: number, dy: number) {
    if (!this.isActive()) return;
    sendIntent({ type: 'move', payload: { dx, dy } });
  }

  sendAttack(monsterId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'attack', payload: { monsterId } });
  }

  sendCast(spellIndex: number, targetId?: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'cast', payload: { spellIndex, ...(targetId ? { targetId } : {}) } });
  }

  sendUseItem(itemId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'use_item', payload: { itemId } });
  }

  sendEquip(itemId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'equip', payload: { itemId } });
  }

  sendUnequip(slot: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'unequip', payload: { slot } });
  }

  sendPickup(groundId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'pickup', payload: { groundId } });
  }

  sendDrop(itemId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'drop', payload: { itemId } });
  }

  sendMount(action = 'toggle', payload: Record<string, unknown> = {}) {
    if (!this.isActive()) return;
    sendIntent({ type: 'mount', payload: { action, ...payload } });
  }

  sendAppearance(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'appearance', payload: { action, ...payload } });
  }

  sendTask(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'task', payload: { action, ...payload } });
  }

  sendHousing(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'housing', payload: { action, ...payload } });
  }

  sendTravel(targetMap: string, _spawnX?: number, _spawnY?: number) {
    if (!this.isActive()) return;
    sendIntent({ type: 'travel', payload: { targetMap } });
  }

  sendQuestAccept(questId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'quest_accept', payload: { questId } });
  }

  sendQuestComplete(questId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'quest_complete', payload: { questId } });
  }

  sendTalent(talentId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'talent', payload: { talentId } });
  }

  sendTalentReset() {
    if (!this.isActive()) return;
    sendIntent({ type: 'talent_reset', payload: {} });
  }

  sendAdventureStart(contractId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'adventure_start', payload: { contractId } });
  }

  sendAdventureAbandon() {
    if (!this.isActive()) return;
    sendIntent({ type: 'adventure_abandon', payload: {} });
  }

  sendAdventureClaim() {
    if (!this.isActive()) return;
    sendIntent({ type: 'adventure_claim', payload: {} });
  }

  sendOfficial(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'official', payload: { action, ...payload } });
  }

  sendSocial(action: string, payload: Record<string, unknown> = {}) {
    if (!this.isActive() || !action) return;
    sendIntent({ type: 'social', payload: { action, ...payload } });
  }

  updateSnapshot(snap: ServerSnapshot) {
    this.authed = true;
    setSnapshot(snap);
    this.currentMapId = snap.player.mapId;
  }

  getRenderState(): RenderState | null {
    const snap = getSnapshot();
    if (!snap) return null;
    return {
      player: snap.player,
      nearbyPlayers: snap.nearbyPlayers,
      monsters: snap.monsters,
      groundItems: snap.groundItems,
      events: snap.events || [],
      official: snap.official || null,
      social: snap.social || null,
    };
  }

  processEvents(
    addFloatingText: (text: string, pos: { x: number; y: number }, color: string, big?: boolean) => void,
    addMessage: (sender: string, text: string, color: string, channel: any) => void,
    onFeedback?: (event: any) => void,
  ): string[] {
    const state = this.getRenderState();
    if (!state) return [];

    // GameScreen can render faster than the server snapshot cadence. The event
    // array belongs to a single immutable snapshot, so consume that array once.
    if (state.events === this.lastProcessedEvents) return [];
    this.lastProcessedEvents = state.events;

    const consumedIds: string[] = [];
    for (let index = 0; index < state.events.length; index++) {
      const event = state.events[index];
      try { onFeedback?.(event); } catch { /* presentation must never break snapshot consumption */ }
      const id = `${event.kind}_${event.targetId || ''}_${event.amount || ''}_${index}`;
      consumedIds.push(id);
      switch (event.kind) {
        case 'damage':
          if (event.targetId && event.amount) addFloatingText(`-${event.amount}`, event.pos || { x: 0, y: 0 }, event.color || '#ff6060', event.amount > 50);
          break;
        case 'heal':
          if (event.amount) addFloatingText(`+${event.amount}`, event.pos || { x: 0, y: 0 }, event.color || '#2ecc71');
          break;
        case 'xp':
        case 'levelup':
          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#f4e04d', true);
          break;
        case 'spell':
          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#b398ff', true);
          break;
        case 'loot':
          if (event.text) addMessage('Loot', event.text, event.color || '#f4e04d', 'loot');
          break;
        case 'quest_progress':
          if (event.text) addMessage('Quest', event.text, event.color || '#9bd4ff', 'quest');
          break;
        case 'quest_complete':
          if (event.text) addMessage('Quest', event.text, event.color || '#58d6a8', 'quest');
          break;
        case 'adventure_combo':
          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#ffb84d', true);
          break;
        case 'adventure_progress':
          if (event.text) addMessage('Hunt', event.text, event.color || '#7dd3fc', 'battle');
          break;
        case 'adventure_ready':
          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'system');
          break;
        case 'adventure_claimed':
          if (event.text) addMessage('Hunt', event.text, event.color || '#ffd87b', 'loot');
          break;
        case 'task_progress':
          if (event.text) addMessage('Task', event.text, event.color || '#7dd3fc', 'quest');
          break;
        case 'task_ready':
        case 'task_update':
          if (event.text) addMessage('Task', event.text, event.color || '#ffd87b', 'quest');
          break;
        case 'housing_update':
          if (event.text) addMessage('Housing', event.text, event.color || '#d9bd7a', 'system');
          break;
        case 'appearance_update':
          if (event.text) addMessage('Outfit', event.text, event.color || '#d49bc8', 'system');
          break;
        case 'mount_update':
          if (event.text) addMessage('Mount', event.text, event.color || '#d9bd7a', 'system');
          break;
        case 'death':
          if (event.text) addMessage('System', event.text, event.color || '#ff0000', 'system');
          break;
        case 'system':
          if (event.text) addMessage('Server', event.text, event.color || '#9bd4ff', 'system');
          break;
      }
    }
    return consumedIds;
  }

  getMapId(): string { return this.currentMapId; }

  reset() {
    this.authed = false;
    this.lastProcessedEvents = null;
    setSnapshot(null);
    net.clearAuthPayload();
  }
}

export const serverSync = new ServerSyncManager();
