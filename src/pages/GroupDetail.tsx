import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, UserPlus, ArrowRight, Copy, Check, Share2, Info, Trophy } from 'lucide-react';
import { useStore } from '../store';
import { hasSupabase } from '../config';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import GroupChat from '../components/GroupChat';
import { formatDate } from '../utils';
import { computeStandings, F1_POINTS, SIMPLE_POINTS } from '../utils';

export default function GroupDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const users = useStore((s) => s.users);
  const allPlans = useStore((s) => s.plans);
  const allBets = useStore((s) => s.bets);
  const allChampionships = useStore((s) => s.championships);
  const plans = allPlans.filter((p) => p.groupId === id);
  const bets = allBets.filter((b) => b.groupId === id);
  const championships = allChampionships.filter((c) => c.groupId === id);
  const createPlan = useStore((s) => s.createPlan);
  const createChampionship = useStore((s) => s.createChampionship);
  const deleteGroup = useStore((s) => s.deleteGroup);
  const addMember = useStore((s) => s.addMember);
  const removeMember = useStore((s) => s.removeMember);
  const currentUser = useStore((s) => s.currentUser)!;

  const [tab, setTab] = useState<'chat' | 'plans' | 'bets' | 'members'>('plans');
  const [planOpen, setPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);
  const [champOpen, setChampOpen] = useState(false);
  const [champName, setChampName] = useState('');
  const [champDesc, setChampDesc] = useState('');
  const [champPreset, setChampPreset] = useState<'f1' | 'simple' | 'custom'>('f1');
  const [champPoints, setChampPoints] = useState(F1_POINTS.join(', '));
  const [copied, setCopied] = useState(false);

  if (!group) return <div className="text-zinc-400">Grupo no encontrado</div>;

  const memberUsers = group.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean) as any[];
  const nonMembers = users.filter((u) => !group.members.some((m) => m.userId === u.id));
  const visibleBets = bets.filter((b) => b.targetUserId !== currentUser.id);

  const handleCreatePlan = () => {
    if (!planTitle.trim()) return;
    const p = createPlan(
      group.id,
      planTitle.trim(),
      planDesc.trim() || undefined,
      planDate ? new Date(planDate).getTime() : undefined
    );
    setPlanOpen(false);
    setPlanTitle('');
    setPlanDesc('');
    setPlanDate('');
    nav(`/plans/${p.id}`);
  };

  const handleCreateChampionship = () => {
    if (!champName.trim()) return;
    const points =
      champPreset === 'f1'
        ? F1_POINTS
        : champPreset === 'simple'
          ? SIMPLE_POINTS
          : champPoints
              .split(/[\s,;]+/)
              .map((x) => parseInt(x, 10))
              .filter((n) => Number.isFinite(n) && n >= 0);
    if (!points.length) return;
    const c = createChampionship(group.id, champName.trim(), champDesc.trim() || undefined, points);
    setChampOpen(false);
    setChampName('');
    setChampDesc('');
    setChampPreset('f1');
    setChampPoints(F1_POINTS.join(', '));
    nav(`/championships/${c.id}`);
  };

  const handleDeleteGroup = () => {
    if (confirm('¿Eliminar grupo y todo su contenido?')) {
      deleteGroup(group.id);
      nav('/');
    }
  };

  const copyCode = async () => {
    if (!group.inviteCode) return;
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const shareCode = async () => {
    if (!group.inviteCode) return;
    const text = `Únete a "${group.name}" en Crewzy con el código ${group.inviteCode}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invitación a Crewzy', text });
        return;
      } catch {
        return;
      }
    }
    await copyCode();
  };

  return (
    <div className={tab === 'chat' ? 'flex min-h-0 flex-1 flex-col gap-4' : 'space-y-5'}>
      <PageHeader
        title={group.name}
        backTo="/"
        subtitle={
          <div className="space-y-1">
            {group.description && <p>{group.description}</p>}
            <p className="text-xs text-zinc-500">{group.members.length} miembros</p>
          </div>
        }
        action={
          group.ownerId === currentUser.id ? (
            <button
              type="button"
              onClick={handleDeleteGroup}
              aria-label="Eliminar grupo"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          ) : undefined
        }
      />

      <div className="seg" role="tablist" aria-label="Secciones del grupo">
        {(['chat', 'plans', 'bets', 'members'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tab === t ? 'active' : ''}
          >
            {t === 'chat' ? 'Chat' : t === 'plans' ? 'Planes' : t === 'bets' ? 'Apuestas' : 'Miembros'}
          </button>
        ))}
      </div>

      {tab === 'chat' && <GroupChat groupId={group.id} />}

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button className="btn btn-secondary flex-1" onClick={() => setPlanOpen(true)}>
              <Plus size={16} /> Nuevo plan
            </button>
            <button className="btn btn-secondary flex-1" onClick={() => setChampOpen(true)}>
              <Trophy size={16} /> Campeonato
            </button>
          </div>

          {championships.length > 0 && (
            <div className="space-y-2">
              <h3 className="section-title">Campeonatos</h3>
              {championships.map((c) => {
                const standings = computeStandings(c);
                const leader = standings[0];
                const leaderName = leader
                  ? users.find((u) => u.id === leader.userId)?.name ?? '—'
                  : null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => nav(`/championships/${c.id}`)}
                    className="card card-hover flex items-center gap-3"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
                      <Trophy size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-zinc-100">{c.name}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {c.events.length} {c.events.length === 1 ? 'prueba' : 'pruebas'}
                        {leaderName ? ` · Líder: ${leaderName} (${leader.points} pts)` : ' · Sin resultados'}
                      </span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-zinc-600" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            {championships.length > 0 && <h3 className="section-title">Planes</h3>}

            {plans.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">Todavía no hay planes. Crea el primero.</p>
            )}

            {plans.map((p) => {
              const done = p.tasks.filter((t) => t.status === 'done').length;
              const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => nav(`/plans/${p.id}`)}
                  className="card card-hover space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-100">{p.title}</h3>
                      {p.description && <p className="truncate text-sm text-zinc-500">{p.description}</p>}
                    </div>
                    <ArrowRight size={18} className="shrink-0 text-zinc-600" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {p.date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(p.date)}
                      </span>
                    )}
                    <span>{p.tasks.length} tareas</span>
                    <span>{p.expenses.length} gastos</span>
                  </div>
                  {p.tasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="progress flex-1">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-zinc-500">{pct}%</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'bets' && (
        <div className="space-y-3">
          <div className="flex gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs leading-relaxed text-zinc-500">
            <Info size={16} className="mt-0.5 shrink-0 text-zinc-400" />
            <p>
              Las apuestas usan <strong className="font-semibold text-zinc-300">crédito de juego</strong>. El dinero real
              queda fuera de Crewzy y es responsabilidad de cada participante.
            </p>
          </div>

          <button
            className="btn btn-secondary w-full"
            onClick={() => nav(`/groups/${group.id}/bets?new=1`)}
          >
            <Plus size={16} /> Nueva apuesta
          </button>

          {visibleBets.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Sin apuestas visibles. Las que son sobre ti se mantienen en secreto.</p>
          )}

          {visibleBets.map((b) => {
            const target = users.find((u) => u.id === b.targetUserId);
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
                    <p className="truncate text-sm text-zinc-500">Sobre: {target?.name ?? '?'}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span
                        className={`chip ${
                          b.status === 'open' ? 'chip-open' : b.status === 'resolved' ? 'chip-resolved' : 'chip-cancelled'
                        }`}
                      >
                        {b.status === 'open' ? 'Abierta' : b.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
                      </span>
                      <span className="text-zinc-500">{b.wagers.length} apuestas</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-zinc-600" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-3">
          <div className="card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Código de invitación
                </p>
                <p className="mt-1 truncate font-mono text-2xl tracking-[0.18em] text-zinc-100">
                  {group.inviteCode ?? '—'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary h-10 w-10 shrink-0 px-0!"
                onClick={copyCode}
                aria-label="Copiar código"
              >
                {copied ? <Check size={18} className="text-pos" /> : <Copy size={18} />}
              </button>
            </div>

            {hasSupabase ? (
              <>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Comparte este código para que tus amigos se unan desde su móvil con «Unirse».
                </p>
                <button className="btn btn-primary w-full" onClick={shareCode}>
                  <Share2 size={16} /> Compartir invitación
                </button>
              </>
            ) : (
              <button className="btn btn-secondary w-full" onClick={() => setMemberOpen(true)}>
                <UserPlus size={16} /> Añadir miembro (local)
              </button>
            )}
          </div>

          <div className="space-y-2">
            {memberUsers.map((u: any) => {
              const m = group.members.find((x) => x.userId === u.id)!;
              return (
                <div key={u.id} className="card flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 font-semibold text-zinc-200">
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-100">
                        {u.name}{' '}
                        {u.id === currentUser.id && <span className="text-xs text-zinc-500">(tú)</span>}
                      </p>
                      <p className="text-xs text-zinc-500">{m.role === 'admin' ? 'Admin' : 'Miembro'}</p>
                    </div>
                  </div>
                  {group.ownerId === currentUser.id && u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => removeMember(group.id, u.id)}
                      aria-label={`Quitar a ${u.name}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Nuevo plan">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="plan-title">
              Título
            </label>
            <input
              id="plan-title"
              className="input"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="Escapada a la playa"
              maxLength={60}
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-desc">
              Descripción <span className="normal-case tracking-normal text-zinc-600">(opcional)</span>
            </label>
            <input
              id="plan-desc"
              className="input"
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              placeholder="Detalles del plan"
              maxLength={120}
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-date">
              Fecha del plan
            </label>
            <input
              id="plan-date"
              type="date"
              className="input"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
            />
          </div>
          <button className="btn btn-primary w-full py-3" onClick={handleCreatePlan} disabled={!planTitle.trim()}>
            Crear plan
          </button>
        </div>
      </Modal>

      <Modal open={champOpen} onClose={() => setChampOpen(false)} title="Nuevo campeonato">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="champ-name">
              Nombre
            </label>
            <input
              id="champ-name"
              className="input"
              value={champName}
              onChange={(e) => setChampName(e.target.value)}
              placeholder="Campeonato F1 2026"
              maxLength={60}
            />
          </div>
          <div>
            <label className="label" htmlFor="champ-desc">
              Descripción <span className="normal-case tracking-normal text-zinc-600">(opcional)</span>
            </label>
            <input
              id="champ-desc"
              className="input"
              value={champDesc}
              onChange={(e) => setChampDesc(e.target.value)}
              placeholder="Rallys, resistencia, triatlones…"
              maxLength={120}
            />
          </div>
          <div>
            <span className="label">Puntos por posición</span>
            <div className="seg mb-2">
              {(['f1', 'simple', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChampPreset(p)}
                  className={champPreset === p ? 'active' : ''}
                >
                  {p === 'f1' ? 'F1' : p === 'simple' ? 'Simple' : 'Custom'}
                </button>
              ))}
            </div>
            {champPreset === 'custom' ? (
              <input
                className="input"
                value={champPoints}
                onChange={(e) => setChampPoints(e.target.value)}
                placeholder="25, 18, 15, 12, 10…"
              />
            ) : (
              <p className="text-xs text-zinc-500">
                {(champPreset === 'f1' ? F1_POINTS : SIMPLE_POINTS).join(' · ')}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary w-full py-3"
            onClick={handleCreateChampionship}
            disabled={!champName.trim() || (champPreset === 'custom' && !champPoints.trim())}
          >
            Crear campeonato
          </button>
        </div>
      </Modal>

      <Modal open={memberOpen} onClose={() => setMemberOpen(false)} title="Añadir miembro">
        <div className="space-y-2">
          {nonMembers.length === 0 && (
            <p className="text-sm text-zinc-500">
              No hay otros perfiles en este dispositivo. Crea perfiles en la pantalla de inicio.
            </p>
          )}
          {nonMembers.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => addMember(group.id, u.id)}
              className="card card-hover flex items-center gap-3 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 font-semibold text-zinc-200">
                {u.name[0]?.toUpperCase()}
              </div>
              <span className="text-zinc-100">{u.name}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
