// ===================================================================
//  SERVER SYNC MANAGER — turns the client into a "dumb terminal"
//  When connected to an authoritative server, the client:
//    1. Sends INTENTS (inputs) instead of modifying state
//    2. Renders SNAPSHOTS (server truth) instead of simulating
//  This is what makes it anti-cheat: client never owns state.
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
}

class ServerSyncManager {
  private authed = false;
  private currentMapId = 'eldoria';

  authenticate(name: string, vocation: string) {
    if (this.authed) return;
    sendAuth(name, vocation);
    this.authed = true;
  }

  isActive(): boolean {
    return isAuthoritative() && this.authed && getSnapshot() !== null;
  }

  // ===== SAVE SYNC =====
  uploadSave(player: any, inventory: any[]) {
    if (!this.isActive()) return;
    const { buildSave } = require('./SaveManager');
    const save = buildSave(player);
    save.inventory = inventory;
    net.send({ kind: 'save', payload: save });
  }

  requestServerSave(): Promise<PlayerSave | null> {
    return new Promise((resolve) => {
      pendingLoadResponse = resolve;
      net.send({ kind: 'load_request', payload: {} });
      setTimeout(() => { if (pendingLoadResponse) { pendingLoadResponse(null); pendingLoadResponse = null; } }, 3000);
    });
  }

  handleLoadResponse(save: PlayerSave | null) {
    if (pendingLoadResponse) { pendingLoadResponse(save); pendingLoadResponse = null; }
  }

  // ===== INTENT SENDERS =====
  sendMove(dx: number, dy: number) {
    if (!this.isActive()) return;
    sendIntent({ type: 'move', payload: { dx, dy } });
  }

  sendAttack(monsterId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'attack', payload: { monsterId } });
  }

  sendCast(spellIndex: number) {
    if (!this.isActive()) return;
    sendIntent({ type: 'cast', payload: { spellIndex } });
  }

  sendUseItem(itemId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'use_item', payload: { itemId } });
  }

  sendEquip(itemId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'equip', payload: { itemId } });
  }

  sendPickup(groundId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'pickup', payload: { groundId } });
  }

  sendDrop(itemId: string) {
    if (!this.isActive()) return;
    sendIntent({ type: 'drop', payload: { itemId } });
  }

  sendMount() {
    if (!this.isActive()) return;
    sendIntent({ type: 'mount', payload: {} });
  }

  // Keep the old signature so existing callers do not break, but coordinates
  // are deliberately not sent: destination coordinates are server-owned.
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

  // ===== SNAPSHOT CONSUMER =====
  updateSnapshot(snap: ServerSnapshot) {
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
    };
  }

  processEvents(addFloatingText: (text: string, pos: { x: number; y: number }, color: string, big?: boolean) => void,
                 addMessage: (sender: string, text: string, color: string, channel: any) => void): string[] {
    const state = this.getRenderState();
    if (!state) return [];
    const consumedIds: string[] = [];
    for (const event of state.events) {
      const id = `${event.kind}_${event.targetId}_${event.amount}_${Math.random()}`;
      consumedIds.push(id);
      switch (event.kind) {
        case 'damage':
          if (event.targetId && event.amount) {
            addFloatingText(`-${event.amount}`, event.pos || { x: 0, y: 0 }, event.color || '#ff6060', event.amount > 50);
          }
          break;
        case 'heal':
          if (event.amount) addFloatingText(`+${event.amount}`, event.pos || { x: 0, y: 0 }, event.color || '#2ecc71');
          break;
        case 'xp':
          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#f4e04d', true);
          break;
        case 'levelup':
          if (event.text) addFloatingText(event.text, event.pos || { x: 0, y: 0 }, event.color || '#f4e04d', true);
          break;
        case 'loot':
          if (event.text) addMessage('Loot', event.text, event.color || '#f4e04d', 'loot');
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
  reset() { this.authed = false; setSnapshot(null); }
}

export const serverSync = new ServerSyncManager();
