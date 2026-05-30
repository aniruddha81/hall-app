import * as SecureStore from 'expo-secure-store';

import type { StudentData } from '@/lib/types';

const SESSION_KEY = 'ruet_session_id';
const USER_KEY = 'ruet_student_user';

export async function saveSessionId(sessionId: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, sessionId);
}

export async function getSessionId(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function clearSessionId(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function saveUser(user: StudentData): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<StudentData | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as StudentData) : null;
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([clearSessionId(), clearUser()]);
}

/** Parse sessionId from Set-Cookie header on login/register responses. */
export function parseSessionIdFromSetCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/sessionId=([^;,\s]+)/);
  return match?.[1] ?? null;
}

/** Combine multiple Set-Cookie values (fetch may return comma-separated). */
export function extractSessionIdFromHeaders(headers: Headers): string | null {
  const setCookie = headers.get('set-cookie');
  return parseSessionIdFromSetCookie(setCookie);
}
