import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';

export default function Home() {
  const groups = useStore((s) => s.groups);
  const plans = useStore((s) => s.plans);
  const createGroup = useStore((s) => s.createGroup);
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const g = createGroup(name.trim(), desc.trim() || undefined);
    setOpen(false);
    setName(''); setDesc('');
    nav(`/groups/${g.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-100">Mis grupos</h2>
        <button className="btn btn-primary flex items-center gap-1" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {groups.length === 0 && (
        <div className="card text-center py-10">
          <Users size={32} className="mx-auto text-zinc-500" />
          <p className="text-zinc-400 mt-2">Aún no tienes grupos</p>
          <p className="text-zinc-500 text-sm">Crea uno para empezar</p>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((g) => {
          const gPlans = plans.filter((p) => p.groupId === g.id);
          return (
            <button key={g.id} onClick={() => nav(`/groups/${g.id}`)} className="card w-full text-left hover:bg-zinc-800/60 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-100">{g.name}</h3>
                  {g.description && <p className="text-sm text-zinc-400">{g.description}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {g.members.length}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {gPlans.length} planes</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-zinc-500" />
              </div>
            </button>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo grupo">
        <div className="space-y-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amigos del cole" />
          </div>
          <div>
            <label className="label">Descripción (opcional)</label>
            <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="..." />
          </div>
          <button className="btn btn-primary w-full" onClick={handleCreate}>Crear</button>
        </div>
      </Modal>
    </div>
  );
}