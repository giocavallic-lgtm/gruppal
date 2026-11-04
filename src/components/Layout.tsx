import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { useStore } from '../store';

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const cu = useStore((s) => s.currentUser)!;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="app-header">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => nav('/')}
            aria-label="Ir al inicio"
            className="shrink-0 rounded-lg px-1 py-0.5 text-[17px] font-semibold tracking-tight text-zinc-100 transition active:scale-95"
          >
            Crewzy
          </button>
          <div className="ms-auto flex shrink-0 items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-2.5 py-1 ring-1 ring-zinc-700/50"
              title="Tus Crewzys"
            >
              <Coins className="h-4 w-4 text-amber-400" strokeWidth={2.2} />
              <span className="text-[13px] font-semibold tabular-nums text-zinc-100">
                {cu.coins ?? 1000}
              </span>
            </div>
            <button
              type="button"
              onClick={() => nav('/profile')}
              aria-label="Abrir perfil"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-800/80 ring-1 ring-zinc-700/60 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-95"
            >
              {cu.avatar ? (
                <img
                  src={cu.avatar}
                  alt={cu.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-xl text-zinc-200">{cu.name ? cu.name[0] : '?'}</div>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main mx-auto w-full max-w-2xl flex-1 px-4 pt-5">
        <Suspense fallback={<PageLoader />}>
          <div key={loc.pathname} className="page-in">
            <Outlet />
          </div>
        </Suspense>
      </main>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="page-spinner" />
    </div>
  );
}