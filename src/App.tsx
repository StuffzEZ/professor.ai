import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from './lib/firebase';
import { MainLayout } from './components/layout';
import { Loader } from './components/ui';
import SignIn from './pages/SignIn';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LessonPlayer = lazy(() => import('./pages/lesson/LessonPlayer'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const DiscoverPage = lazy(() => import('./pages/Discover'));
const CreateFlow = lazy(() =>
  import('./pages/create/CreateFlow').then((m) => ({ default: m.CreateFlow }))
);

/** Whether the user has finished the onboarding flow (stored client-side). */
function isOnboarded(): boolean {
  return localStorage.getItem('professor.onboarding') === '1';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader />
      </div>
    );
  }

  const needsOnboarding = user && !isOnboarded();

  const router = createBrowserRouter([
    {
      path: '/',
      element: user ? (
        needsOnboarding ? (
          <Navigate to="/onboarding" replace />
        ) : (
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </MainLayout>
        )
      ) : (
        <Landing />
      ),
    },
    {
      path: '/signin',
      element: user ? <Navigate to="/" replace /> : <SignIn />,
    },
    {
      path: '/onboarding',
      element: user ? <Onboarding /> : <Navigate to="/" replace />,
    },
    {
      path: '/discover',
      element: user ? (
        <MainLayout>
          <Suspense fallback={<PageLoader />}>
            <DiscoverPage />
          </Suspense>
        </MainLayout>
      ) : (
        <Navigate to="/signin" replace />
      ),
    },
    {
      path: '/create',
      element: user ? (
        <MainLayout>
          <Suspense fallback={<PageLoader />}>
            <CreateFlow />
          </Suspense>
        </MainLayout>
      ) : (
        <Navigate to="/signin" replace />
      ),
    },
    {
      path: '/lesson/:lessonId',
      element: user ? (
        <MainLayout>
          <Suspense fallback={<PageLoader />}>
            <LessonPlayer />
          </Suspense>
        </MainLayout>
      ) : (
        <Navigate to="/signin" replace />
      ),
    },
    {
      path: '/settings',
      element: user ? (
        <MainLayout>
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        </MainLayout>
      ) : (
        <Navigate to="/signin" replace />
      ),
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);

  return (
    <>
      <Toaster position="bottom-right" />
      <RouterProvider router={router} />
    </>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader />
    </div>
  );
}
