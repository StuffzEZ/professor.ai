import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  increment,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import {
  QUOTA,
  type Category,
  type Difficulty,
  type LessonPlan,
  type LessonProgress,
  type PublicLessonSummary,
  type UsageRecord,
  type UserProfile,
} from './types';

/**
 * Firestore data layer.
 *
 * Design notes (see DECISIONS.md):
 * - All reads are single-shot (no realtime listeners) to stay well inside the
 *   Spark free tier. TanStack Query caches results in memory.
 * - Lists are paginated (limit 20) with cursor-based `startAfter`.
 * - Multi-document writes use `writeBatch` (max 500 ops) to reduce API calls.
 * - Quota counters live on per-day subcollections so rules can enforce limits
 *   with a single document read.
 */

const PAGE_SIZE = 20;

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', profile.uid), profile, { merge: true });
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Omit<UserProfile, 'uid'>>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), patch as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Usage / quotas
// ---------------------------------------------------------------------------

export async function getUsage(uid: string, date: string = todayKey()): Promise<UsageRecord> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid, 'usage', date));
  if (snap.exists()) return snap.data() as UsageRecord;
  return { date, generations: 0, publishes: 0, lastGenerationAt: 0 };
}

/**
 * Reserve one generation slot. Throws a descriptive error when the quota is
 * exhausted. The Firestore rules enforce the same limits server-side, so this
 * client check is for UX only.
 */
export async function reserveGeneration(uid: string, profile: UserProfile): Promise<void> {
  const now = Date.now();
  const usage = await getUsage(uid);

  const inCooldown = profile.cooldownUntil > now;
  const dailyLimit = inCooldown ? QUOTA.COOLDOWN_DAILY_GENERATIONS : QUOTA.DAILY_GENERATIONS;

  if (usage.generations >= dailyLimit) {
    const when = inCooldown
      ? `your account is in its first ${QUOTA.COOLDOWN_DAYS} days, so the limit is ${QUOTA.COOLDOWN_DAILY_GENERATIONS}/day`
      : `the daily limit is ${QUOTA.DAILY_GENERATIONS} generations`;
    throw new QuotaError(
      `Daily generation limit reached. ${when}. Try again tomorrow, or use an existing lesson.`
    );
  }

  if (now - usage.lastGenerationAt < QUOTA.MIN_GENERATION_GAP_MS) {
    const wait = Math.ceil((QUOTA.MIN_GENERATION_GAP_MS - (now - usage.lastGenerationAt)) / 1000);
    throw new QuotaError(`Please wait ${wait}s between generations.`);
  }

  await updateDoc(doc(getFirebaseDb(), 'users', uid, 'usage', usage.date), {
    generations: increment(1),
    lastGenerationAt: now,
  });
}

