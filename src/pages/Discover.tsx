import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Bookmark } from 'lucide-react';
import { listPublicLessons, copyPublicLesson } from '../lib/store';
import type { PublicLessonSummary, LessonPlan } from '../lib/types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { useApp } from '../context';
import { Loader } from '../components/ui';
import toast from 'react-hot-toast';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<PublicLessonSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const cursorRef = useRef<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  async function loadLessons() {
    setLoading(true);
    try {
      const res = await listPublicLessons(cursorRef.current ?? undefined);
      setLessons((prev) => (cursorRef.current ? [...prev, ...res.items] : res.items));
      cursorRef.current = res.nextCursor;
      setHasMore(!!res.nextCursor);
    } catch {
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyLesson(lesson: PublicLessonSummary) {
    if (!user) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const full = await (window as any).__APP_STORE__?.getPublicLesson?.(lesson.id);
      if (!full) throw new Error('Lesson not found');
      const copied = await copyPublicLesson(full as LessonPlan, user.uid, user.displayName || '');
      toast.success(`Copied "${copied.title}" to your library!`);
      navigate(`/lesson/${copied.id}`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Failed to copy lesson');
    }
  }

  const filtered = lessons.filter(
    (l) =>
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">Discover Lessons</h1>
        <p className="text-sm text-text-secondary mt-1">Browse public lessons created by other learners.</p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="input pl-10"
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && lessons.length === 0 ? (
        <div className="py-16 flex justify-center">
          <Loader size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Globe size={32} className="mx-auto text-text-muted" />
          <p className="text-text-secondary">No lessons found.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            Create one
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {filtered.map((lesson) => (
              <div key={lesson.id} className="card p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-button bg-accent/subtle flex items-center justify-center shrink-0 text-accent">
                  {lessonCategoryIcon(lesson.categoryIcon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-bg-surface">{lesson.language}</span>
                    <span className="badge bg-bg-surface capitalize">{lesson.difficulty}</span>
                    <span className={`text-xs ${lesson.categoryIcon === 'globe' ? 'text-success' : 'text-text-muted'}`}>
                      {lesson.ownerName}
                    </span>
                  </div>
                  <h3
                    className="font-medium text-text-primary mt-1 hover:text-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                  >
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{lesson.description}</p>
                  <p className="text-xs text-text-muted mt-1">{lesson.sectionCount} sections · {timeAgo(lesson.createdAt)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="btn btn-ghost p-2"
                    onClick={() => copyLesson(lesson)}
                    title="Copy to my library"
                    disabled={!user}
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <button className="btn btn-secondary" onClick={() => loadLessons()}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function lessonCategoryIcon(icon: string) {
  return icon === 'gamepad' ? '🎮' : icon === 'code' ? '💻' : icon === 'book' ? '📚' : '📁';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}