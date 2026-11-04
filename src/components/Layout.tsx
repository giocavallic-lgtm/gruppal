import { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, User } from 'lucide-react';
import { useStore } from '../store';

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const cu = useStore((s) => s.currentUser)!;

  const tabs = [
    { path: '/', icon: HomeIcon, label: 'Inicio' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="app-header">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-2.5">
          <button
            type="button"
            onClick={() => nav('/')}
            className="flex items-center gap-2.5 transition active:scale-95"
            aria-label="Ir al inicio"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-zinc-200 text-[17px] font-bold text-zinc-900 shadow-sm">
              C
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-zinc-100">Crewzy</span>
          </button>
          <button
            type="button"
            onClick={() => nav('/profile')}
            aria-label="Abrir perfil"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200 ring-1 ring-zinc-700/60 transition active:scale-95"
          >
            {cu.name[0]?.toUpperCase() ?? '?'}
          </button>
        </div>
      </header>

      <main className="app-main mx-auto w-full max-w-2xl flex-1 px-4 pt-5">
        <Suspense fallback={<PageLoader />}>
          <div key={loc.pathname} className="page-in">
            <Outlet />
          </div>
        </Suspense>
      </main>

      <nav className="app-nav" aria-label="Navegación principal">
        <div className="mx-auto flex w-full max-w-md items-stretch gap-1 px-3 py-1.5">
          {tabs.map((t) => {
            const active = t.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(t.path);
            return (
              <button
                key={t.path}
                type="button"
                onClick={() => nav(t.path)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-medium transition active:scale-95 ${
                  active ? 'text-zinc-100' : 'text-zinc-500'
                }`}
              >
                <span className={`nav-pill ${active ? 'nav-pill-active' : ''}`}>
                  <t.icon size={21} strokeWidth={active ? 2.4 : 2} />
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
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
