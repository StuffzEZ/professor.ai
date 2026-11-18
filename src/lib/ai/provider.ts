import { POLLINATIONS_URL, POLLINATIONS_MODEL, professorEndpoint, hasProfessorKey } from '../config';
import type { ProviderId } from '../types';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  /** Ask for strict JSON output. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AiProvider {
  id: ProviderId;
  name: string;
  chat(messages: AiMessage[], opts?: ChatOptions): Promise<string>;
}

/**
 * Generic OpenAI-compatible chat completion. Works with the Professor AI
 * endpoint, Pollinations, and any user-supplied custom endpoint.
 */
async function openAiCompatibleChat(
  baseUrl: string,
  apiKey: string | undefined,
  model: string,
  messages: AiMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    signal: opts.signal,
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiError(
      `AI request failed (${res.status}). ${body.slice(0, 200)}`,
      res.status
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AiError('AI returned an empty response.');
  return content;
}

export class AiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AiError';
    this.status = status;
  }
}

/**
 * The default "Professor AI" provider.
 *
 * When a dedicated endpoint is configured (VITE_PROFESSOR_API_URL) it is used.
 * Otherwise it transparently falls back to Pollinations AI so the app works
 * out of the box on the free tier. Either way, client-side + Firestore quota
 * limits apply (see store.reserveGeneration).
 */
export const professorProvider: AiProvider = {
  id: 'professor',
  name: 'Professor AI',
  chat: (messages, opts) => {
    if (professorEndpoint.url && hasProfessorKey) {
      return openAiCompatibleChat(
        professorEndpoint.url,
        professorEndpoint.key || undefined,
        professorEndpoint.model,
        messages,
        opts
      );
    }
    // No dedicated endpoint or no key — fall back to free Pollinations AI.
    return openAiCompatibleChat(POLLINATIONS_URL, undefined, POLLINATIONS_MODEL, messages, opts);
  },
};

export const pollinationsProvider: AiProvider = {
  id: 'pollinations',
  name: 'Pollinations AI',
  chat: (messages, opts) =>
    openAiCompatibleChat(POLLINATIONS_URL, undefined, POLLINATIONS_MODEL, messages, opts),
};

export function customProvider(baseUrl: string, apiKey: string, model: string): AiProvider {
  return {
    id: 'custom',
    name: 'Custom endpoint',
    chat: (messages, opts) => openAiCompatibleChat(baseUrl, apiKey || undefined, model, messages, opts),
  };
}

/**
 * Robustly extract a JSON object from a model response: strips code fences,
 * finds the outermost balanced braces.
 */
export function parseJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new AiError('The AI response did not contain valid JSON. Please try again.');
  }
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    throw new AiError('Could not parse the AI response. Please try again.');
  }
}
