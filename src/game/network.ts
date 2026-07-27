// ===================================================================
//  REAL-TIME NETWORKING for Mor'ia
//  Layer 1: BroadcastChannel  -> works RIGHT NOW across browser tabs/windows on same machine
//  Layer 2: WebSocket server  -> works over the INTERNET (see /server folder)
//  Both layers feed into the same event handler, so the game logic is identical.
// ===================================================================

export interface NetPlayer {
  id: string;
  name: string;
  vocation: string;
  level: number;
  x: number;
  y: number;
  direction: string;
  color: string;
  icon: string;
  hp: number;
  maxHp: number;
  lastSeen: number;
  mapId: string;
  mounted?: boolean;
  mountIcon?: string;
}

export interface NetChat {
  id: string;
  sender: string;
  text: string;
  color: string;
  time: number;
  channel: string;
}

export interface NetMessage {
  kind: 'player:join' | 'player:move' | 'player:leave' | 'chat' | 'world-event' | 'ping' | 'pong' | 'presence-request' | 'roster' | 'auth' | 'auth_ok' | 'auth_error' | 'snapshot' | 'intent' | 'system' | 'presence' | 'save' | 'load_request' | 'load_response' | 'content_sync';
  from: string;       // sender client id
  payload?: any;
  time: number;
}

// Authoritative intent — what the client asks the server to do
export interface Intent {
  type: 'move' | 'attack' | 'cast' | 'use_item' | 'equip' | 'unequip' |
        'pickup' | 'drop' | 'talk_npc' | 'buy' | 'sell' | 'deposit' |
        'train' | 'rest' | 'mount' | 'travel' | 'socket_gem' | 'talent' |
        'quest_accept' | 'quest_complete';
  payload: any;
  timestamp: number;
}

// Server snapshot — the absolute truth the client must render
export interface ServerSnapshot {
  player: any;
  nearbyPlayers: any[];
  monsters: any[];
  groundItems: any[];
  events: any[];
}

type Handler = (msg: NetMessage) => void;

class NetworkClient {
  private clientId: string;
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private handlers: Handler[] = [];
  public mode: 'offline' | 'local' | 'online' = 'offline';
  public serverUrl: string | null = null;

  constructor() {
    this.clientId = `c_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  }

  on(handler: Handler) {
    this.handlers.push(handler);
  }

  private emit(msg: NetMessage) {
    for (const h of this.handlers) {
      try { h(msg); } catch {}
    }
  }

  // --- Layer 1: BroadcastChannel (same-machine tabs) ---
  connectLocal(): boolean {
    try {
      if (typeof BroadcastChannel === 'undefined') return false;
      this.channel = new BroadcastChannel('moria_mmorpg');
      this.channel.onmessage = (ev) => this.emit(ev.data as NetMessage);
      this.mode = 'local';
      // Announce presence
      this.send({ kind: 'presence-request', payload: { id: this.clientId }, time: Date.now() });
      return true;
    } catch {
      return false;
    }
  }

  // --- Layer 2: WebSocket server (internet) ---
  // Auto-detects the correct server URL based on how the client was loaded.
  connectOnline(explicitUrl?: string): Promise<boolean> {
    return new Promise((resolve) => {
      let url = explicitUrl || '';
      // AUTO-DETECT: if no explicit URL, figure it out from window.location
      if (!url) {
        url = this.detectServerUrl() || '';
      }
      if (!url) { resolve(false); return; }
      try {
        this.ws = new WebSocket(url);
        this.ws.onopen = () => {
          this.mode = 'online';
          this.serverUrl = url;
          this.startHeartbeat();
          this.enableAutoReconnect();
          resolve(true);
        };
        this.ws.onmessage = (ev) => {
          try { this.emit(JSON.parse(ev.data) as NetMessage); } catch {}
        };
        this.ws.onerror = () => resolve(false);
        this.ws.onclose = () => { this.mode = this.channel ? 'local' : 'offline'; };
        setTimeout(() => resolve(false), 3000);
      } catch {
        resolve(false);
      }
    });
  }

  send(msg: Omit<NetMessage, 'from' | 'time'> & { from?: string; time?: number }) {
    const full: NetMessage = {
      from: this.clientId,
      time: Date.now(),
      ...msg,
    } as NetMessage;
    // Send on whatever layers are active
    try { this.channel?.postMessage(full); } catch {}
    try { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(full)); } catch {}
  }

  /** Start a heartbeat to keep the connection alive and detect drops */
  startHeartbeat() {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try { this.ws.send(JSON.stringify({ kind: 'ping', from: this.clientId, time: Date.now() })); } catch {}
      }
    }, 20000); // every 20s (server drops after 45s inactivity)
  }

  /** Auto-reconnect if connection drops */
  enableAutoReconnect() {
    setInterval(() => {
      if (this.mode === 'online' && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
        console.log('🔄 Connection lost, reconnecting...');
        this.connectOnline(this.serverUrl || undefined).then(ok => {
          if (ok) console.log('🟢 Reconnected!');
        });
      }
    }, 5000);
  }

  disconnect() {
    this.send({ kind: 'player:leave', payload: { id: this.clientId } });
    try { this.channel?.close(); } catch {}
    try { this.ws?.close(); } catch {}
    this.channel = null;
    this.ws = null;
    this.mode = 'offline';
  }

  get id() { return this.clientId; }

  isConnected(): boolean { return this.ws !== null; }

  /**
   * AUTO-DETECT server URL — the magic that makes deployment seamless.
   * - If deployed (e.g. Render): uses wss://same-host/ws
   * - If Vite dev server (localhost:5173): tries ws://localhost:3000/ws
   * - If served from MMO server directly (localhost:3000): uses ws://localhost:3000/ws
   */
  detectServerUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const { protocol, hostname, port } = window.location;
    // Dev mode: Vite runs on 5173, server runs on 3000
    if (hostname === 'localhost' && (port === '5173' || port === '4173')) {
      return 'ws://localhost:3000/ws';
    }
    // Production: same origin, convert protocol
    const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${window.location.host}/ws`;
  }

  /** Returns true if we're running in a deployed/hosted environment */
  isHosted(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  }
}

export const net = new NetworkClient();

// ===== AUTHORITATIVE MODE HELPERS =====

// Send authentication to server
export function sendAuth(name: string, vocation: string) {
  net.send({ kind: 'auth', payload: { name, vocation } });
}

// Send an intent to the server (client never modifies state directly in auth mode)
export function sendIntent(intent: Omit<Intent, 'timestamp'>) {
  net.send({ kind: 'intent', payload: { ...intent, timestamp: Date.now() } });
}

// Get the latest server snapshot (null if not in authoritative mode)
let latestSnapshot: ServerSnapshot | null = null;
export function setSnapshot(s: ServerSnapshot | null) { latestSnapshot = s; }
export function getSnapshot(): ServerSnapshot | null { return latestSnapshot; }

// Check if we're connected to an authoritative server
export function isAuthoritative(): boolean {
  return net.mode === 'online' && net.isConnected();
}

// Helper: announce this player's state to the network
export function broadcastPlayer(player: NetPlayer) {
  net.send({ kind: 'player:move', payload: player });
}

export function broadcastChat(sender: string, text: string, color: string, channel: string) {
  net.send({ kind: 'chat', payload: { id: `chat_${Date.now()}_${Math.random()}`, sender, text, color, time: Date.now(), channel } });
}

export function broadcastWorldEvent(event: any) {
  net.send({ kind: 'world-event', payload: event });
}
