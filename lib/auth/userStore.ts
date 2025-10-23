import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { SessionUser, UserRecord } from '../types';

const USERS_FILE = process.env.AUTH_USERS_PATH
  ? path.resolve(process.env.AUTH_USERS_PATH)
  : path.join(process.cwd(), 'data', 'users.json');
const DATA_DIR = path.dirname(USERS_FILE);

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, '[]', 'utf8');
  }
}

void (async () => {
  try {
    await ensureDataFile();
  } catch (error) {
    console.error('Failed to prepare user store data directory', error);
  }
})();

async function readUsers(): Promise<UserRecord[]> {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw) as UserRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((user) => ({
      ...user,
      email: user.email.toLowerCase(),
    }));
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]) {
  await ensureDataFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  const normalized = email.trim().toLowerCase();
  const users = await readUsers();
  return users.find((user) => user.email === normalized);
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const users = await readUsers();
  return users.find((user) => user.id === id);
}

export async function listUsers(): Promise<SessionUser[]> {
  const users = await readUsers();
  return users.map(({ passwordHash, ...rest }) => rest);
}

export async function createUser(params: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const email = params.email.trim().toLowerCase();
  const users = await readUsers();
  const now = new Date().toISOString();

  const newUser: UserRecord = {
    id: randomUUID(),
    email,
    name: params.name.trim(),
    passwordHash: params.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
}

export async function updateUserTimestamp(id: string) {
  const users = await readUsers();
  const idx = users.findIndex((user) => user.id === id);
  if (idx === -1) return;

  users[idx] = {
    ...users[idx],
    updatedAt: new Date().toISOString(),
  };

  await writeUsers(users);
}
