import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { useStore } from '../store';
import { hasSupabase } from '../config';
import Modal from '../components/Modal';

export default function Home() {
  const groups = useStore((s) => s.groups);
  const plans = useStore((s) => s.plans);
  const bets = useStore((s) => s.bets);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser)!;
  const createGroup = useStore((s) => s.createGroup);
  const joinGroupByCode = useStore((s) => s.joinGroupByCode);
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [joining, setJoining] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Buenas noches' : hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const visibleBets = bets.filter((b) => b.targetUserId !== currentUser.id).length;

  const handleCreate = () => {
    if (!name.trim()) return;
    const g = createGroup(name.trim(), desc.trim() || undefined);
    setOpen(false);
    setName('');
    setDesc('');
    nav(`/groups/${g.id}`);
  };

  const handleJoin = async () => {
    setJoinErr('');
    setJoining(true);
    try {
      const gid = await joinGroupByCode(code.trim());
      setJoinOpen(false);
      setCode('');
      nav(`/groups/${gid}`);
    } catch (e: any) {
      setJoinErr(e?.message ?? 'Código inválido');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">{greeting},</p>
          <h1 className="truncate text-[28px] font-bold tracking-tight text-zinc-100">
            {currentUser.name.split(' ')[0]}
          </h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {hasSupabase && (
            <button
              type="button"
              className="btn btn-secondary h-10 w-10 px-0!"
              onClick={() => setJoinOpen(true)}
              aria-label="Unirse a un grupo con un código"
            >
              <LinkIcon size={18} />
            </button>
          )}
          <button type="button" className="btn btn-primary h-10 px-3.5!" onClick={() => setOpen(true)}>
            <Plus size={18} /> Grupo
          </button>
        </div>
      </div>

      <div className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-zinc-100/[0.06] blur-2xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Tu resumen</p>
        <div className="mt-3 flex items-end gap-7">
          <div>
            <p className="text-2xl font-bold leading-none text-zinc-100">{groups.length}</p>
            <p className="mt-1 text-xs text-zinc-500">grupos</p>
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-zinc-100">{plans.length}</p>
            <p className="mt-1 text-xs text-zinc-500">planes</p>
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-zinc-100">{visibleBets}</p>
            <p className="mt-1 text-xs text-zinc-500">apuestas</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Tus grupos</h2>
          {groups.length > 0 && <span className="text-xs text-zinc-600">{groups.length}</span>}
        </div>

        {groups.length === 0 && (
          <div className="card flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800 text-zinc-400">
              <Users size={28} />
            </div>
            <p className="mt-4 font-semibold text-zinc-200">Aún no tienes grupos</p>
            <p className="mt-1 max-w-[250px] text-sm leading-relaxed text-zinc-500">
              Crea tu primer grupo o únete con un código de invitación.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
                <Plus size={16} /> Crear grupo
              </button>
              {hasSupabase && (
                <button type="button" className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
                  Unirme
                </button>
              )}
            </div>
          </div>
        )}

        {groups.map((g) => {
          const gPlans = plans.filter((p) => p.groupId === g.id);
          const memberUsers = g.members
            .map((m) => users.find((u) => u.id === m.userId))
            .filter(Boolean)
            .slice(0, 4);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => nav(`/groups/${g.id}`)}
              className="card card-hover flex items-center gap-3.5"
            >
              <div className="flex shrink-0 -space-x-2">
                {memberUsers.length > 0 ? (
                  memberUsers.map((u: any) => (
                    <div
                      key={u.id}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-700 text-xs font-semibold text-zinc-200"
                    >
                      {u.name[0]?.toUpperCase()}
                    </div>
                  ))
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 font-semibold text-zinc-200">
                    {g.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-zinc-100">{g.name}</h3>
                {g.description && <p className="truncate text-sm text-zinc-500">{g.description}</p>}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {g.members.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {gPlans.length} planes
                  </span>
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-zinc-600" />
            </button>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo grupo">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="group-name">
              Nombre
            </label>
            <input
              id="group-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amigos del cole"
              maxLength={50}
            />
          </div>
          <div>
            <label className="label" htmlFor="group-desc">
              Descripción <span className="normal-case tracking-normal text-zinc-600">(opcional)</span>
            </label>
            <input
              id="group-desc"
              className="input"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Para qué os reunís"
              maxLength={80}
            />
          </div>
          <button className="btn btn-primary w-full py-3" onClick={handleCreate} disabled={!name.trim()}>
            Crear grupo
          </button>
        </div>
      </Modal>

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse a un grupo">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="invite-code">
              Código de invitación
            </label>
            <input
              id="invite-code"
              className="input text-center font-mono text-lg tracking-[0.2em]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="abc12345"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Pídele el código a quien haya creado el grupo.
            </p>
          </div>
          {joinErr && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{joinErr}</p>}
          <button className="btn btn-primary w-full py-3" disabled={joining || !code.trim()} onClick={handleJoin}>
            {joining ? 'Uniendo…' : 'Unirme'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
