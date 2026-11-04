import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';
import { hasSupabase } from '../config';
import ThemeToggle from '../components/ThemeToggle';

export default function Auth() {
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!hasSupabase) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-5">
        <div className="card max-w-sm space-y-3 text-center">
          <h2 className="font-bold text-zinc-100">Modo offline</h2>
          <p className="text-sm text-zinc-400">
            No hay Supabase configurado. La app funciona en este dispositivo. Para multi-dispositivo, rellena{' '}
            <code>.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setErr('');
    setLoading(true);
    try {
      if (mode === 'in') await signIn(email.trim(), password);
      else await signUp(email.trim(), password, name.trim());
    } catch (e: any) {
      setErr(e?.message ?? 'No se pudo completar la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <ThemeToggle className="absolute right-4 top-[calc(var(--safe-top)_+_1rem)]" />
      <div className="pop-in w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-zinc-200 text-4xl font-bold text-zinc-900 shadow-lg">
            C
          </div>
          <h1 className="mt-5 text-[32px] font-bold tracking-tight text-zinc-100">Crewzy</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {mode === 'in' ? 'Bienvenido de vuelta' : 'Crea tu cuenta para empezar'}
          </p>
        </div>

        <form className="card space-y-4" onSubmit={submit}>
          {mode === 'up' && (
            <div>
              <label className="label" htmlFor="auth-name">
                Nombre
              </label>
              <input
                id="auth-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cómo te llamas"
                autoComplete="name"
                maxLength={40}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="auth-password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:text-zinc-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {err && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</p>}

          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}
          </button>
          <button
            type="button"
            className="btn btn-ghost w-full text-sm"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setErr('');
            }}
          >
            {mode === 'in' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>

        <p className="text-center text-[11px] leading-relaxed text-zinc-500">
          Tus datos se sincronizan de forma segura entre tus dispositivos.
        </p>
      </div>
    </div>
  );
}
