/**
 * Adaptive chat engine.
 *
 * The AI chat bar NEVER gives direct answers — only hints, guiding questions,
 * and concept explanations. This module is responsible for that constraint,
 * plus grounding responses in the same docs used when generating the lesson.
 */
import type { LessonSection } from '../types';
import { formatDocsForPrompt } from './docs';
import { loadDocsForLanguage } from './docs';
import type { AiProvider } from './provider';
import { parseJson } from './provider';

const CHAT_SYSTEM = `You are an adaptive learning coach embedded inside a coding lesson platform called "Professor AI". Your role is to help learners without giving away answers.

Hard rules (do not break these under any circumstances):
1. NEVER give the direct answer or write code the learner can copy-paste.
2. ALWAYS explain the underlying concept so the learner can reason toward the answer themselves.
3. Use Socratic questioning: ask what they tried, what happened, what they expected.
4. When stuck, provide progressive hints — not the solution. A hint should point at one missing piece, not reveal it.
5. Ground your responses in the provided real documentation excerpts. Cite the source if helpful.
6. Keep responses concise. 3-5 sentences unless more is genuinely needed.
7. Be warm, encouraging, and respectful of effort.`;

export interface ChatContext {
  lessonTitle: string;
  currentSection: LessonSection | null;
  language: string;
  code?: string;
  /** Number of hints the learner has already seen. */
  hintsSeen: number;
}

export async function chatWithLesson(
  userMessage: string,
  ctx: ChatContext,
  provider: AiProvider
): Promise<string> {
  const docs = await loadDocsForLanguage(ctx.language);
  const docBlock = formatDocsForPrompt(docs);
  const sectionInfo = ctx.currentSection
    ? `\nCurrent section: [${ctx.currentSection.type}] "${ctx.currentSection.title}"`
    : '';
  const codeInfo = ctx.code ? `\n\nCode attempt:\n\`\`\`${ctx.language}\n${ctx.code}\n\`\`\`` : '';
  const hintsInfo = ctx.hintsSeen > 0
    ? `\nPrevious hints shown (${ctx.hintsSeen}):\n${([
        ...(ctx.currentSection?.hints ?? []),
      ].slice(-ctx.hintsSeen).join('\n'))}`
    : '';

  const res = await provider.chat(
    [
      { role: 'system', content: CHAT_SYSTEM },
      {
        role: 'user',
        content: `Lesson context:
Goal: ${ctx.lessonTitle}
Language: ${ctx.language}${sectionInfo}
${hintsInfo}
Documentation excerpt:${docBlock}
Learner message:${codeInfo}
"${userMessage}"`,
      },
    ],
    { maxTokens: 600 }
  );
  return res.trim();
}

/**
 * Ask the chat to generate one progressive hint for a section, if available.
 * Returns null when no further hints exist.
 */
export async function nextHint(
  section: LessonSection,
  hintsSeen: number,
  provider: AiProvider
): Promise<string | null> {
  const hints = section.hints ?? [];
  if (hintsSeen >= hints.length) return null;

  const res = await provider.chat(
    [
      {
        role: 'system',
        content: `You are a learning assistant. The following section has ${hints.length} progressive hints (index 0..${hints.length - 1}). The user has seen ${hintsSeen} hints. Return ONLY the next hint as plain text — no preamble, no JSON, just the hint sentence(s). Max 2-3 sentences.`,
      },
      {
        role: 'user',
        content: `Section: "${section.title}" [${section.type}]\n${hints.map((h, i) => `Hint ${i}: ${h}`).join('\n')}\nLast hint shown: ${hintsSeen > 0 ? hints[hintsSeen - 1] : '(none)'}`,
      },
    ],
    { json: false }
  );
  return res.trim() || null;
}

/**
 * Extract structured JSON guidance from a chat response (used by the quiz
 * auto-grader and by the lesson completion heuristic).
 */
export function extractJson<T>(raw: string): T | null {
  try {
    return parseJson(raw);
  } catch {
    return null;
  }
}