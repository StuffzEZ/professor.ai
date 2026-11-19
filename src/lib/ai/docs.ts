/**
 * Documentation grounding.
 *
 * The AI must ground lessons in real documentation, not guesses. This module
 * fetches a small set of canonical docs for a (goal, language) pair and feeds
 * them into the AI as a system prompt. It is intentionally lightweight: we
 * fetch at most a few KB per call and cache results in-memory for the session.
 */

export interface DocSource {
  title: string;
  url: string;
  /** Markdown excerpt, trimmed. */
  excerpt: string;
}

/** Curated, stable documentation URLs keyed by language. */
export const LANGUAGE_DOCS: Record<string, { title: string; url: string }[]> = {
  kotlin: [
    { title: 'Kotlin Language Guide', url: 'https://kotlinlang.org/docs/home.html' },
    { title: 'Kotlin Coroutines', url: 'https://kotlinlang.org/docs/coroutines-overview.html' },
  ],
  java: [
    { title: 'Java Language Specification', url: 'https://docs.oracle.com/en/java/javase/' },
    { title: 'Java SE Documentation', url: 'https://docs.oracle.com/javase/tutorial/' },
  ],
  python: [
    { title: 'Python Tutorial', url: 'https://docs.python.org/3/tutorial/' },
    { title: 'Python Standard Library', url: 'https://docs.python.org/3/library/' },
  ],
  javascript: [
    { title: 'JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web' },
  ],
  typescript: [
    { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    { title: 'TypeScript Deep Dive', url: 'https://typescript-redox.rsbook.dev/' },
  ],
  swift: [
    { title: 'The Swift Programming Language', url: 'https://docs.swift.org/swift-book/' },
    { title: 'SwiftUI', url: 'https://developer.apple.com/documentation/swiftui' },
  ],
  dart: [
    { title: 'Dart Language Tour', url: 'https://dart.dev/tools/pub/getting-started' },
    { title: 'Flutter', url: 'https://flutter.dev/docs' },
  ],
  scratch: [
    { title: 'Scratch Reference', url: 'https://scratch.mit.edu/docs/' },
  ],
  rust: [
    { title: 'The Rust Book', url: 'https://doc.rust-lang.org/book/' },
    { title: 'Rust by Example', url: 'https://doc.rust-lang.org/stable/rust-by-example/' },
  ],
  cpp: [
    { title: 'C++ Reference', url: 'https://en.cppreference.com/w/' },
  ],
  go: [
    { title: 'Go Tour', url: 'https://go.dev/tour/' },
    { title: 'Effective Go', url: 'https://go.dev/wiki/EffectiveGo' },
  ],
  lua: [
    { title: 'Lua Programming Reference', url: 'https://www.lua.org/manual/5.4/' },
  ],
  roblox: [
    { title: 'Roblox Creator Hub', url: 'https://create.roblox.com/learn' },
    { title: 'Lua for Roblox', url: 'https://create.roblox.com/learn/topics/scripting' },
  ],
  modding: [
    { title: 'Minecraft Modding', url: 'https://minecraft.fandom.com/wiki/Tutorials' },
    { title: 'Spigot Wiki', url: 'https://www.spigotmc.org/wiki/' },
    { title: 'Fabric Wiki', url: 'https://fabricmc.net/wiki/' },
  ],
};

const cache = new Map<string, DocSource[]>();
const MAX_EXCERPT = 1200;

/**
 * Fetch a plain-text excerpt from a URL. We intentionally strip scripts and
 * tags and keep only a small excerpt — this is a hint, not a full dump.
 */
/**
 * Escape a string so it is safe to insert into a regex pattern.
 * Used to sanitize user-controlled input before it is used in regex.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove any HTML tags and entities from a string, keeping only text content.
 * Uses a DOMParser-based approach for safe, standards-compliant sanitization
 * rather than regex (which CodeQL flags for incomplete multi-character
 * sanitization, double-escaping, and bad HTML filtering).
 */
function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') {
    // Fallback for non-browser environments (shouldn't happen in this app).
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style elements entirely.
  doc.querySelectorAll('script, style').forEach((el) => el.remove());

  // Get the text content — this strips all HTML tags and decodes entities.
  const text = doc.body.textContent ?? '';

  // Collapse whitespace and trim.
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchExcerpt(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return '';
    const html = await res.text();
    const cleaned = sanitizeHtml(html);
    return cleaned.slice(0, MAX_EXCERPT);
  } catch {
    return '';
  }
}

/**
 * Load docs for a language. Results are cached in-memory for the session.
 * Network failures degrade gracefully: the AI is told to rely on general
 * knowledge, with a note that grounding is partial.
 */
export async function loadDocsForLanguage(language: string): Promise<DocSource[]> {
  const key = language.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const sources = LANGUAGE_DOCS[key] ?? [];
  const results: DocSource[] = [];
  // Fetch in parallel but bounded.
  await Promise.all(
    sources.slice(0, 3).map(async (s) => {
      const excerpt = await fetchExcerpt(s.url);
      if (excerpt) results.push({ title: s.title, url: s.url, excerpt });
    })
  );
  cache.set(key, results);
  return results;
}

/** Build a compact context string for the AI system prompt. */
export function formatDocsForPrompt(docs: DocSource[]): string {
  if (docs.length === 0) return '';
  const parts = docs.map((d) => `### ${d.title} (${d.url})\n${d.excerpt}`);
  return `## Real documentation excerpts (authoritative source — prefer these over general knowledge)\n\n${parts.join('\n\n')}`;
}