import type {
  LessonPlan,
  LessonSection,
  QuizQuestion,
  CodingTask,
  Difficulty,
  SectionType,
  DocRef,
} from '../types';
import { parseJson, type AiProvider } from './provider';
import { loadDocsForLanguage, formatDocsForPrompt } from './docs';

const SYSTEM = `You are Professor AI, a senior software engineer and pedagogue.

Rules:
- Ground every lesson in the real documentation excerpts provided. Prefer them over general knowledge.
- NEVER give direct answers to a learner's question. Only hints, guiding questions, and concept explanations.
- Design genuinely interactive lessons: mix content, quizzes, open questions, problem-solving challenges, and coding exercises.
- Coding exercises must be realistic and solvable. Include starter code, acceptance criteria, and progressive hints.
- Be concise. Use Markdown. No filler.

Output contract: respond ONLY with a JSON object matching the requested schema. No prose outside the JSON.`;

export interface GenerationRequest {
  goal: string;
  language: string;
  difficulty: Difficulty;
  provider: AiProvider;
  signal?: AbortSignal;
  /** When true, generate only the recommended core sections. */
  partial?: boolean;
}

export interface GenerationResult {
  plan: LessonPlan;
  docs: DocRef[];
}

/**
 * Step 1: ask the AI whether the (goal, language) pair is feasible, using the
 * real docs as context. Returns a feasibility verdict plus a friendly message.
 */
export async function assessFeasibility(
  goal: string,
  language: string,
  provider: AiProvider,
  signal?: AbortSignal
): Promise<{ feasible: boolean; message: string; suggestions: string[] }> {
  const docs = await loadDocsForLanguage(language);
  const docBlock = formatDocsForPrompt(docs);

  const res = await provider.chat(
    [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `Goal: "${goal}"\nLanguage: ${language}\n\n${docBlock}\n\nIs it feasible to teach "${goal}" in ${language} using real documentation? Respond with JSON:
{
  "feasible": boolean,
  "message": "short explanation",
  "suggestions": ["alternative goal or language if not feasible"]
}`,
      },
    ],
    { json: true, signal }
  );
  return parseJson(res);
}

/**
 * Step 2: generate the full (or partial) lesson plan.
 */
export async function generateLessonPlan(
  req: GenerationRequest
): Promise<GenerationResult> {
  const docs = await loadDocsForLanguage(req.language);
  const docBlock = formatDocsForPrompt(docs);

  const maxSections = req.partial ? 4 : 8;

  /**
   * Difficulty-affected scaffolding guidance for the LLM.
   */
  const scaffoldGuidance = req.difficulty === 'beginner'
    ? 'Provide generous step-by-step guidance, smaller steps, and more hints.'
    : req.difficulty === 'intermediate'
      ? 'Balance guidance with independence. Some scaffolding, but encourage problem-solving.'
      : 'Give minimal guidance. Assume the learner can work through challenges independently.';

  const res = await req.provider.chat(
    [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `You are building a GOAL-DRIVEN COURSE. The learner said: "${req.goal}".
Their final result must be a working ${req.goal} built in ${req.language}.

${scaffoldGuidance}

Difficulty: ${req.difficulty}
Max sections: ${maxSections}

${docBlock}

Generate a lesson plan that takes the learner on this exact journey:
- Start with ONLY the fundamentals they need for ${req.goal}
- Build the project in stages — each section adds a real, working piece toward the final result
- End with a capstone where they assemble, test, and extend ${req.goal} themselves
- Skip unrelated topics; explain why each lesson matters to the final project
- Include checkpoints (quizzes/challenges) between major stages

Respond with JSON:
{
  "title": string,
  "description": string (2-3 sentences),
  "categoryName": string,
  "categoryIcon": string (one of: code, gamepad, puzzle, smartphone, globe, database, cpu, brush, music, book, rocket, wrench),
  "docs": [{"title": string, "url": string}],
  "sections": [
    {
      "id": string,
      "type": "content" | "quiz" | "question" | "challenge" | "coding",
      "title": string,
      "content": string,
      "prompt": string,
      "questions": [{"id": string, "question": string, "options": string[], "correctIndex": number, "explanation": string}],
      "task": {"prompt": string, "language": string, "starterCode": string, "criteria": string[], "solution": string, "hints": string[]},
      "hints": string[]
    }
  ]
}

Requirements:
- Each section MUST build toward "${req.goal}" — no abstract exercises
- Include at least one quiz AND one coding exercise per stage
- Coding starter code must be complete, runnable, commented
- Quiz questions: exactly 4 options, clear correct answer grounded in docs
- Hints guide; NEVER reveal the answer
- Keep total response under 4000 tokens when partial`,
      },
    ],
    { json: true, signal: req.signal }
  );

  const data = parseJson<{
    title: string;
    description: string;
    categoryName: string;
    categoryIcon: string;
    docs?: DocRef[];
    sections?: Array<{
      id?: string;
      type?: SectionType;
      title?: string;
      content?: string;
      prompt?: string;
      queries?: QuizQuestion[];
      questions?: QuizQuestion[];
      task?: CodingTask;
      hints?: string[];
    }>;
  }>(res);

  const sections: LessonSection[] = (data.sections ?? []).map((s, i) => ({
    id: s.id ?? `s${i}`,
    type: (s.type as SectionType) ?? 'content',
    title: s.title ?? `Section ${i + 1}`,
    content: s.content,
    prompt: s.prompt,
    questions: (s.queries ?? s.questions ?? []) as QuizQuestion[],
    task: s.task as CodingTask | undefined,
    hints: s.hints ?? [],
  }));

  return {
    plan: {
      id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: data.title ?? req.goal,
      description: data.description ?? '',
      goal: req.goal,
      language: req.language,
      difficulty: req.difficulty,
      categoryId: '',
      categoryName: data.categoryName ?? 'General',
      categoryIcon: data.categoryIcon ?? 'code',
      docs: (data.docs ?? []) as DocRef[],
      sections,
      visibility: 'private' as const,
      partial: req.partial ?? false,
      ownerId: '',
      ownerName: '',
      createdAt: new Date().toISOString(),
    },
    docs: (data.docs ?? []) as DocRef[],
  };
}