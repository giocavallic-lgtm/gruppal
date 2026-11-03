import { useState, useRef } from 'react';
import { LogOut, Download, Upload, Plus } from 'lucide-react';
import { useStore } from '../store';

export default function Profile() {
  const currentUser = useStore((s) => s.currentUser)!;
  const users = useStore((s) => s.users);
  const session = useStore((s) => s.session);
  const mode = useStore((s) => s.mode);
  const updateUser = useStore((s) => s.updateUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const createUser = useStore((s) => s.createUser);
  const signOut = useStore((s) => s.signOut);

  const [name, setName] = useState(currentUser.name);
  const [newName, setNewName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (name.trim()) updateUser(currentUser.id, { name: name.trim() });
  };

  const handleLogout = () => {
    if (mode === 'cloud') signOut();
    else setCurrentUser(null);
  };

  const handleCreateProfile = () => {
    if (!newName.trim()) return;
    const u = createUser(newName.trim());
    setNewName('');
    setCurrentUser(u);
  };

  const handleExport = () => {
    const data = localStorage.getItem('gruppal-store');
    const blob = new Blob([data ?? '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gruppal-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        localStorage.setItem('gruppal-store', JSON.stringify(parsed));
        window.location.reload();
      } catch {
        alert('Archivo inválido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-zinc-100">Perfil</h2>

      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-200 text-xl font-semibold">{currentUser.name[0].toUpperCase()}</div>
          <div className="flex-1">
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            {session?.user?.email && <p className="text-xs text-zinc-500 mt-1">{session.user.email}</p>}
          </div>
        </div>
        <button className="btn btn-primary w-full" onClick={handleSave}>Guardar</button>
      </div>

      {mode === 'local' && (
      <div className="card space-y-3">
        <h3 className="font-semibold text-zinc-200">Otros perfiles en este dispositivo</h3>
        <div className="space-y-2">
          {users.filter((u) => u.id !== currentUser.id).map((u) => (
            <button key={u.id} onClick={() => setCurrentUser(u)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 text-left">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-200 font-semibold">{u.name[0].toUpperCase()}</div>
              <span className="text-zinc-200">{u.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input" placeholder="Nuevo perfil" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn btn-secondary" onClick={handleCreateProfile}><Plus size={16} /></button>
        </div>
      </div>
      )}

      <div className="card space-y-3">
        <h3 className="font-semibold text-zinc-200">Datos</h3>
        <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={handleExport}><Download size={16} /> Exportar backup</button>
        <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar backup</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />
      </div>

      <button className="btn btn-danger w-full flex items-center justify-center gap-2" onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</button>
    </div>
  );
}