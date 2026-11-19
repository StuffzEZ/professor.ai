import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Code, Gamepad, Puzzle, Smartphone, Globe, Database, Cpu, Brush, Music, Book, Rocket, Wrench, FileText, Info } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { assessFeasibility, generateLessonPlan } from '../../lib/ai/generator';
import { professorProvider } from '../../lib/ai/provider';
import { findOrCreateCategory, saveLesson, incrementCategoryLessonCount } from '../../lib/store';
import type { LessonPlan, Difficulty } from '../../lib/types';
import { useApp } from '../../context';
import toast from 'react-hot-toast';

type Step = 'goal' | 'language' | 'difficulty' | 'generating' | 'review';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Swift', 'Dart',
  'Rust', 'Go', 'C#', 'C++', 'Lua', 'Ruby', 'PHP', 'Scratch',
] as const;

/** Common project-type templates that guide the AI toward a useful goal description. */
const TEMPLATES = [
  { id: 'modding', label: 'Modding', icon: 'puzzle', description: 'A Minecraft mod, Roblox game, browser extension...' },
  { id: 'app', label: 'Web App', icon: 'globe', description: 'A dashboard, todo app, blog, or landing page.' },
  { id: 'game', label: 'Game', icon: 'gamepad', description: 'A browser game, puzzle game, or interactive story.' },
  { id: 'tool', label: 'CLI Tool', icon: 'cpu', description: 'A command-line utility or automation script.' },
  { id: 'api', label: 'API Service', icon: 'database', description: 'A REST API, webhook handler, or serverless function.' },
] as const;

