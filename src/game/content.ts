// ============ BOOK SYSTEM ============
export interface Book {
  id: string;
  title: string;
  icon: string;
  author: string;
  pages: string[];
  color: string;
  createdAt: number;
}

const BOOKS_KEY = 'moria_books';
const READ_BOOKS_KEY = (playerName: string) => `moria_read_books_${playerName}`;

export function getAllBooks(): Book[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKS_KEY) || '[]');
  } catch { return []; }
}

export function saveBook(book: Book) {
  const books = getAllBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) books[idx] = book;
  else books.push(book);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function deleteBook(id: string) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(getAllBooks().filter((b) => b.id !== id)));
}

export function getReadBooks(playerName: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_BOOKS_KEY(playerName)) || '[]');
  } catch { return []; }
}

export function markBookRead(playerName: string, bookId: string) {
  const read = getReadBooks(playerName);
  if (!read.includes(bookId)) {
    read.push(bookId);
    localStorage.setItem(READ_BOOKS_KEY(playerName), JSON.stringify(read));
  }
}

// ============ MAIL SYSTEM ============
export interface MailItem {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  gold?: number;
  attachedItem?: { name: string; icon: string; value: number };
  sentAt: number;
  read: boolean;
  claimed: boolean;
  isSystem?: boolean;
}

const MAIL_KEY = (playerName: string) => `moria_mail_${playerName}`;

export function getMail(playerName: string): MailItem[] {
  try {
    return JSON.parse(localStorage.getItem(MAIL_KEY(playerName)) || '[]');
  } catch { return []; }
}

export function saveMail(playerName: string, mail: MailItem[]) {
  localStorage.setItem(MAIL_KEY(playerName), JSON.stringify(mail));
}

export function sendMail(mail: Omit<MailItem, 'id' | 'sentAt' | 'read' | 'claimed'>): void {
  const inbox = getMail(mail.to);
  inbox.push({
    ...mail,
    id: `mail_${Date.now()}_${Math.random()}`,
    sentAt: Date.now(),
    read: false,
    claimed: false,
  });
  saveMail(mail.to, inbox);
}

// System mail (from NPC/events to player)
export function sendSystemMail(playerName: string, from: string, subject: string, body: string, gold = 0, attachedItem?: { name: string; icon: string; value: number }) {
  sendMail({ from, to: playerName, subject, body, gold, attachedItem, isSystem: true });
}

export function markMailRead(playerName: string, mailId: string) {
  const mail = getMail(playerName).map((m) => m.id === mailId ? { ...m, read: true } : m);
  saveMail(playerName, mail);
}

export function claimMail(playerName: string, mailId: string): MailItem | null {
  const mail = getMail(playerName);
  const item = mail.find((m) => m.id === mailId);
  if (!item || item.claimed) return null;
  item.claimed = true;
  item.read = true;
  saveMail(playerName, mail);
  return item;
}

export function deleteMail(playerName: string, mailId: string) {
  saveMail(playerName, getMail(playerName).filter((m) => m.id !== mailId));
}

// ============ CUSTOM NPC SYSTEM ============
export interface CustomNPC {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  posX: number;
  posY: number;
  dialogueText: string;
  createdAt: number;
}

const NPC_KEY = 'moria_custom_npcs';

export function getCustomNPCs(): CustomNPC[] {
  try {
    return JSON.parse(localStorage.getItem(NPC_KEY) || '[]');
  } catch { return []; }
}

export function saveCustomNPC(npc: CustomNPC) {
  const npcs = getCustomNPCs();
  const idx = npcs.findIndex((n) => n.id === npc.id);
  if (idx >= 0) npcs[idx] = npc;
  else npcs.push(npc);
  localStorage.setItem(NPC_KEY, JSON.stringify(npcs));
}

export function deleteCustomNPC(id: string) {
  localStorage.setItem(NPC_KEY, JSON.stringify(getCustomNPCs().filter((n) => n.id !== id)));
}

// ============ CUSTOM MONSTER SYSTEM ============
export interface CustomMonster {
  id: string;
  name: string;
  emoji: string;
  color: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  size: number;
  type: 'normal' | 'elite' | 'boss';
  level: number;
  posX: number;
  posY: number;
  createdAt: number;
}

const MONSTER_KEY = 'moria_custom_monsters';

export function getCustomMonsters(): CustomMonster[] {
  try {
    return JSON.parse(localStorage.getItem(MONSTER_KEY) || '[]');
  } catch { return []; }
}

export function saveCustomMonster(monster: CustomMonster) {
  const monsters = getCustomMonsters();
  const idx = monsters.findIndex((m) => m.id === monster.id);
  if (idx >= 0) monsters[idx] = monster;
  else monsters.push(monster);
  localStorage.setItem(MONSTER_KEY, JSON.stringify(monsters));
}

export function deleteCustomMonster(id: string) {
  localStorage.setItem(MONSTER_KEY, JSON.stringify(getCustomMonsters().filter((m) => m.id !== id)));
}

// ============ UI LAYOUT SYSTEM (editable backpacks/panels) ============
export interface UILayout {
  panelOrder: string[]; // ordered list of panel ids
  scale: number;
}

const UI_KEY = (playerName: string) => `moria_ui_layout_${playerName}`;

export function getUILayout(playerName: string): UILayout {
  try {
    const layout = JSON.parse(localStorage.getItem(UI_KEY(playerName)) || 'null');
    if (layout) return layout;
  } catch {}
  return { panelOrder: ['inv', 'char', 'quests', 'talents', 'bestiary', 'dps', 'mail', 'books'], scale: 1 };
}

export function saveUILayout(playerName: string, layout: UILayout) {
  localStorage.setItem(UI_KEY(playerName), JSON.stringify(layout));
}
