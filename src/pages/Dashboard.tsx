import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { listLessons } from '../lib/store';
import { BookOpen, Plus, Globe, Lock } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import type { LessonPlan } from '../lib/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await listLessons(user.uid);
        if (!cancelled) setLessons(res.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Your Lessons</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Pick up where you left off or start something new.
          </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => navigate('/create')}
          aria-label="Create new lesson"
        >
          <Plus size={16} />
          New Lesson
        </button>
      </header>

      {!user ? (
        <EmptyState
          icon={<BookOpen />}
          title="Sign in to get started"
          description="Create an account to track your lessons and generate AI-powered courses."
          action={{ label: 'Sign In', href: '/signin' }}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No lessons yet"
          description="Create your first AI-generated interactive lesson. It will be grounded in real documentation and tailored to your goals."
          action={{ label: 'Create a Lesson', href: '/create', variant: 'primary' }}
        />
      ) : (
        <LessonGrid lessons={lessons} onContinue={(id) => navigate(`/lesson/${id}`)} />
      )}
    </div>
  );
}

function LessonGrid({
  lessons,
  onContinue,
}: {
  lessons: LessonPlan[];
  onContinue: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          className="card-interactive p-4 text-left group"
          onClick={() => onContinue(lesson.id)}
          onKeyDown={(e) => e.key === 'Enter' && onContinue(lesson.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/subtle text-accent">
              {lesson.language}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs text-text-muted ${
                lesson.visibility === 'public' ? 'text-success' : ''
              }`}
            >
              {lesson.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
            </span>
          </div>
          <h3 className="font-medium text-text-primary mt-2 group-hover:text-accent transition-colors line-clamp-2">
            {lesson.title}
          </h3>
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{lesson.description}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
            <span className="capitalize">{lesson.difficulty}</span>
            <span>·</span>
            <span>{lesson.sections.length} sections</span>
            <span>·</span>
            <span>{lesson.categoryName}</span>
          </div>
        </button>
      ))}
    </div>
  );
}