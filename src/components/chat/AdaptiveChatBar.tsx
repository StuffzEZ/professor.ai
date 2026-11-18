/**
 * Adaptive chat bar with a thin rainbow outline that retracts to the bottom
 * of the screen and expands on hover/focus (desktop). On mobile it stays open.
 * Respects prefers-reduced-motion.
 */
import { useRef, useState, useEffect } from 'react';
import { Send, Lightbulb, Loader } from 'lucide-react';
import { useApp } from '../../context';
import type { LessonSection } from '../../lib/types';
import { chatWithLesson } from '../../lib/ai/chat';
import { pollinationsProvider, customProvider, professorProvider } from '../../lib/ai/provider';
import { cn } from '../../lib/utils';

interface Props {
  lessonTitle: string;
  currentSection: LessonSection | null;
  language: string;
  code?: string;
  hintsSeen: number;
  onHint: () => void;
}

export default function AdaptiveChatBar({
  lessonTitle,
  currentSection,
  language,
  code,
  hintsSeen,
  onHint,
}: Props) {
  const { settings } = useApp();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile always expanded
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px) and (prefers-reduced-motion: no-preference)');
    const update = () => {
      setExpanded(mq.matches);
      setIsDesktop(mq.matches);
    };
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const provider = getProvider(settings.provider, settings.customEndpoint);
      const reply = await chatWithLesson(text, {
        lessonTitle,
        currentSection,
        language,
        code,
        hintsSeen,
      }, provider);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (_err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: 'Something went wrong — please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const hintAvailable = (currentSection?.hints ?? []).length > hintsSeen;

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-200',
        'safe-bottom'
      )}
    >
      {/* Rainbow gradient outline via pseudo-element is handled by CSS */}
      <div className="rainbow-border">
        <div
          className={cn(
            'bg-bg-raised px-4 pb-4 pt-3 flex flex-col gap-3',
            // Retract on desktop unless hovered or expanded
            'md:max-w-lg md:mx-auto md:rounded-t-xl md:mb-2 md:border-x md:border-b md:border-border-subtle md:bg-bg-raised',
            expanded || 'md:h-12 md:items-center md:flex-row md:cursor-pointer md:hover:!h-full'
          )}
          onClick={() => {
            if ('ontouchstart' in window) return; // mobile - no need to toggle
            if (!isDesktop) return;
            setExpanded((v) => !v);
          }}
        >
          {/* Chat messages */}
          <div className="space-y-2 min-h-0 max-h-48 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed p-3 rounded-button',
                  m.role === 'user' ? 'bg-accent/subtle text-text-primary ml-auto' : 'bg-bg-surface text-text-secondary border border-border-subtle'
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Loader size={12} className="animate-spin" />
                Thinking...
              </div>
            )}
            {!sending && messages.length === 0 && (
              <p className="text-xs text-text-muted italic">
                Ask for help or hints. The assistant won't give you direct answers.
              </p>
            )}
          </div>

          {/* Input row */}
          <div className="flex items-end gap-2">
            {hintAvailable && (
              <button
                className="btn btn-ghost p-2.5 shrink-0"
                onClick={onHint}
                disabled={sending}
                title="Get a progressive hint"
                aria-label="Ask for a hint"
              >
                <Lightbulb size={18} />
              </button>
            )}
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask a question about the lesson..."
                className="input pr-10 resize-none overflow-hidden bg-bg surface"
                style={{ minHeight: '42px' }}
                aria-label="Chat message input"
                disabled={sending}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost p-1 disabled:opacity-50"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Extract the active AI provider from app settings. */
function getProvider(
  id: import('../../lib/types').ProviderId,
  custom: import('../../lib/types').CustomEndpoint | null
): import('../../lib/ai/provider').AiProvider {
  switch (id) {
    case 'pollinations':
      return pollinationsProvider;
    case 'custom':
      if (!custom) throw new Error('Custom provider selected but no endpoint configured');
      return customProvider(custom.baseUrl, custom.apiKey, custom.model);
    default:
      return professorProvider;
  }
}