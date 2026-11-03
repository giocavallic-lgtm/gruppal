import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Dice5, X } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';

export default function Bets() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const users = useStore((s) => s.users);
  const bets = useStore((s) => s.bets.filter((b) => b.groupId === id));
  const createBet = useStore((s) => s.createBet);
  const currentUser = useStore((s) => s.currentUser)!;

  const [open, setOpen] = useState(params.get('new') === '1');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState<string[]>(['Sí', 'No']);
  const [optInput, setOptInput] = useState('');

  useEffect(() => { if (params.get('new') === '1') setOpen(true); }, [params]);

  const memberUsers = group?.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean) as any[] ?? [];

  const addOpt = () => {
    if (!optInput.trim()) return;
    setOptions([...options, optInput.trim()]);
    setOptInput('');
  };
  const removeOpt = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  const handleCreate = () => {
    if (!title.trim() || !target || options.length < 2) return;
    const b = createBet(group!.id, title.trim(), target, options, desc.trim() || undefined);
    setOpen(false); setTitle(''); setDesc(''); setTarget(''); setOptions(['Sí', 'No']);
    nav(`/bets/${b.id}`);
  };

  const visibleBets = bets.filter((b) => b.targetUserId !== currentUser.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-100">Apuestas · {group?.name}</h2>
        <button className="btn btn-primary flex items-center gap-1" onClick={() => setOpen(true)}><Plus size={16} /> Nueva</button>
      </div>

      {visibleBets.length === 0 && (
        <div className="card text-center py-10">
          <Dice5 size={32} className="mx-auto text-zinc-500" />
          <p className="text-zinc-400 mt-2">Sin apuestas visibles</p>
          <p className="text-zinc-500 text-sm">Las apuestas sobre ti son secretas</p>
        </div>
      )}

      <div className="space-y-3">
        {visibleBets.map((b) => {
          const target = users.find((u) => u.id === b.targetUserId);
          return (
            <button key={b.id} onClick={() => nav(`/bets/${b.id}`)} className="card w-full text-left hover:bg-zinc-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-100">{b.title}</h3>
                  <p className="text-sm text-zinc-400">Sobre: {target?.name ?? '?'}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${b.status === 'open' ? 'bg-zinc-700 text-zinc-200' : b.status === 'resolved' ? 'bg-green-900/40 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
                      {b.status === 'open' ? 'Abierta' : b.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                    </span>
                    <span className="text-zinc-500">{b.wagers.length} apuestas</span>
                  </div>
                </div>
                <ArrowRightIcon />
              </div>
            </button>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva apuesta">
        <div className="space-y-3">
          <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Llegará tarde Juan?" /></div>
          <div><label className="label">Descripción</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div>
            <label className="label">Sobre quién (no verá la apuesta)</label>
            <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Selecciona...</option>
              {memberUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Opciones</label>
            <div className="flex gap-2 mb-2">
              <input className="input" value={optInput} onChange={(e) => setOptInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOpt())} placeholder="Añadir opción" />
              <button className="btn btn-secondary" onClick={addOpt}>+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((o, i) => (
                <span key={i} className="px-2 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-200 flex items-center gap-1">
                  {o} <button onClick={() => removeOpt(i)} className="text-zinc-500 hover:text-red-400"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-primary w-full" onClick={handleCreate}>Crear apuesta</button>
        </div>
      </Modal>
    </div>
  );
}

function ArrowRightIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
}