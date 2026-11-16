import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Lock, Globe, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { getLesson, saveProgress, getProgress } from '../../lib/store';
import type { LessonPlan, LessonProgress } from '../../lib/types';
import { useApp } from '../../context';
import { Button } from '../../components/ui';
import AdaptiveChatBar from '../../components/chat/AdaptiveChatBar';
import Roadmap from '../../components/lesson/Roadmap';

export default function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const activeSectionId = progress?.completedSections[progress.completedSections.length - 1] ?? lesson?.sections[0]?.id;
  const activeIndex = lesson?.sections.findIndex((s) => s.id === activeSectionId) ?? 0;
  const currentSection = lesson?.sections[activeIndex];

  // Load lesson and progress on mount / id change
  useEffect(() => {
    if (!id || !user) return;
    // id is narrowed by the check above but TS still thinks it may be undefined in deps
    const lessonId = id as string;
    const uid = user.uid;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [lsn, prog] = await Promise.all([
          getLesson(uid, lessonId),
          getProgress(uid, lessonId),
        ]);
        if (!lsn) {
          navigate('/not-found');
          return;
        }
        if (!cancelled) {
          setLesson(lsn);
          setProgress(prog);
        }
      } catch {
        toast.error('Failed to load lesson');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  if (!id || !user) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-center">
        <BookOpen size={40} className="text-text-muted" />
        <h2 className="text-lg font-semibold text-text-primary">Sign in to start a lesson</h2>
        <p className="text-sm text-text-secondary">Lessons are saved to your account.</p>
        <Button onClick={() => navigate('/signin')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-28">
      {/* Header */}
      <header className="mb-6">
        <button className="btn btn-ghost mb-4 gap-2 text-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="capitalize">{lesson?.language}</span>
              <span>·</span>
              <span className="capitalize">{lesson?.difficulty}</span>
              <span>·</span>
              {lesson?.visibility === 'public'
                ? <span className="flex items-center gap-1 text-success"><Globe size={12} /> Public</span>
                : <span className="flex items-center gap-1"><Lock size={12} /> Private</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary leading-tight">
              {lesson?.title}
            </h1>
            <p className="text-sm text-text-secondary mt-1">{lesson?.description}</p>
          </div>
          {lesson?.partial && (
            <span className="badge bg-warning/20 text-warning shrink-0">Partial</span>
          )}
        </div>
      </header>

      {/* Roadmap — visible once lesson is loaded */}
      {lesson && progress && (
        <Roadmap
          lesson={lesson}
          completedSections={progress.completedSections}
        />
      )}

      {/* Progress bar (compact, below roadmap) */}
      {lesson && progress && (
        <div className="mb-4 h-1.5 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${sectionPercent(lesson.sections, progress)}%` }}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-bg-raised rounded-card" />
          ))}
        </div>
      ) : lesson && currentSection ? (
        <>
          {/* Section content */}
          <article className="card p-6 space-y-4">
            <h2 className="font-semibold text-text-primary text-lg">{currentSection.title}</h2>

            {/* Markdown content */}
            {currentSection.content && (
              <div className="prose prose-invert prose-sm max-w-none [&>p]:text-text-secondary [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentSection.content}</ReactMarkdown>
              </div>
            )}

            {/* Open question */}
            {currentSection.prompt && (
              <div className="bg-bg-surface border border-border-subtle rounded-button p-4">
                <p className="text-text-primary font-medium">{currentSection.prompt}</p>
              </div>
            )}

            {/* Quiz */}
            {currentSection.questions && currentSection.questions.length > 0 && (
              <QuizSection
                section={currentSection}
                progress={progress ?? createInitialProgress(user.uid, lesson)}
                onAnswer={(qid, idx, correct) => {
                  const scores = { ...(progress?.quizScores ?? {}) };
                  scores[qid] = correct ? 1 : 0;
                  const newProgress = {
                    ...createInitialProgress(user.uid, lesson),
                    quizScores: scores,
                    completedSections: [
                      ...(progress?.completedSections ?? []),
                      lesson.sections[activeIndex]?.id ?? '',
                    ],
                  };
                  setProgress(newProgress);
                  saveProgress(newProgress).catch(console.error);
                }}
              />
            )}

            {/* Coding exercise */}
            {currentSection.task && (
              <CodingExercise
                task={currentSection.task}
                hintsSeen={hintsSeen(progress ?? createInitialProgress(user.uid, lesson), currentSection.id)}
              />
            )}
          </article>

          {/* Navigation */}
          <nav className="flex items-center justify-between mt-6" aria-label="Section navigation">
            <Button variant="secondary" disabled={activeIndex === 0} onClick={() => navigate(`?section=${activeIndex - 1}`)}>
              <ArrowLeft size={16} /> Previous
            </Button>
            <span className="text-sm text-text-muted">
              {activeIndex + 1} / {lesson.sections.length}
            </span>
            <Button
              variant={activeIndex < lesson.sections.length - 1 ? 'primary' : 'secondary'}
              onClick={() => navigate(`?section=${activeIndex + 1}`)}
            >
              {activeIndex < lesson.sections.length - 1 ? 'Next' : 'Finish'}
              <ChevronDown size={16} />
            </Button>
          </nav>
        </>
      ) : null}

      {/* Adaptive chat bar */}
      {lesson && (
        <AdaptiveChatBar
          lessonTitle={lesson.title}
          currentSection={currentSection ?? null}
          language={lesson.language}
          code={lesson.sections[activeIndex]?.task?.starterCode}
          hintsSeen={hintsSeen(progress ?? createInitialProgress(user.uid, lesson), currentSection?.id ?? '')}
          onHint={() => {
            // Trigger hint reveal through parent state if needed
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function QuizSection({
  section,
  progress,
  onAnswer,
}: {
  section: import('../../lib/types').LessonSection;
  progress: import('../../lib/types').LessonProgress;
  onAnswer: (qId: string, index: number, correct: boolean) => void;
}) {
  const scores = progress.quizScores ?? {};

  return (
    <div className="space-y-4">
      {(section.questions ?? []).map((q) => {
        const answered = q.id in scores;
        const correct = scores[q.id] === 1;
        return (
          <div key={q.id} className="border-l-2 border-accent pl-4 space-y-2">
            <p className="font-medium text-text-primary">{q.question}</p>
            <div className="grid gap-2">
              {(q.options ?? []).map((opt, oi) => (
                <button
                  key={oi}
                  className={`text-left px-4 py-2.5 rounded-button border transition-colors text-sm ${
                    answered && scores[`${q.id}-${oi}`]
                      ? correct
                        ? 'border-success bg-success/10 text-success'
                        : 'border-danger bg-danger/10 text-danger'
                      : answered && oi === q.correctIndex
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border-subtle hover:border-border-strong bg-bg-surface text-text-secondary'
                  }`}
                  disabled={answered}
                  onClick={() => {
                    if (answered) return;
                    const isCorrect = oi === q.correctIndex;
                    // Store per-option score for review
                    const prevScores = { ...scores };
                    prevScores[`${q.id}-${oi}`] = isCorrect ? 1 : 0;
                    if (isCorrect) prevScores[q.id] = 1;
                    else prevScores[q.id] = 0;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    onAnswer(q.id, oi, isCorrect);
                  }}
                >
                  <span className="flex items-center gap-2">
                    {answered && (oi === q.correctIndex || scores[`${q.id}-${oi}`]) && (
                      <CheckCircle size={14} />
                    )}
                    {opt}
                  </span>
                </button>
              ))}
            </div>
            {answered && (
              <p className="text-xs text-text-muted italic">{q.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CodingExercise({
  task,
  hintsSeen,
}: {
  task: import('../../lib/types').CodingTask;
  hintsSeen: number;
}) {
  const [code, setCode] = useState(task.starterCode);
  const [showHints, setShowHints] = useState(hintsSeen > 0);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="space-y-4">
      <p className="font-medium text-text-primary">{task.prompt}</p>
      <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
        {(task.criteria ?? []).map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <div className="relative">
        <pre className="bg-bg surface border border-border-subtle rounded-button p-4 overflow-x-auto">
          <code className="text-sm font-mono text-text-primary">{code}</code>
        </pre>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 resize-none"
          spellCheck={false}
          aria-label="Code editor"
        />
      </div>

      {/* Hints */}
      {(task.hints ?? []).length > 0 && (
        <div className="space-y-2">
          <button
            className="btn btn-ghost text-xs gap-1"
            onClick={() => setShowHints((v) => !v)}
          >
            {showHints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Hints ({hintsSeen}/{task.hints!.length})
          </button>
          {showHints &&
            (task.hints ?? [])
              .slice(0, hintsSeen + (showHints ? 1 : 0))
              .map((h, i) => (
                <p key={i} className="text-xs text-warning pl-4 border-l-2 border-warning/40">
                  💡 {h}
                </p>
              ))}
        </div>
      )}

      {/* Toggle solution */}
      {task.solution && (
        <div className="flex items-center gap-3 pt-2">
          <button
            className="btn btn-ghost text-xs text-text-muted"
            onClick={() => setShowSolution((v) => !v)}
          >
            {showSolution ? 'Hide reference solution' : 'Show reference solution'}
          </button>
        </div>
      )}
      {showSolution && task.solution && (
        <pre className="bg-bg-surface border border-border-subtle rounded-button p-4 overflow-x-auto">
          <code className="text-xs font-mono text-text-secondary">{task.solution}</code>
        </pre>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function sectionPercent(sections: import('../../lib/types').LessonSection[], progress: import('../../lib/types').LessonProgress): number {
  const completed = progress.completedSections.length;
  return Math.round((completed / sections.length) * 100);
}

function hintsSeen(progress: import('../../lib/types').LessonProgress, sectionId: string): number {
  // Simplified: count attempts as hints seen
  return (progress.codingAttempts ?? {})[sectionId] ?? 0;
}

function createInitialProgress(uid: string, lesson: LessonPlan): import('../../lib/types').LessonProgress {
  return {
    lessonId: lesson.id,
    userId: uid,
    completedSections: [],
    quizScores: {},
    codingAttempts: {},
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}