export function CreateFlow() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [customLanguage, setCustomLanguage] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<LessonPlan | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [partial, setPartial] = useState(true);

  async function proceedToLanguage() {
    if (!goal.trim()) return;
    setStep('language');
  }

  async function checkLanguage() {
    const language = customLanguage.trim().toLowerCase() || selectedLanguage?.toLowerCase();
    if (!language) return;
    setStep('generating');
    try {
      const res = await assessFeasibility(goal, language, getProvider());
      if (!res.feasible) {
        toast.error(res.message);
        setStep('goal');
        return;
      }
      setSelectedLanguage(language.charAt(0).toUpperCase() + language.slice(1));
      setStep('difficulty');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to check feasibility');
      setStep('language');
    }
  }

  async function startGenerating() {
    setGenerating(true);
    try {
      const result = await generateLessonPlan({
        goal,
        language: selectedLanguage!.toLowerCase(),
        difficulty,
        provider: getProvider(),
        partial,
      });
      setGenerated(result.plan);
      setStep('review');
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Generation failed');
      setStep('difficulty');
    } finally {
      setGenerating(false);
    }
  }

  async function saveAndFinish() {
    if (!user || !generated) return;
    setGenerating(true);
    try {
      const catRes = await findOrCreateCategory(user.uid, generated.categoryName, generated.categoryIcon);
      const lessonData: LessonPlan = {
        ...generated,
        categoryId: catRes.category.id,
        visibility,
        ownerId: user.uid,
        ownerName: user.displayName || user.email!.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      await saveLesson(lessonData);
      if (visibility === 'public') {
        // publish handled separately
      }
      await incrementCategoryLessonCount(user.uid, catRes.category.id);
      toast.success('Lesson created!');
      navigate(`/lesson/${generated.id}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to save lesson');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-lg font-semibold text-text-primary">Create with AI</h1>
      </header>

      {/* Step indicator */}
      <ol className="flex items-center gap-2 text-xs text-text-muted">
        {[
          { key: 'goal', label: 'Goal' },
          { key: 'language', label: 'Language' },
          { key: 'difficulty', label: 'Difficulty' },
          { key: 'generating', label: 'Generating' },
          { key: 'review', label: 'Review' },
        ].map((s, i, arr) => {
          const stepOrder: Step[] = ['goal', 'language', 'difficulty', 'generating', 'review'];
          const isCurrent = step === s.key;
          const isDone = stepOrder.indexOf(step) > stepOrder.indexOf(s.key as Step);
          return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                isCurrent ? 'bg-accent text-white' : isDone ? 'bg-bg-active' : 'bg-border-subtle'
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
            {i < arr.length - 1 && <span className="w-3 h-px bg-border-subtle" />}
          </li>
          );
        })}
      </ol>

      {/* Goal */}
      {step === 'goal' && (
        <div className="space-y-4">
          <h2 className="font-medium text-text-primary">What do you want to make?</h2>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="e.g., A Minecraft plugin that adds custom commands..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <div>
            <p className="text-sm text-text-muted mb-3">Or pick a template:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className="card-interactive p-3 text-left space-y-2"
                  onClick={() => {
                    setGoal(`Build a ${t.label.toLowerCase()}${
                      t.id === 'modding' ? ': Minecraft mod' : ''
                    }${t.id === 'app' ? ': a web dashboard' : ''}${
                      t.id === 'game' ? ': an interactive browser game' : ''
                    }${t.id === 'tool' ? ': a CLI utility' : ''}${
                      t.id === 'api' ? ': a REST API' : ''
                    }`);
                  }}
                >
                  <span className="text-2xl">{templateIcon(t.icon)}</span>
                  <p className="font-medium text-text-primary text-sm">{t.label}</p>
                  <p className="text-xs text-text-muted">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!goal.trim() || generating} onClick={proceedToLanguage}>
            Continue
            <ArrowLeft size={16} className="rotate-180" />
          </Button>
        </div>
      )}

      {/* Language */}
      {step === 'language' && (
        <div className="space-y-4">
          <h2 className="font-medium text-text-primary">Choose a language</h2>
          <p className="text-sm text-text-secondary">We will use real documentation for this language.</p>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                className={`p-3 rounded-button border text-sm transition-colors ${
                  selectedLanguage === lang
                    ? 'border-accent bg-accent/subtle text-accent'
                    : 'border-border-subtle hover:border-border-strong text-text-secondary'
                }`}
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang}
              </button>
            ))}
            <button
              className={`p-3 rounded-button border text-sm transition-colors ${
                selectedLanguage === 'other'
                  ? 'border-accent bg-accent/subtle text-accent'
                  : 'border-border-subtle hover:border-border-strong text-text-secondary'
              }`}
              onClick={() => setSelectedLanguage('other')}
            >
              Other...
            </button>
          </div>
          {selectedLanguage === 'other' && (
            <Input
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="Enter a language name"
            />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('goal')}>Back</Button>
            <Button className="flex-1" disabled={!selectedLanguage} onClick={checkLanguage}>
              Check feasibility
            </Button>
          </div>
        </div>
      )}

      {/* Difficulty */}
      {step === 'difficulty' && (
        <div className="space-y-4">
          <h2 className="font-medium text-text-primary">Pick a difficulty</h2>
          <div className="space-y-2">
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`w-full p-3 rounded-button border text-left transition-colors ${
                  difficulty === d
                    ? 'border-accent bg-accent/subtle'
                    : 'border-border-subtle hover:border-border-strong'
                }`}
                onClick={() => setDifficulty(d)}
              >
                <span className="font-medium text-text-primary capitalize">{d}</span>
                <p className="text-xs text-text-muted mt-0.5">{diffDesc(d)}</p>
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-border-subtle">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
              Generate core sections only (faster)
            </label>
            <p className="text-xs text-text-muted mt-1">You can generate additional sections later.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('language')}>Back</Button>
            <Button className="flex-1" disabled={generating} onClick={startGenerating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      )}

      {/* Generating spinner */}
      {step === 'generating' && (
        <div className="text-center py-16 space-y-4">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-secondary">
            {partial ? 'Generating core sections...' : 'Generating full lesson...'}
          </p>
          <p className="text-xs text-text-muted">This may take up to 30 seconds.</p>
        </div>
      )}

      {/* Review */}
      {step === 'review' && generated && (
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-text-primary">{generated.title}</h2>
                <p className="text-sm text-text-secondary mt-1">{generated.description}</p>
              </div>
              <span className="badge bg-bg-surface text-text-secondary shrink-0">
                {generated.sections.length} sections
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
              <span className="capitalize">{generated.language}</span>
              <span>·</span>
              <span className="capitalize">{generated.difficulty}</span>
              <span>·</span>
              <span>{generated.categoryName}</span>
            </div>
            {generated.docs.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">Grounded in:</p>
                <ul className="space-y-1">
                  {generated.docs.map((d, i) => (
                    <li key={i} className="text-xs text-accent truncate">→ {d.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-button bg-bg-surface border border-border-subtle">
            <Bot size={16} className="text-accent shrink-0" />
            <div className="text-xs text-text-muted">
              {generated.partial
                ? 'Core sections only. Use chat to request more.'
                : 'Full lesson generated. Start learning!'}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('difficulty')}>Back</Button>
            <div className="flex-1 flex gap-2">
              <select
                className="input"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              <Button onClick={saveAndFinish} disabled={generating}>
                {generating ? 'Saving...' : 'Save Lesson'}
              </Button>
            </div>
          </div>

          {visibility === 'public' && (
            <p className="text-xs text-text-muted px-1">
              <Info size={12} className="text-text-muted mr-1" aria-hidden="true" /> Public lessons are visible to all learners and can be copied. Consider whether your content is appropriate for a broad audience.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function getProvider() {
  return professorProvider;
}

function diffDesc(d: Difficulty): string {
  return {
    beginner: 'New to this topic. We will cover fundamentals.',
    intermediate: 'Comfortable with basics. Focus on patterns and real projects.',
    advanced: 'Experienced. Edge cases, performance, and deep internals.',
  }[d];
}

function templateIcon(icon: string) {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    code: Code, gamepad: Gamepad, puzzle: Puzzle, smartphone: Smartphone, globe: Globe,
    database: Database, cpu: Cpu, brush: Brush, music: Music, book: Book,
    rocket: Rocket, wrench: Wrench,
  };
  const Icon = icons[icon] ?? FileText;
  return <Icon size={28} className="text-accent" />;
}