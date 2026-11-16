import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../../context';
import { getFirebaseAuth } from '../../lib/firebase';

export function Header({ onNewLesson }: { onNewLesson?: () => void }) {
  const navigate = useNavigate();
  const { user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await getFirebaseAuth().signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/95 border-b border-border-subtle backdrop-blur-sm">
      <div className="max-w-content mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 font-semibold text-lg text-text-primary hover:text-accent transition-colors"
          aria-label="Professor AI home"
        >
          <Logo />
          <span className="hidden sm:inline">Professor AI</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
          {user && (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/lessons')}
              >
                <BookOpen size={16} />
                My Lessons
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/discover')}
              >
                Discover
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/settings')}
              >
                <Settings size={16} />
                Settings
              </button>
              {onNewLesson && (
                <button
                  className="btn btn-primary"
                  onClick={onNewLesson}
                >
                  <Plus size={16} />
                  New Lesson
                </button>
              )}
            </>
          )}
          {user && (
            <button className="btn btn-ghost" onClick={signOut} aria-label="Sign out">
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden btn btn-ghost p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-border-subtle bg-bg-raised px-4 py-3 space-y-1"
        >
          {user && (
            <>
              <button className="btn btn-ghost w-full justify-start" onClick={() => { navigate('/lessons'); setMobileOpen(false); }}>
                <BookOpen size={16} /> My Lessons
              </button>
              <button className="btn btn-ghost w-full justify-start" onClick={() => { navigate('/discover'); setMobileOpen(false); }}>
                Discover
              </button>
              <button className="btn btn-ghost w-full justify-start" onClick={() => { navigate('/settings'); setMobileOpen(false); }}>
                <Settings size={16} /> Settings
              </button>
              {onNewLesson && (
                <button className="btn btn-primary w-full" onClick={() => { onNewLesson(); setMobileOpen(false); }}>
                  <Plus size={16} /> New Lesson
                </button>
              )}
              <button className="btn btn-ghost w-full justify-start text-danger" onClick={signOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#6c8cff" fillOpacity="0.15" stroke="#6c8cff" strokeWidth="1.5"/>
      <path d="M7 8h10M7 12h7M7 16h4" stroke="#6c8cff" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17.5" cy="12" r="1.5" fill="#6c8cff"/>
    </svg>
  );
}