import {
  collection,
  where,
  query,
  getDocs,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

/**
 * Dedupe by verified email: if another account with the same verified email
 * exists, return its UID so we can surface a friendly conflict message.
 */
export async function findDuplicateAccount(uid: string, email: string): Promise<string | null> {
  if (!email.includes('@')) return null;
  const lower = email.toLowerCase();
  const snap = await getDocs(
    query(collection(getFirebaseDb(), 'users'), where('emailLower', '==', lower))
  );
  for (const d of snap.docs) {
    if (d.id !== uid && (d.data().emailVerified as boolean | undefined)) return d.id;
  }
  return null;
}

/** Minimal session cache keyed by (action, params). Invalidated by React state. */
export const sessionCache = new Map<string, unknown>();

export function invalidateSession(): void {
  sessionCache.clear();
}