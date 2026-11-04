import { useRef, useState } from 'react';
import {
  Code2,
  ChevronRight,
  Database,
  Download,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  Plus,
  ShieldCheck,
  Sun,
  Upload,
  Users,
} from 'lucide-react';
import { useStore } from '../store';
import Toggle from '../components/Toggle';
import PageHeader from '../components/PageHeader';

export default function Profile() {
  const currentUser = useStore((s) => s.currentUser)!;
  const users = useStore((s) => s.users);
  const session = useStore((s) => s.session);
  const mode = useStore((s) => s.mode);
  const updateUser = useStore((s) => s.updateUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const createUser = useStore((s) => s.createUser);
  const signOut = useStore((s) => s.signOut);
  const signOutEverywhere = useStore((s) => s.signOutEverywhere);
  const updateEmail = useStore((s) => s.updateEmail);
  const updatePassword = useStore((s) => s.updatePassword);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const setReduceMotion = useStore((s) => s.setReduceMotion);

  const [name, setName] = useState(currentUser.name);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);

  const [newName, setNewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [pw, setPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSaveName = async () => {
    const value = name.trim();
    if (!value || value === currentUser.name) return;
    setSavingName(true);
    setNameMsg('');
    try {
      await updateUser(currentUser.id, { name: value });
      setNameMsg('Nombre actualizado');
    } catch {
    }
    finally {
      setSavingName(false);
    }
  };

  const handleLogout = () => {
    if (mode === 'cloud') signOut();
    else setCurrentUser(null);
  };

  const handleSignOutEverywhere = async () => {
    if (!confirm('¿Cerrar sesión en todos los dispositivos?')) return;
    await signOutEverywhere();
  };

  const handleCreateProfile = () => {
    if (!newName.trim()) return;
    const u = createUser(newName.trim());
    setNewName('');
    setCurrentUser(u);
  };

  const handleEmail = async () => {
    setSavingEmail(true);
    try {
      await updateEmail(email);
      setSavingEmail(false);
    } catch {
    }
  };

  const handlePassword = async () => {
    setSavingPw(true);
    try {
      await updatePassword(pw);
      setSavingPw(false);
    } catch {
      setSavingPw(false);
    }
  };

  const handleExport = () => {
    const data = localStorage.getItem('crewzy-store') ?? localStorage.getItem('gruppal-store');
    const blob = new Blob([data ?? '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crewzy-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        localStorage.setItem('crewzy-store', JSON.stringify(parsed));
        window.location.reload();
      } catch {
        alert('Archivo inválido');
      }
    };
    reader.readAsText(file);
  };

  const handleChangePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = reader.result as string;
      if (mode === 'cloud') {
        const supabase = (useStore.getState() as any).supabase;
        if (supabase) {
          supabase.from('profiles').update({ avatar }).eq('id', currentUser.id).then(() => {
            setNameMsg('Foto actualizada');
          });
        }
      } else {
        setNameMsg('Foto guardada localmente');
        setCurrentUser({ ...currentUser, avatar });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-7">
      <PageHeader title="Ajustes" subtitle="Cuenta, apariencia y preferencias" backTo="/" />

      {/* Cuenta */}
      <section className="space-y-3">
        <h2 className="section-title">Cuenta</h2>
        <div className="card space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl font-semibold text-zinc-200 ring-1 ring-zinc-700/60">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div>{currentUser.name ? currentUser.name[0] : 'C'}</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-100">{currentUser.name}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost text-xs p-1 rounded-full"
              onClick={() => fileRef.current?.click()}
              aria-label="Cambiar foto de perfil"
            >
              <Plus size={14} />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleChangePhoto(e.target.files[0])}
          />
          <p className="mt-2 text-center text-xs text-pos">{nameMsg}</p>
        </div>
        <div className="border-t border-zinc-800/70 pt-4">
          <label className="label" htmlFor="profile-name">
            Nombre
          </label>
          <input
            id="profile-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
          <button
            className="btn btn-primary mt-3 w-full"
            onClick={handleSaveName}
            disabled={savingName || !name.trim() || name.trim() === currentUser.name}
          >
            {savingName ? 'Guardando…' : 'Guardar nombre'}
          </button>
        </div>
      </section>

      {/* Apariencia */}
      <section className="space-y-3">
        <h2 className="section-title">Apariencia</h2>
        <div className="card space-y-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Palette size={16} /> Tema
            </p>
            <p className="mt-1 text-xs text-zinc-500">Elige cómo se ve Crewzy en este dispositivo.</p>
            <div className="seg mt-3" role="group" aria-label="Tema">
              {[
                { value: 'system' as const, label: 'Sistema', Icon: Monitor },
                { value: 'light' as const, label: 'Claro', Icon: Sun },
                { value: 'dark' as const, label: 'Oscuro', Icon: Moon },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={theme === value ? 'active' : ''}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-zinc-800/70 pt-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Reducir animaciones</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                Desactiva transiciones y efectos de movimiento.
              </p>
            </div>
            <Toggle checked={reduceMotion} onChange={setReduceMotion} label="Reducir animaciones" />
          </div>
        </div>
      </section>

      {/* Seguridad */}
      {mode === 'cloud' && (
        <section className="space-y-3">
          <h2 className="section-title">Seguridad</h2>
          <div className="card space-y-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Mail size={16} /> Cambiar email
              </p>
              <p className="mt-1 text-xs text-zinc-500">Te enviaremos un enlace de confirmación.</p>
              <div className="mt-3 flex gap-2">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                />
                <button
                  className="btn btn-secondary shrink-0"
                  onClick={handleEmail}
                  disabled={savingEmail}
                >
                  {savingEmail ? '…' : 'Cambiar'}
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-800/70 pt-4">
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <KeyRound size={16} /> Cambiar contraseña
              </p>
              <p className="mt-1 text-xs text-zinc-500">Mínimo 6 caracteres.</p>
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <input
                    className="input pr-11"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:text-zinc-200"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={''}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button className="btn btn-secondary w-full" onClick={handlePassword} disabled={savingPw}>
                  {savingPw ? 'Guardando…' : 'Actualizar contraseña'}
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-800/70 pt-4">
              <button className="btn btn-ghost w-full text-sm" onClick={handleSignOutEverywhere}>
                <ShieldCheck size={16} /> Cerrar sesión en todos los dispositivos
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Perfiles locales */}
      {mode === 'local' && (
        <section className="space-y-3">
          <h2 className="section-title">Perfiles del dispositivo</h2>
          <div className="card space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Users size={16} /> Otros perfiles
            </div>
            <div className="space-y-1">
              {users
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setCurrentUser(u)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition:hover:bg-zinc-800/60 active:scale-[0.99]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 font-semibold text-zinc-200">
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 truncate text-zinc-200">{u.name}</span>
                    <ChevronRight size={16} className="text-zinc-600" />
                  </button>
                ))}
              {users.length <= 1 && <p className="text-xs text-zinc-500">No hay otros perfiles hoy</p>}
            </div>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Nuevo perfil"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                maxLength={40}
              />
              <button
                type="button"
                className="btn btn-secondary shrink-0 px-3.5"
                onClick={handleCreateProfile}
                aria-label="Crear perfil"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Datos */}
      <section className="space-y-3">
        <h2 className="section-title">Datos</h2>
        {mode === 'cloud' && (
          <div className="card flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
              <Database size={17} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Sincronización en la nube</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                Tus grupos, planes y apuestas se guardan en Supabase y se actualizan en tiempo real en todos tus dispositivos.
              </p>
            </div>
          </div>
        ) || (
          <div className="card space-y-2">
            <button className="btn btn-secondary w-full" onClick={handleExport}>
              <Download size={16} /> Exportar copia de seguridad
            </button>
            <button className="btn btn-secondary w-full" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Importar copia
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
            <p className="text-xs leading-relaxed text-zinc-500">
              La copia incluye todos los perfiles, grupos y planes guardados en este dispositivo.
            </p>
          </div>
        )}
      </section>

      {/* Acerca de */}
      <section className="space-y-3">
        <h2 className="section-title">Acerca de</h2>
        <div className="card space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Versión</span>
            <span className="font-mono text-xs text-zinc-500">3.2.6</span>
          </div>
          <a
            href="https://github.com/giocavallic-lgtm/gruppal"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between text-sm text-zinc-300 transition hover:text-zinc-100"
          >
            <span className="flex items-center gap-2">
              <Code2 size={16} /> Código en GitHub
            </span>
            <ChevronRight size={16} className="text-zinc-600" />
          </a>
          <div className="flex gap-2 rounded-xl bg-zinc-800/50 p-3 text-xs leading-relaxed text-zinc-500">
            <Info size={16} className="mt-0.5 shrink-0 text-zinc-400" />
            <p>
              Las apuestas usan crédito de juego. El dinero real queda fuera de Crewzy y es responsabilidad de cada
              participante.
            </p>
          </div>
        </div>
      </section>

      <button className="btn btn-danger w-full" onClick={handleLogout}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}