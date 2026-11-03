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
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-900 flex items-center justify-center font-bold">G</div>
          <span className="font-semibold text-zinc-100">Gruppal</span>
        </div>
        <div className="text-sm text-zinc-400">{cu.name}</div>
      </header>
      <main className="flex-1 pb-20 px-4 py-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((t) => {
            const active = loc.pathname === t.path;
            return (
              <button
                key={t.path}
                onClick={() => nav(t.path)}
                className={`flex-1 flex flex-col items-center py-2 text-xs ${active ? 'text-zinc-100' : 'text-zinc-500'}`}
              >
                <t.icon size={20} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}