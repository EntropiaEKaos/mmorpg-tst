import type { Account } from './types';

const TOKEN_KEY = 'moria_session_token';

interface ServerCharacter {
  name: string;
  vocation: string;
  createdAt: number;
}

interface ServerAccount {
  id: string;
  username: string;
  createdAt: number;
  characters: ServerCharacter[];
}

interface AuthResponse {
  account: ServerAccount;
  sessionToken: string;
  expiresAt: number;
  recoveryCode?: string;
}

function apiBase(): string {
  if (typeof window === 'undefined') return '';
  const { hostname, port } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && (port === '5173' || port === '4173')) {
    return `http://${hostname}:3000`;
  }
  return '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  let body: any = null;
  try { body = await response.json(); } catch {}
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
  return body as T;
}

function selectedAccount(server: ServerAccount, token: string, character?: ServerCharacter): Account {
  const chosen = character || server.characters?.[0];
  if (!chosen) throw new Error('This account has no character yet');
  return {
    accountId: server.id,
    username: server.username,
    password: '', // legacy type field only; credentials are never stored client-side
    characterName: chosen.name,
    vocation: chosen.vocation,
    level: 1,
    created: chosen.createdAt || server.createdAt,
    sessionToken: token,
  } as Account;
}

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeSessionToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerAccount(username: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  storeSessionToken(result.sessionToken);
  return result;
}

export async function loginAccount(username: string, password: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  storeSessionToken(result.sessionToken);
  return result;
}

export async function createCharacter(sessionToken: string, name: string, vocation: string): Promise<{ account: ServerAccount; character: ServerCharacter }> {
  return request('/api/characters', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify({ name, vocation }),
  });
}

export async function resumeSession(): Promise<Account | null> {
  const token = getStoredSessionToken();
  if (!token) return null;
  try {
    const result = await request<AuthResponse>('/api/auth/session', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    storeSessionToken(result.sessionToken);
    if (!result.account.characters?.length) return null;
    return selectedAccount(result.account, result.sessionToken);
  } catch {
    clearSessionToken();
    return null;
  }
}

export async function logoutSession(token?: string) {
  const sessionToken = token || getStoredSessionToken();
  clearSessionToken();
  if (!sessionToken) return;
  try {
    await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: '{}',
    });
  } catch {}
}

export async function recoverAccount(username: string, recoveryCode: string, newPassword: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>('/api/auth/recover', {
    method: 'POST',
    body: JSON.stringify({ username, recoveryCode, newPassword }),
  });
  storeSessionToken(result.sessionToken);
  return result;
}

export function toGameAccount(server: ServerAccount, token: string, character?: ServerCharacter): Account {
  return selectedAccount(server, token, character);
}

export type { ServerAccount, ServerCharacter, AuthResponse };
