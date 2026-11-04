import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Info, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import PageHeader from '../components/PageHeader';
import { formatDate } from '../utils';

export default function BetDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const bet = useStore((s) => s.bets.find((b) => b.id === id));
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser)!;
  const addWager = useStore((s) => s.addWager);
  const resolveBet = useStore((s) => s.resolveBet);
  const cancelBet = useStore((s) => s.cancelBet);
  const deleteBet = useStore((s) => s.deleteBet);

  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState(false);

  if (!bet) return <div className="text-zinc-400">Apuesta no encontrada</div>;

  // The target of a bet must never see it (also enforced by RLS in the cloud).
  if (bet.targetUserId === currentUser.id) {
    return (
      <div className="card py-10 text-center">
        <p className="text-zinc-400">Esta apuesta es sobre ti y es secreta.</p>
        <button className="btn btn-secondary mt-4" onClick={() => nav(-1)}>
          Volver
        </button>
      </div>
    );
  }

  const target = users.find((u) => u.id === bet.targetUserId);
  const creator = users.find((u) => u.id === bet.createdBy);
  const isAdmin = bet.createdBy === currentUser.id;
  const myWager = bet.wagers.find((w) => w.userId === currentUser.id);
  const showForm = bet.status === 'open' && (!myWager || editing);

  const handleWager = () => {
    if (!selected) return;
    addWager(bet.id, currentUser.id, selected, amount ? Number(amount) : undefined);
    setSelected(null);
    setAmount('');
    setEditing(false);
  };

  const startEditing = () => {
    if (myWager) {
      setSelected(myWager.optionId);
      setAmount(myWager.amount ? String(myWager.amount) : '');
    }
    setEditing(true);
  };

  // tally
  const tally: Record<string, number> = {};
  for (const o of bet.options) tally[o.id] = 0;
  for (const w of bet.wagers) tally[w.optionId] = (tally[w.optionId] ?? 0) + 1;
  const totalWagers = bet.wagers.length;
  const totalCredits = bet.wagers.reduce((sum, w) => sum + (w.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={bet.title}
        backTo={`/groups/${bet.groupId}/bets`}
        subtitle={`Sobre ${target?.name ?? '?'} · Creada por ${creator?.name ?? '?'}`}
      />

      <div className="flex items-center gap-2">
        <span
          className={`chip ${
            bet.status === 'open' ? 'chip-open' : bet.status === 'resolved' ? 'chip-resolved' : 'chip-cancelled'
          }`}
        >
          {bet.status === 'open' ? 'Abierta' : bet.status === 'resolved' ? 'Resuelta' : 'Cancelada'}
        </span>
        <span className="text-xs text-zinc-500">{formatDate(bet.createdAt)}</span>
      </div>

      {bet.description && <p className="text-sm leading-relaxed text-zinc-300">{bet.description}</p>}

      <div className="flex gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs leading-relaxed text-zinc-500">
        <Info size={16} className="mt-0.5 shrink-0 text-zinc-400" />
        <p>
          Apuesta con <strong className="font-semibold text-zinc-300">crédito de juego</strong>. Crewzy no gestiona dinero
          real; cualquier acuerdo económico es ajeno a la app.
        </p>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200">Opciones</h3>
          {totalCredits > 0 && <span className="text-xs text-zinc-500">{totalCredits} créditos</span>}
        </div>

        {bet.options.map((o) => {
          const isWinner = bet.winningOptionId === o.id;
          const count = tally[o.id] ?? 0;
          const pct = totalWagers ? Math.round((count / totalWagers) * 100) : 0;
          return (
            <div
              key={o.id}
              className={`rounded-xl border p-3 ${
                isWinner ? 'winner' : 'border-zinc-800/80 bg-zinc-800/30'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {isWinner && <CheckCircle2 size={16} className="shrink-0 text-pos" />}
                  <span className="truncate text-zinc-100">{o.label}</span>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {count} voto{count !== 1 ? 's' : ''} · {pct}%
                </span>
              </div>
              <div className="progress mt-2.5">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {bet.status === 'open' && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-zinc-200">Tu apuesta</h3>

          {myWager && !editing && (
            <>
              <p className="text-sm text-zinc-400">
                Apostaste por{' '}
                <span className="font-medium text-zinc-100">
                  {bet.options.find((o) => o.id === myWager.optionId)?.label}
                </span>
                {myWager.amount ? ` · ${myWager.amount} créditos` : ''}
              </p>
              <button className="btn btn-ghost w-full text-sm" onClick={startEditing}>
                <Pencil size={14} /> Cambiar apuesta
              </button>
            </>
          )}

          {showForm && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {bet.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelected(o.id)}
                    className={`rounded-xl border p-3 text-sm transition active:scale-[0.98] ${
                      selected === o.id
                        ? 'border-zinc-200 bg-zinc-200 font-medium text-zinc-900'
                        : 'border-zinc-700/70 bg-zinc-800/50 text-zinc-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="label" htmlFor="wager-amount">
                  Créditos <span className="normal-case tracking-normal text-zinc-600">(opcional)</span>
                </label>
                <input
                  id="wager-amount"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Tu saldo: {currentUser.coins ?? 1000} créditos
                  {Number(amount) > (currentUser.coins ?? 1000) + (myWager?.amount ?? 0) && (
                    <span className="text-red-400"> · Saldo insuficiente</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" onClick={handleWager} disabled={!selected || Number(amount) > (currentUser.coins ?? 1000) + (myWager?.amount ?? 0)}>
                  {editing ? 'Guardar cambio' : 'Apostar'}
                </button>
                {editing && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditing(false);
                      setSelected(null);
                      setAmount('');
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {isAdmin && bet.status === 'open' && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-zinc-200">Resolver (creador)</h3>
          <div className="grid grid-cols-2 gap-2">
            {bet.options.map((o) => (
              <button key={o.id} className="btn btn-secondary text-sm" onClick={() => resolveBet(bet.id, o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <button className="btn btn-danger w-full" onClick={() => cancelBet(bet.id)}>
            Cancelar apuesta
          </button>
        </div>
      )}

      {bet.status === 'resolved' && (
        <div className="card py-6 text-center">
          <CheckCircle2 size={26} className="mx-auto text-pos" />
          <p className="mt-2 text-zinc-300">
            Ganadora:{' '}
            <span className="font-semibold text-zinc-100">
              {bet.options.find((o) => o.id === bet.winningOptionId)?.label}
            </span>
          </p>
          {totalCredits > 0 && (
            <p className="mt-1 text-xs text-zinc-500">
              Bote repartido: {totalCredits} créditos
            </p>
          )}
        </div>
      )}

      {bet.status === 'cancelled' && (
        <div className="card py-6 text-center">
          <XCircle size={26} className="mx-auto text-zinc-500" />
          <p className="mt-2 text-zinc-400">Apuesta cancelada</p>
        </div>
      )}

      {isAdmin && (
        <button
          className="btn btn-danger w-full"
          onClick={() => {
            if (confirm('¿Eliminar la apuesta?')) {
              deleteBet(bet.id);
              nav(`/groups/${bet.groupId}/bets`);
            }
          }}
        >
          <Trash2 size={16} /> Eliminar apuesta
        </button>
      )}
    </div>
  );
}