export async function reservePublish(uid: string): Promise<void> {
  const usage = await getUsage(uid);
  if (usage.publishes >= QUOTA.MONTHLY_PUBLISHES) {
    throw new QuotaError(
      `Monthly publish limit reached (${QUOTA.MONTHLY_PUBLISHES}). You can still keep lessons private.`
    );
  }
  await updateDoc(doc(getFirebaseDb(), 'users', uid, 'usage', usage.date), {
    publishes: increment(1),
  });
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories(
  uid: string,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: Category[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const base = query(
    collection(getFirebaseDb(), 'users', uid, 'categories'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data() as Category);
  const last = snap.docs[snap.docs.length - 1];
  return {
    items,
    nextCursor: snap.docs.length === PAGE_SIZE && last ? last : null,
  };
}

/**
 * Find or create a category by name (case-insensitive). Returns the category
 * and whether it was newly created.
 */
export async function findOrCreateCategory(
  uid: string,
  name: string,
  icon: string
): Promise<{ category: Category; created: boolean }> {
  const snap = await getDocs(
    query(
      collection(getFirebaseDb(), 'users', uid, 'categories'),
      where('nameLower', '==', name.trim().toLowerCase())
    )
  );
  if (!snap.empty) {
    const d = snap.docs[0];
    return { category: d.data() as Category, created: false };
  }

  const id = `cat_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const category: Category = {
    id,
    name: name.trim(),
    icon,
    ownerId: uid,
    lessonCount: 0,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(getFirebaseDb(), 'users', uid, 'categories', id), {
    ...category,
    nameLower: name.trim().toLowerCase(),
  });
  return { category, created: true };
}

export async function incrementCategoryLessonCount(uid: string, categoryId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid, 'categories', categoryId), {
    lessonCount: increment(1),
  });
}

// ---------------------------------------------------------------------------
// Lessons (private, owned)
// ---------------------------------------------------------------------------

export async function saveLesson(lesson: LessonPlan): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', lesson.ownerId, 'lessons', lesson.id), lesson);
}

export async function getLesson(uid: string, lessonId: string): Promise<LessonPlan | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid, 'lessons', lessonId));
  return snap.exists() ? (snap.data() as LessonPlan) : null;
}

export async function listLessons(
  uid: string,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: LessonPlan[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const base = query(
    collection(getFirebaseDb(), 'users', uid, 'lessons'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data() as LessonPlan);
  const last = snap.docs[snap.docs.length - 1];
  return {
    items,
    nextCursor: snap.docs.length === PAGE_SIZE && last ? last : null,
  };
}

export async function deleteLesson(uid: string, lessonId: string): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  batch.delete(doc(getFirebaseDb(), 'users', uid, 'lessons', lessonId));
  batch.delete(doc(getFirebaseDb(), 'users', uid, 'progress', lessonId));
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Public lessons
// ---------------------------------------------------------------------------

export async function publishLesson(lesson: LessonPlan): Promise<void> {
  const summary: PublicLessonSummary = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    language: lesson.language,
    difficulty: lesson.difficulty,
    categoryName: lesson.categoryName,
    categoryIcon: lesson.categoryIcon,
    ownerName: lesson.ownerName,
    sectionCount: lesson.sections.length,
    createdAt: lesson.createdAt,
  };
  const batch = writeBatch(getFirebaseDb());
  batch.set(doc(getFirebaseDb(), 'publicLessons', lesson.id), {
    ...summary,
    ownerId: lesson.ownerId,
    plan: lesson,
  });
  batch.update(doc(getFirebaseDb(), 'users', lesson.ownerId, 'lessons', lesson.id), {
    visibility: 'public',
  });
  await batch.commit();
}

export async function unpublishLesson(uid: string, lessonId: string): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  batch.delete(doc(getFirebaseDb(), 'publicLessons', lessonId));
  batch.update(doc(getFirebaseDb(), 'users', uid, 'lessons', lessonId), {
    visibility: 'private',
  });
  await batch.commit();
}

export async function listPublicLessons(
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ items: PublicLessonSummary[]; nextCursor: QueryDocumentSnapshot<DocumentData> | null }> {
  const base = query(
    collection(getFirebaseDb(), 'publicLessons'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data() as PublicLessonSummary);
  const last = snap.docs[snap.docs.length - 1];
  return {
    items,
    nextCursor: snap.docs.length === PAGE_SIZE && last ? last : null,
  };
}

export async function getPublicLesson(lessonId: string): Promise<LessonPlan | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'publicLessons', lessonId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return (data.plan as LessonPlan) ?? null;
}

/** Copy a public lesson into the caller's own library. */
export async function copyPublicLesson(
  lesson: LessonPlan,
  uid: string,
  displayName: string
): Promise<LessonPlan> {
  const id = `lsn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const copy: LessonPlan = {
    ...lesson,
    id,
    ownerId: uid,
    ownerName: displayName,
    visibility: 'private',
    createdAt: new Date().toISOString(),
  };
  await saveLesson(copy);
  return copy;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export async function getProgress(uid: string, lessonId: string): Promise<LessonProgress | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid, 'progress', lessonId));
  return snap.exists() ? (snap.data() as LessonProgress) : null;
}

export async function saveProgress(progress: LessonProgress): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', progress.userId, 'progress', progress.lessonId), {
    ...progress,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/**
 * Disposable / temporary email domains that are blocked at sign-up.
 * Kept intentionally small and public — see DECISIONS.md for why this is
 * deterrence, not a guarantee.
 */
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.net',
  'getnada.com',
  'trashmail.com',
  'trashmail.de',
  'fakeinbox.com',
  'maildrop.cc',
  'discard.email',
  'mailnesia.com',
  'tempinbox.com',
  'burnermail.io',
  'moakt.com',
  'spamgourmet.com',
  'mytemp.email',
  'tmpmail.net',
  'tmpmail.org',
  'dispostable.com',
  'mailcatch.com',
  'mintemail.com',
  'spam4.me',
  '33mail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return Boolean(domain) && DISPOSABLE_DOMAINS.has(domain);
}

export function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}
