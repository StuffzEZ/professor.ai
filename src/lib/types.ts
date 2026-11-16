/**
 * Core domain types for Professor AI.
 */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ProviderId = 'professor' | 'pollinations' | 'custom';

export type SectionType = 'content' | 'quiz' | 'question' | 'coding' | 'challenge';

export interface DocRef {
  title: string;
  url: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodingTask {
  prompt: string;
  language: string;
  starterCode: string;
  /** Human-readable acceptance criteria shown to the learner. */
  criteria: string[];
  /** Hidden reference solution, revealed only after the learner opts in. */
  solution: string;
  hints: string[];
}

export interface LessonSection {
  id: string;
  type: SectionType;
  title: string;
  /** Markdown content for content/challenge sections. */
  content?: string;
  /** For quiz sections. */
  questions?: QuizQuestion[];
  /** For question sections: the open question to answer. */
  prompt?: string;
  /** For coding sections. */
  task?: CodingTask;
  /** Progressive hints available for any section. */
  hints?: string[];
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  goal: string;
  language: string;
  difficulty: Difficulty;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  docs: DocRef[];
  sections: LessonSection[];
  visibility: 'public' | 'private';
  ownerId: string;
  ownerName: string;
  createdAt: string;
  /** True when only the recommended core parts were generated. */
  partial?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  lessonCount: number;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  provider: ProviderId;
  defaultDifficulty: Difficulty;
  onboardingComplete: boolean;
  createdAt: string;
  /** Epoch ms until which the account is in new-account cool-down. */
  cooldownUntil: number;
}

export interface UsageRecord {
  date: string; // YYYY-MM-DD
  generations: number;
  publishes: number;
  lastGenerationAt: number;
}

export interface LessonProgress {
  lessonId: string;
  userId: string;
  completedSections: string[];
  quizScores: Record<string, number>; // sectionId -> percent
  codingAttempts: Record<string, number>;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PublicLessonSummary {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: Difficulty;
  categoryName: string;
  categoryIcon: string;
  ownerName: string;
  sectionCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: number;
}

export interface CustomEndpoint {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface Settings {
  provider: ProviderId;
  defaultDifficulty: Difficulty;
  customEndpoint: CustomEndpoint | null;
}

/** Quota limits enforced client-side and mirrored in Firestore rules. */
export const QUOTA = {
  /** Generations per day for established accounts. */
  DAILY_GENERATIONS: 5,
  /** Generations per day during the first 7 days (new-account cool-down). */
  COOLDOWN_DAILY_GENERATIONS: 2,
  /** Cool-down window in days. */
  COOLDOWN_DAYS: 7,
  /** Publishes per 30 days. */
  MONTHLY_PUBLISHES: 10,
  /** Minimum seconds between two generations (rate limit). */
  MIN_GENERATION_GAP_MS: 30_000,
} as const;

export const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to this language. Start from the fundamentals.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Comfortable with basics, ready for real patterns.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced. Focus on depth, edge cases and performance.',
  },
];

export const CATEGORY_ICONS = [
  'code',
  'gamepad',
  'puzzle',
  'smartphone',
  'globe',
  'database',
  'cpu',
  'brush',
  'music',
  'book',
  'rocket',
  'wrench',
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];
