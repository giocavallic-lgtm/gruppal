import { lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { hasSupabase } from './config';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';

const Home = lazy(() => import('./pages/Home'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const PlanDetail = lazy(() => import('./pages/PlanDetail'));
const ChampionshipDetail = lazy(() => import('./pages/ChampionshipDetail'));
const Bets = lazy(() => import('./pages/Bets'));
const BetDetail = lazy(() => import('./pages/BetDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Legal = lazy(() => import('./pages/Legal'));

export default function App() {
  const initAuth = useStore((s) => s.initAuth);
  const authLoading = useStore((s) => s.authLoading);
  const session = useStore((s) => s.session);
  const currentUser = useStore((s) => s.currentUser);
  const theme = useStore((s) => s.theme);
  const reduceMotion = useStore((s) => s.reduceMotion);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Apply the saved theme (system / light / dark) to the document.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: light)');

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      root.dataset.theme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'light' ? '#f2f2f5' : '#0a0a0b');
      document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.setAttribute('content', resolved === 'light' ? 'default' : 'black-translucent');
    };

    apply();
    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  if (authLoading) return <Splash />;

  // Cloud mode
  if (hasSupabase) {
    if (!session || !currentUser) {
      return <Auth />;
    }
  } else {
    // Local mode
    if (!currentUser) {
      return (
        <Routes>
          <Route path="*" element={<Onboarding />} />
        </Routes>
      );
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/plans/:id" element={<PlanDetail />} />
        <Route path="/championships/:id" element={<ChampionshipDetail />} />
        <Route path="/groups/:id/bets" element={<Bets />} />
        <Route path="/bets/:id" element={<BetDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="splash-mark flex h-16 w-16 items-center justify-center rounded-[18px] bg-zinc-200 text-3xl font-bold text-zinc-900 shadow-lg">
        C
      </div>
      <span className="text-sm text-zinc-500">Cargando…</span>
    </div>
  );
}
