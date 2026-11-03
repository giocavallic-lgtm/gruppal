import { useState } from 'react';
import { useStore } from '../store';
import { hasSupabase } from '../config';

export default function Auth() {
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!hasSupabase) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-sm text-center space-y-3">
          <h2 className="font-bold text-zinc-100">Modo offline</h2>
          <p className="text-sm text-zinc-400">
            No hay Supabase configurado. La app funciona en este dispositivo. Para multi-dispositivo, rellena <code>.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      if (mode === 'in') await signIn(email, password);
      else await signUp(email, password, name);
    } catch (e: any) {
      setErr(e?.message ?? 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-200 text-zinc-900 flex items-center justify-center text-3xl font-bold">C</div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-100">Crewzy</h1>
          <p className="text-zinc-400 text-sm mt-1">{mode === 'in' ? 'Inicia sesión' : 'Crea tu cuenta'}</p>
        </div>
        <div className="card space-y-3">
          {mode === 'up' && (
            <div><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          )}
          <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">Contraseña</label><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button className="btn btn-primary w-full" onClick={submit} disabled={loading}>
            {loading ? '...' : mode === 'in' ? 'Entrar' : 'Registrarse'}
          </button>
          <button className="btn btn-ghost w-full text-sm" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
            {mode === 'in' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}