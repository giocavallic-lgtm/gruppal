import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useStore } from '../store';
import ThemeToggle from '../components/ThemeToggle';

export default function Onboarding() {
  const users = useStore((s) => s.users);
  const createUser = useStore((s) => s.createUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const u = createUser(name.trim());
    setCurrentUser(u);
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <ThemeToggle className="absolute right-4 top-[calc(var(--safe-top)_+_1rem)]" />
      <div className="pop-in w-full max-w-sm space-y-7">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-zinc-200 text-4xl font-bold text-zinc-900 shadow-lg">
            C
          </div>
          <h1 className="mt-5 text-[32px] font-bold tracking-tight text-zinc-100">Crewzy</h1>
          <p className="mt-1 text-sm text-zinc-400">Planes, gastos y apuestas con tus amigos</p>
        </div>

        {users.length > 0 && (
          <div className="space-y-2">
            <p className="section-title">Continuar como</p>
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setCurrentUser(u)}
                className="card card-hover flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 font-semibold text-zinc-200 ring-1 ring-zinc-700/60">
                  {u.name[0]?.toUpperCase()}
                </div>
                <span className="flex-1 text-left font-medium text-zinc-100">{u.name}</span>
                <ArrowRight size={18} className="text-zinc-600" />
              </button>
            ))}
          </div>
        )}

        <div className="card space-y-3">
          <p className="section-title">Nuevo perfil</p>
          <input
            className="input"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            maxLength={40}
          />
          <button className="btn btn-primary w-full" onClick={handleCreate}>
            <Plus size={16} /> Entrar
          </button>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-zinc-500">
          Este dispositivo funciona en modo local. Configura Supabase para sincronizar con tus amigos.
        </p>
      </div>
    </div>
  );
}
