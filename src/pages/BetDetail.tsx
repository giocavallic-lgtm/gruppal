import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../store';
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

  if (!bet) return <div className="text-zinc-400">Apuesta no encontrada</div>;
  // target cannot see
  if (bet.targetUserId === currentUser.id) {
    return (
      <div className="card text-center py-10">
        <p className="text-zinc-400">Esta apuesta es sobre ti y es secreta.</p>
        <button className="btn btn-secondary mt-4" onClick={() => nav(-1)}>Volver</button>
      </div>
    );
  }

  const target = users.find((u) => u.id === bet.targetUserId);
  const creator = users.find((u) => u.id === bet.createdBy);
  const isAdmin = bet.createdBy === currentUser.id; // simple: creator resolves

  const handleWager = () => {
    if (!selected) return;
    addWager(bet.id, currentUser.id, selected, amount ? Number(amount) : undefined);
    setSelected(null); setAmount('');
  };

  const myWager = bet.wagers.find((w) => w.userId === currentUser.id);

  // tally
  const tally: Record<string, number> = {};
  for (const o of bet.options) tally[o.id] = 0;
  for (const w of bet.wagers) tally[w.optionId] = (tally[w.optionId] ?? 0) + 1;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-zinc-100">{bet.title}</h2>
        <p className="text-sm text-zinc-400">Sobre: {target?.name ?? '?'} · Creada por {creator?.name}</p>
        {bet.description && <p className="text-zinc-300 mt-2">{bet.description}</p>}
        <p className="text-xs text-zinc-500 mt-1">{formatDate(bet.createdAt)}</p>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-zinc-200">Opciones</h3>
        {bet.options.map((o) => {
          const isWinner = bet.winningOptionId === o.id;
          const count = tally[o.id] ?? 0;
          return (
            <div key={o.id} className={`flex items-center justify-between p-3 rounded-lg border ${isWinner ? 'border-green-700 bg-green-900/20' : 'border-zinc-800 bg-zinc-800/40'}`}>
              <div className="flex items-center gap-2">
                {isWinner && <CheckCircle2 size={16} className="text-green-400" />}
                <span className="text-zinc-100">{o.label}</span>
              </div>
              <span className="text-sm text-zinc-400">{count} voto{count !== 1 ? 's' : ''}</span>
            </div>
          );
        })}
      </div>

      {bet.status === 'open' && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-zinc-200">Tu apuesta</h3>
          {myWager ? (
            <p className="text-zinc-400 text-sm">Ya apostaste: <span className="text-zinc-100">{bet.options.find((o) => o.id === myWager.optionId)?.label}</span>{myWager.amount ? ` (${myWager.amount}€)` : ''}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {bet.options.map((o) => (
                  <button key={o.id} onClick={() => setSelected(o.id)} className={`p-2 rounded-lg border text-sm ${selected === o.id ? 'border-zinc-200 bg-zinc-700 text-zinc-100' : 'border-zinc-800 bg-zinc-800/40 text-zinc-300'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <input className="input" type="number" placeholder="Cantidad (opcional)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <button className="btn btn-primary w-full" onClick={handleWager} disabled={!selected}>Apostar</button>
            </>
          )}
        </div>
      )}

      {isAdmin && bet.status === 'open' && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-zinc-200">Resolver (creador)</h3>
          <div className="grid grid-cols-2 gap-2">
            {bet.options.map((o) => (
              <button key={o.id} onClick={() => resolveBet(bet.id, o.id)} className="btn btn-secondary text-sm">{o.label}</button>
            ))}
          </div>
          <button className="btn btn-danger w-full" onClick={() => cancelBet(bet.id)}>Cancelar apuesta</button>
        </div>
      )}

      {bet.status === 'resolved' && (
        <div className="card text-center">
          <CheckCircle2 size={24} className="mx-auto text-green-400" />
          <p className="text-zinc-200 mt-2">Ganadora: <span className="font-semibold">{bet.options.find((o) => o.id === bet.winningOptionId)?.label}</span></p>
        </div>
      )}

      {bet.status === 'cancelled' && (
        <div className="card text-center">
          <XCircle size={24} className="mx-auto text-zinc-500" />
          <p className="text-zinc-400 mt-2">Apuesta cancelada</p>
        </div>
      )}

      {isAdmin && (
        <button className="btn btn-danger w-full" onClick={() => { deleteBet(bet.id); nav(-1); }}>Eliminar</button>
      )}
    </div>
  );
}