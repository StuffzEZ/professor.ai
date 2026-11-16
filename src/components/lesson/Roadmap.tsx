import { CheckCircle, Circle, Lock } from 'lucide-react';
import type { LessonPlan } from '../../lib/types';

interface RoadmapProps {
  lesson: LessonPlan;
  completedSections: string[];
}

/**
 * Renders a visual roadmap showing the learner's journey toward their goal.
 * At the top displays the end goal, then each section as a milestone with
 * check/lock/unlocked states, and a progress indicator.
 */
export default function Roadmap({ lesson, completedSections }: RoadmapProps) {
  const total = lesson.sections.length;
  const done = completedSections.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-card border border-border-subtle bg-bg-raised p-4 mb-6">
      {/* Goal banner */}
      <div className="mb-4 pb-3 border-b border-border-subtle">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Your goal</p>
        <p className="font-semibold text-text-primary">{lesson.goal}</p>
        <p className="text-xs text-text-secondary mt-1">Build this project in {lesson.language}</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-text-muted shrink-0">{pct}%</span>
      </div>

      {/* Milestones list */}
      <ol className="space-y-2">
        {lesson.sections.map((section, i) => {
          const isDone = completedSections.includes(section.id);
          const isActive = i === done; // current section is next after last completed
          const isLocked = !isDone && !isActive && i > done;

          return (
            <li
              key={section.id}
              className={`
                flex items-start gap-3 px-3 py-2 rounded-button text-sm
                ${isDone ? 'bg-accent/10 text-success' : ''}
                ${isActive ? 'bg-bg-hover text-text-primary' : ''}
                ${isLocked ? 'opacity-50 text-text-muted' : ''}
              `}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="mt-0.5 shrink-0">
                {isDone
                  ? <CheckCircle size={14} className="text-success" />
                  : isLocked
                    ? <Lock size={14} />
                    : <Circle size={14} />}
              </span>
              <div className="min-w-0">
                <span className="text-xs text-text-muted mr-2">Step {i + 1}</span>
                <span className="truncate">{section.title}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}