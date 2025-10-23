import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import type { SessionUser, UserRecord } from '../types';
import { getUserById, updateUserTimestamp } from './userStore';

const SESSION_COOKIE = 'amana_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET environment variable');
  }
  return secret;
}

function toSessionUser(user: UserRecord): SessionUser {
  const { passwordHash, ...sessionUser } = user;
  return sessionUser;
}

export async function createSessionToken(userId: string) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function applySessionCookie(response: NextResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    maxAge: 0,
    path: '/',
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getSecret()) as jwt.JwtPayload;
    if (!payload?.sub || typeof payload.sub !== 'string') {
      return null;
    }

    const user = await getUserById(payload.sub);
    if (!user) return null;

    // Update last seen timestamp for activity tracking
    await updateUserTimestamp(user.id);

    return toSessionUser(user);
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS };
