import type { ReactNode } from 'react';
import { Header } from './Header';

interface Props {
  children: ReactNode;
  onNewLesson?: () => void;
}

export function MainLayout({ children, onNewLesson }: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Header onNewLesson={onNewLesson} />
      <main id="main" className="flex-1 px-4 py-6 md:py-8">
        <div className="max-w-content mx-auto">{children}</div>
      </main>
    </div>
  );
}