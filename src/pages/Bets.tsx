import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Dice5, X, ArrowRight, Info } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

export default function Bets() {
  const { id } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const users = useStore((s) => s.users);
  const allBets = useStore((s) => s.bets);
  const bets = allBets.filter((b) => b.groupId === id);
  const createBet = useStore((s) => s.createBet);
  const currentUser = useStore((s) => s.currentUser)!;

  const [open, setOpen] = useState(params.get('new') === '1');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState<string[]>(['Sí', 'No']);
  const [optInput, setOptInput] = useState('');

  useEffect(() => {
    if (params.get('new') === '1') setOpen(true);
  }, [params]);

  const memberUsers = (
    (group?.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean) as any[]) ?? []
  ).filter((u: any) => u.id !== currentUser.id);

  const addOpt = () => {
    if (!optInput.trim()) return;
    setOptions([...options, optInput.trim()]);
    setOptInput('');
  };
  const removeOpt = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  const handleCreate = () => {
    if (!title.trim() || !target || options.length < 2) return;
    const b = createBet(group!.id, title.trim(), target, options, desc.trim() || undefined);
    setOpen(false);
    setTitle('');
    setDesc('');
    setTarget('');
    setOptions(['Sí', 'No']);
    nav(`/bets/${b.id}`);
  };

  const visibleBets = bets.filter((b) => b.targetUserId !== currentUser.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Apuestas"
        backTo={`/groups/${id}`}
        subtitle={group?.name}
        action={
          <button
            type="button"
            className="btn btn-primary h-10 px-3.5!"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} /> Nueva
          </button>
        }
      />

      <div className="flex gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs leading-relaxed text-zinc-500">
        <Info size={16} className="mt-0.5 shrink-0 text-zinc-400" />
        <p>
          Las apuestas usan <strong className="font-semibold text-zinc-300">crédito de juego</strong>. El dinero real queda
          fuera de Crewzy y es responsabilidad de cada participante.
        </p>
      </div>

      {visibleBets.length === 0 && (
        <div className="card flex flex-col items-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800 text-zinc-400">
            <Dice5 size={28} />
          </div>
          <p className="mt-4 font-semibold text-zinc-200">Sin apuestas visibles</p>
          <p className="mt-1 max-w-[250px] text-sm leading-relaxed text-zinc-500">
            Las apuestas que son sobre ti se mantienen en secreto.
          </p>
          <button className="btn btn-secondary mt-5" onClick={() => setOpen(true)}>
            <Plus size={16} /> Crear apuesta
          </button>
        </div>
      )}

      <div className="space-y-3">
        {visibleBets.map((b) => {
          const t = users.find((u) => u.id === b.targetUserId);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => nav(`/bets/${b.id}`)}
              className="card card-hover"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-zinc-100">{b.title}</h3>
                  <p className="truncate text-sm text-zinc-500">Sobre: {t?.name ?? '?'}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className={`chip ${
                        b.status === 'open' ? 'chip-open' : b.status === 'resolved' ? 'chip-resolved' : 'chip-cancelled'
                      }`}
                    >
                      {b.status === 'open' ? 'Abierta' : b.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                    </span>
                    <span className="text-zinc-500">
                      {b.wagers.length} apuesta{b.wagers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} className="shrink-0 text-zinc-600" />
              </div>
            </button>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva apuesta">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="bet-title">
              Título
            </label>
            <input
              id="bet-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Llegará tarde Juan?"
              maxLength={80}
            />
          </div>
          <div>
            <label className="label" htmlFor="bet-desc">
              Descripción <span className="normal-case tracking-normal text-zinc-600">(opcional)</span>
            </label>
            <input
              id="bet-desc"
              className="input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Detalles de la apuesta"
              maxLength={140}
            />
          </div>
          <div>
            <label className="label" htmlFor="bet-target">
              Sobre quién <span className="normal-case tracking-normal text-zinc-600">(no verá la apuesta)</span>
            </label>
            <select
              id="bet-target"
              className="input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {memberUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Opciones</label>
            <div className="mb-2 flex gap-2">
              <input
                className="input"
                value={optInput}
                onChange={(e) => setOptInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOpt())}
                placeholder="Añadir opción"
                maxLength={40}
              />
              <button type="button" className="btn btn-secondary shrink-0 px-3.5" onClick={addOpt} aria-label="Añadir opción">
                <Plus size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {options.map((o, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-lg border border-zinc-700/60 bg-zinc-800/70 px-2.5 py-1 text-sm text-zinc-200"
                >
                  {o}
                  <button
                    type="button"
                    onClick={() => removeOpt(i)}
                    className="text-zinc-500 transition hover:text-red-400"
                    aria-label={`Quitar ${o}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <p className="flex gap-2 rounded-xl bg-zinc-800/50 p-3 text-xs leading-relaxed text-zinc-500">
            <Info size={15} className="mt-0.5 shrink-0 text-zinc-400" />
            Apuesta con crédito de juego. Crewzy no gestiona dinero real.
          </p>

          <button
            className="btn btn-primary w-full py-3"
            onClick={handleCreate}
            disabled={!title.trim() || !target || options.length < 2}
          >
            Crear apuesta
          </button>
        </div>
      </Modal>
    </div>
  );
}
