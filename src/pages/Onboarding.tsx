import { useState } from 'react';
import { useStore } from '../store';

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-200 text-zinc-900 flex items-center justify-center text-3xl font-bold">C</div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-100">Crewzy</h1>
          <p className="text-zinc-400 text-sm mt-1">Planes, gastos y apuestas con tus amigos</p>
        </div>

        {users.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Continuar como</p>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className="w-full card flex items-center gap-3 hover:bg-zinc-800"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-200 font-semibold">{u.name[0].toUpperCase()}</div>
                <span className="text-zinc-100">{u.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Nuevo perfil</p>
          <input className="input" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <button className="btn btn-primary w-full" onClick={handleCreate}>Entrar</button>
        </div>
      </div>
    </div>
  );
}