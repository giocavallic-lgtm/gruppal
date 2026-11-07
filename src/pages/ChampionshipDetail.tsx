import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { computeStandings, formatDate, pointsForPosition, formatTimeMs } from '../utils';

export default function ChampionshipDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const championship = useStore((s) => s.championships.find((c) => c.id === id));
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const addEvent = useStore((s) => s.addChampionshipEvent);
  const deleteEvent = useStore((s) => s.deleteChampionshipEvent);
  const deleteChampionship = useStore((s) => s.deleteChampionship);
  const setEventResults = useStore((s) => s.setEventResults);

  const [eventOpen, setEventOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTandas, setEventTandas] = useState(1);
  const [resultsEventId, setResultsEventId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, string>>({});
  const [tandaTimes, setTandaTimes] = useState<Record<string, Record<number, { h: string; min: string; s: string; ms: string }>>>({});

  if (!championship) {
    return <p className="py-10 text-center text-sm text-zinc-500">Campeonato no encontrado.</p>;
  }

  const isTimes = championship.scoringType === 'times';

  const group = groups.find((g) => g.id === championship.groupId);
  const members = (group?.members ?? [])
    .map((m) => users.find((u) => u.id === m.userId))
    .filter(Boolean) as { id: string; name: string; avatar?: string }[];

  const standings = computeStandings(championship);
  const activeEvent = championship.events.find((e) => e.id === resultsEventId);

  const handleAddEvent = () => {
    if (!eventName.trim()) return;
    addEvent(
      championship.id,
      eventName.trim(),
      eventDate ? new Date(eventDate).getTime() : undefined,
      eventTandas > 1 ? eventTandas : undefined
    );
    setEventOpen(false);
    setEventName('');
    setEventDate('');
    setEventTandas(1);
  };

  const openResults = (eventId: string) => {
    const ev = championship.events.find((e) => e.id === eventId);
    const posMap: Record<string, string> = {};
    const tandaMap: Record<string, Record<number, { h: string; min: string; s: string; ms: string }>> = {};
    for (const m of members) {
      const result = ev?.results.find((r) => r.userId === m.id);
      posMap[m.id] = result ? String(result.position) : '';
      if (result?.tandaTimes?.length) {
        tandaMap[m.id] = result.tandaTimes.reduce((acc: Record<number, { h: string; min: string; s: string; ms: string }>, t, i) => {
          const totalMs = t;
          const h = Math.floor(totalMs / 3600000);
          const min = Math.floor((totalMs % 3600000) / 60000);
          const s = Math.floor((totalMs % 60000) / 1000);
          const ms = totalMs % 1000;
          acc[i] = { h: String(h), min: String(min), s: String(s), ms: String(ms) };
          return acc;
        }, {});
      }
    }
    setPositions(posMap);
    setTandaTimes(tandaMap);
    setResultsEventId(eventId);
  };

  const handleTandaChange = (userId: string, tandaIdx: number, field: 'h' | 'min' | 's' | 'ms', value: string) => {
    setTandaTimes((prev) => {
      const userTandas = prev[userId] ?? {};
      const current = userTandas[tandaIdx] ?? { h: '0', min: '0', s: '0', ms: '0' };
      const updated = { ...current, [field]: value };
      return { ...prev, [userId]: { ...userTandas, [tandaIdx]: updated } };
    });
  };

  const handleSaveResults = () => {
    if (!activeEvent) return;
    if (isTimes) {
      const tandas = activeEvent.tandas ?? 1;
      const entries: { userId: string; timeMs?: number; tandaTimes?: number[] }[] = [];
      for (const m of members) {
        const userTandas = tandaTimes[m.id] ?? {};
        const tandaValues: number[] = [];
        let totalMs = 0;
        for (let i = 0; i < tandas; i++) {
          const t = userTandas[i];
          if (t) {
            const tMs = (parseInt(t.h) || 0) * 3600000 + (parseInt(t.min) || 0) * 60000 + (parseInt(t.s) || 0) * 1000 + (parseInt(t.ms) || 0);
            tandaValues.push(tMs);
            totalMs += tMs;
          }
        }
        if (tandaValues.length > 0 || totalMs > 0) {
          entries.push({ userId: m.id, timeMs: totalMs > 0 ? totalMs : undefined, tandaTimes: tandaValues.length > 0 ? tandaValues : undefined });
        }
      }
      setEventResults(championship.id, activeEvent.id, entries);
      setTandaTimes({});
      setResultsEventId(null);
      return;
    }
    const entries: { userId: string; position: number }[] = [];
    const used = new Set<number>();
    for (const m of members) {
      const raw = positions[m.id];
      const pos = raw ? parseInt(raw, 10) : NaN;
      if (!Number.isFinite(pos) || pos <= 0) continue;
      if (used.has(pos)) {
        alert('Hay posiciones repetidas. Cada participante debe tener una posición distinta.');
        return;
      }
      used.add(pos);
      entries.push({ userId: m.id, position: pos });
    }
    setEventResults(championship.id, activeEvent.id, entries);
    setResultsEventId(null);
  };

  const handleDeleteChampionship = () => {
    if (confirm('¿Eliminar este campeonato y todas sus pruebas?')) {
      const g = group; // already computed above from groups.find
      const isOwner = currentUser?.id === g?.ownerId;
      const isAdmin = g?.members?.some((m) => m.userId === currentUser?.id && m.role === 'admin');
      if (!isOwner && !isAdmin) {
        alert('Solo el creador del grupo o un administrador pueden eliminar campeonatos.');
        return;
      }
      deleteChampionship(championship.id);
      nav(`/groups/${championship.groupId}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={championship.name}
        backTo={`/groups/${championship.groupId}`}
        subtitle={`${championship.events.length} ${championship.events.length === 1 ? 'prueba' : 'pruebas'} · ${members.length} participantes`}
        action={
          <button
            type="button"
            onClick={handleDeleteChampionship}
            aria-label="Eliminar campeonato"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        }
      />

      {championship.description && <p className="text-sm text-zinc-400">{championship.description}</p>}

      <div className="card flex items-center gap-2.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
          <Trophy size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-400">
            {isTimes ? 'Puntuación por tiempos' : 'Puntos por posición'}
          </p>
          <p className="truncate text-xs tabular-nums text-zinc-500">
            {isTimes
              ? 'Menor tiempo total gana'
              : championship.pointsSystem.join(' · ')}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="section-title">Clasificación</h2>

        {standings.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Todavía no hay resultados. Añade una prueba y sus posiciones.
          </p>
        ) : isTimes ? (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[300px] text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 text-center font-medium">#</th>
                  <th className="px-2 py-2 text-left font-medium">Participante</th>
                  <th className="px-2 py-2 text-center font-medium">P</th>
                  <th className="px-2 py-2 text-center font-medium">Mejor</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const user = users.find((u) => u.id === row.userId);
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
                  return (
                    <tr key={row.userId} className="border-t border-zinc-800/70">
                      <td className="px-3 py-2 text-center text-xs tabular-nums text-zinc-400">{medal}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 ring-1 ring-zinc-700/60">
                            {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : user?.name?.[0] ?? '?'}
                          </span>
                          <span className="truncate text-zinc-200">{user?.name ?? 'Usuario'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-xs tabular-nums text-zinc-400">{row.races}</td>
                      <td className="px-2 py-2 text-center text-xs tabular-nums text-zinc-400">{row.bestTimeMs != null ? formatTimeMs(row.bestTimeMs) : '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-zinc-100">{row.totalTimeMs != null ? formatTimeMs(row.totalTimeMs) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2 text-center font-medium">#</th>
                  <th className="px-2 py-2 text-left font-medium">Participante</th>
                  <th className="px-2 py-2 text-center font-medium">P</th>
                  <th className="px-2 py-2 text-center font-medium">V</th>
                  <th className="px-3 py-2 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const user = users.find((u) => u.id === row.userId);
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
                  return (
                    <tr key={row.userId} className="border-t border-zinc-800/70">
                      <td className="px-3 py-2 text-center text-xs tabular-nums text-zinc-400">{medal}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 ring-1 ring-zinc-700/60">
                            {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : user?.name?.[0] ?? '?'}
                          </span>
                          <span className="truncate text-zinc-200">{user?.name ?? 'Usuario'}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center text-xs tabular-nums text-zinc-400">{row.races}</td>
                      <td className="px-2 py-2 text-center text-xs tabular-nums text-zinc-400">{row.wins}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-zinc-100">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title">Pruebas</h2>
          <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => setEventOpen(true)}>
            <Plus size={14} /> Añadir
          </button>
        </div>

        {championship.events.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">
            Añade la primera carrera, rally o triatlón del campeonato.
          </p>
        )}

        {championship.events.map((event) => {
          const sorted = [...event.results].sort((a, b) =>
            isTimes ? (a.timeMs ?? Number.MAX_SAFE_INTEGER) - (b.timeMs ?? Number.MAX_SAFE_INTEGER) : a.position - b.position
          );
          const winner = sorted[0];
          const winnerName = winner ? users.find((u) => u.id === winner.userId)?.name : null;
          const winnerExtra = winner
            ? isTimes && winner.timeMs != null
              ? ` · ${formatTimeMs(winner.timeMs)}`
              : ''
            : '';
          return (
            <div key={event.id} className="card space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">{event.name}</p>
                  <p className="text-xs text-zinc-500">
                    {event.date ? formatDate(event.date) : 'Sin fecha'}
                    {event.tandas && event.tandas > 1 ? ` · ${event.tandas} tandas` : ''}
                    {winnerName ? ` · Ganador: ${winnerName}${winnerExtra}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar esta prueba y sus resultados?')) {
                      deleteEvent(championship.id, event.id);
                    }
                  }}
                  aria-label="Eliminar prueba"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {event.results.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sorted.slice(0, 3).map((r) => {
                    const name = users.find((u) => u.id === r.userId)?.name ?? '—';
                    return (
                      <span key={r.userId} className="chip chip-open">
                        {r.position}º {name}
                        {isTimes && r.timeMs != null ? ` · ${formatTimeMs(r.timeMs)}` : ` · ${r.points} pts`}
                      </span>
                    );
                  })}
                </div>
              )}
              <button className="btn btn-secondary w-full text-xs" onClick={() => openResults(event.id)}>
                {event.results.length > 0 ? 'Editar resultados' : 'Añadir resultados'}
              </button>
            </div>
          );
        })}
      </section>

      <Modal open={eventOpen} onClose={() => setEventOpen(false)} title="Nueva prueba">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="event-name">Nombre</label>
            <input id="event-name" className="input" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Rally de Montecarlo" maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="event-date">Fecha <span className="normal-case tracking-normal text-zinc-600">(opcional)</span></label>
            <input id="event-date" type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="event-tandas">Tandas / rondas</label>
            <input
              id="event-tandas"
              type="number"
              min="1"
              max="10"
              step="1"
              inputMode="numeric"
              className="input"
              value={eventTandas}
              onChange={(e) => setEventTandas(parseInt(e.target.value) || 1)}
              placeholder="1"
            />
            <p className="text-[10px] text-zinc-500 mt-1">Ej: 3 para 3 tandas del rally. La app sumará los tiempos.</p>
          </div>
          <button className="btn btn-primary w-full py-3" onClick={handleAddEvent} disabled={!eventName.trim()}>
            Añadir prueba
          </button>
        </div>
      </Modal>

      <Modal open={!!resultsEventId} onClose={() => setResultsEventId(null)} title={activeEvent ? `Resultados · ${activeEvent.name}` : 'Resultados'}>
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-zinc-500">
            {isTimes
              ? `Introduce el tiempo de cada participante por tanda. Usa horas, minutos, segundos y milisegundos. ${activeEvent?.tandas && activeEvent.tandas > 1 ? `Esta prueba tiene ${activeEvent.tandas} tandas.` : ''}`
              : 'Pon la posición de llegada de cada participante. Deja vacío si no participó. Los puntos se calculan solos.'}
          </p>
          {members.map((m) => {
            if (isTimes) {
              const tandas = activeEvent?.tandas ?? 1;
              const userTandas = tandaTimes[m.id] ?? {};
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700/60">
                    {m.avatar ? <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" /> : m.name?.[0] ?? '?'}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{m.name}</span>
                  <div className="flex gap-2 flex-wrap">
                    {[...Array(tandas)].map((_, ti) => (
                      <div key={ti} className="flex gap-1">
                        <span className="text-[10px] text-zinc-500 mt-0.5">T{ti + 1}</span>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          step="1"
                          inputMode="numeric"
                          className="input w-5 py-1 text-center text-xs"
                          value={userTandas[ti]?.h ?? '0'}
                          onChange={(e) => handleTandaChange(m.id, ti, 'h', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="1"
                          inputMode="numeric"
                          className="input w-5 py-1 text-center text-xs"
                          value={userTandas[ti]?.min ?? '0'}
                          onChange={(e) => handleTandaChange(m.id, ti, 'min', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          max="59"
                          step="1"
                          inputMode="numeric"
                          className="input w-5 py-1 text-center text-xs"
                          value={userTandas[ti]?.s ?? '0'}
                          onChange={(e) => handleTandaChange(m.id, ti, 's', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          max="999"
                          step="1"
                          inputMode="numeric"
                          className="input w-5 py-1 text-center text-xs"
                          value={userTandas[ti]?.ms ?? '0'}
                          onChange={(e) => handleTandaChange(m.id, ti, 'ms', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            const raw = positions[m.id] ?? '';
            const pos = raw ? parseInt(raw, 10) : 0;
            const pts = pos > 0 ? pointsForPosition(championship.pointsSystem, pos) : null;
            return (
              <div key={m.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700/60">
                  {m.avatar ? <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" /> : m.name?.[0] ?? '?'}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{m.name}</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(members.length, 1)}
                  inputMode="numeric"
                  className="input w-16 py-1.5 text-center"
                  value={raw}
                  onChange={(e) => setPositions((p) => ({ ...p, [m.id]: e.target.value }))}
                  placeholder="—"
                  aria-label={`Posición de ${m.name}`}
                />
                <span className="w-14 text-right text-xs tabular-nums text-zinc-500">
                  {pts === null ? '' : `${pts} pts`}
                </span>
              </div>
            );
          })}
          <button className="btn btn-primary w-full py-3" onClick={handleSaveResults}>
            Guardar resultados
          </button>
        </div>
      </Modal>
    </div>
  );
}

