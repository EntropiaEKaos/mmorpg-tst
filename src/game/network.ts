// ===================================================================
//  REAL-TIME NETWORKING for Mor'ia
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
  from: string;
  payload?: any;
  time: number;
}

export interface Intent {
  type: 'move' | 'attack' | 'cast' | 'use_item' | 'equip' | 'unequip' |
        'pickup' | 'drop' | 'talk_npc' | 'buy' | 'sell' | 'deposit' |
        'train' | 'rest' | 'mount' | 'travel' | 'socket_gem' | 'talent' |
        'talent_reset' | 'quest_accept' | 'quest_complete' |
        'adventure_start' | 'adventure_abandon' | 'adventure_claim' | 'official';
  payload: any;
  timestamp: number;
}

export interface ServerSnapshot {
  player: any;
  nearbyPlayers: any[];
  monsters: any[];
  groundItems: any[];
  events: any[];
  official?: any;
}

type Handler = (msg: NetMessage) => void;

class NetworkClient {
  private clientId: string;
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private handlers: Handler[] = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private authPayload: { sessionToken: string; characterName: string } | null = null;
  private manuallyDisconnected = false;
  public mode: 'offline' | 'local' | 'online' = 'offline';
  public serverUrl: string | null = null;

  constructor() {
    this.clientId = `c_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  }

  on(handler: Handler) {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter(h => h !== handler); };
  }

  private emit(msg: NetMessage) {
    for (const h of this.handlers) {
      try { h(msg); } catch {}
    }
  }

  connectLocal(): boolean {
    try {
      if (typeof BroadcastChannel === 'undefined') return false;
      this.channel = new BroadcastChannel('moria_mmorpg');
      this.channel.onmessage = ev => this.emit(ev.data as NetMessage);
      this.mode = 'local';
      this.send({ kind: 'presence-request', payload: { id: this.clientId }, time: Date.now() });
      return true;
    } catch {
      return false;
    }
  }

  connectOnline(explicitUrl?: string): Promise<boolean> {
    return new Promise(resolve => {
      const url = explicitUrl || this.serverUrl || this.detectServerUrl() || '';
      if (!url) { resolve(false); return; }
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve(this.ws.readyState === WebSocket.OPEN);
        return;
      }
      this.manuallyDisconnected = false;
      try {
        const socket = new WebSocket(url);
        this.ws = socket;
        let resolved = false;
        const finish = (value: boolean) => { if (!resolved) { resolved = true; resolve(value); } };
        socket.onopen = () => {
          this.mode = 'online';
          this.serverUrl = url;
          this.startHeartbeat();
          this.enableAutoReconnect();
          if (this.authPayload) this.sendAuthPayload();
          finish(true);
        };
        socket.onmessage = ev => {
          try {
            const msg = JSON.parse(ev.data) as NetMessage;
            if (msg.kind === 'auth_error') setSnapshot(null);
            this.emit(msg);
          } catch {}
        };
        socket.onerror = () => finish(false);
        socket.onclose = () => {
          if (this.ws === socket) this.ws = null;
          setSnapshot(null);
          this.mode = this.channel ? 'local' : 'offline';
        };
        setTimeout(() => finish(false), 3000);
      } catch {
        resolve(false);
      }
    });
  }

  setAuthPayload(sessionToken: string, characterName: string) {
    this.authPayload = { sessionToken, characterName };
  }

  clearAuthPayload() {
    this.authPayload = null;
  }

  private sendAuthPayload() {
    if (!this.authPayload || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const message = { kind: 'auth', from: this.clientId, time: Date.now(), payload: this.authPayload };
    try { this.ws.send(JSON.stringify(message)); } catch {}
  }

  send(msg: Omit<NetMessage, 'from' | 'time'> & { from?: string; time?: number }) {
    const full: NetMessage = { from: this.clientId, time: Date.now(), ...msg } as NetMessage;
    try { this.channel?.postMessage(full); } catch {}
    try { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(full)); } catch {}
  }

  startHeartbeat() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try { this.ws.send(JSON.stringify({ kind: 'ping', from: this.clientId, time: Date.now() })); } catch {}
      }
    }, 20000);
  }

  enableAutoReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setInterval(() => {
      if (this.manuallyDisconnected || !this.serverUrl) return;
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) void this.connectOnline(this.serverUrl);
    }, 5000);
  }

  disconnect() {
    this.manuallyDisconnected = true;
    this.send({ kind: 'player:leave', payload: { id: this.clientId } });
    try { this.channel?.close(); } catch {}
    try { this.ws?.close(); } catch {}
    this.channel = null;
    this.ws = null;
    this.mode = 'offline';
    setSnapshot(null);
    this.clearAuthPayload();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  get id() { return this.clientId; }
  isConnected(): boolean { return this.ws?.readyState === WebSocket.OPEN; }

  detectServerUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const { protocol, hostname, port } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && (port === '5173' || port === '4173')) {
      return `ws://${hostname}:3000/ws`;
    }
    const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${window.location.host}/ws`;
  }

  isHosted(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  }
}

export const net = new NetworkClient();

export function sendAuth(sessionToken: string, characterName: string) {
  net.setAuthPayload(sessionToken, characterName);
  net.send({ kind: 'auth', payload: { sessionToken, characterName } });
}

export function sendIntent(intent: Omit<Intent, 'timestamp'>) {
  net.send({ kind: 'intent', payload: { ...intent, timestamp: Date.now() } });
}

let latestSnapshot: ServerSnapshot | null = null;
export function setSnapshot(s: ServerSnapshot | null) { latestSnapshot = s; }
export function getSnapshot(): ServerSnapshot | null { return latestSnapshot; }

export function isAuthoritative(): boolean {
  return net.mode === 'online' && net.isConnected();
}

export function broadcastPlayer(player: NetPlayer) {
  net.send({ kind: 'player:move', payload: player });
}

export function broadcastChat(sender: string, text: string, color: string, channel: string) {
  net.send({ kind: 'chat', payload: { id: `chat_${Date.now()}_${Math.random()}`, sender, text, color, time: Date.now(), channel } });
}

export function broadcastWorldEvent(event: any) {
  net.send({ kind: 'world-event', payload: event });
}
