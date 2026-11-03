import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { useStore } from '../store';
import { hasSupabase } from '../config';
import Modal from '../components/Modal';

export default function Home() {
  const groups = useStore((s) => s.groups);
  const plans = useStore((s) => s.plans);
  const createGroup = useStore((s) => s.createGroup);
  const joinGroupByCode = useStore((s) => s.joinGroupByCode);
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joinErr, setJoinErr] = useState('');

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
        <div className="flex gap-2">
          {hasSupabase && (
            <button className="btn btn-secondary flex items-center gap-1" onClick={() => setJoinOpen(true)}>
              <LinkIcon size={16} /> Unirse
            </button>
          )}
          <button className="btn btn-primary flex items-center gap-1" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
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

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse a un grupo">
        <div className="space-y-3">
          <div>
            <label className="label">Código de invitación</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="abc12345" />
          </div>
          {joinErr && <p className="text-red-400 text-sm">{joinErr}</p>}
          <button className="btn btn-primary w-full" onClick={async () => {
            setJoinErr('');
            try { const gid = await joinGroupByCode(code.trim()); setJoinOpen(false); setCode(''); nav(`/groups/${gid}`); }
            catch (e: any) { setJoinErr(e?.message ?? 'Código inválido'); }
          }}>Unirse</button>
        </div>
      </Modal>
    </div>
  );
}