import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, UserPlus, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import { formatDate } from '../utils';

export default function GroupDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const users = useStore((s) => s.users);
  const plans = useStore((s) => s.plans.filter((p) => p.groupId === id));
  const bets = useStore((s) => s.bets.filter((b) => b.groupId === id));
  const createPlan = useStore((s) => s.createPlan);
  const deleteGroup = useStore((s) => s.deleteGroup);
  const addMember = useStore((s) => s.addMember);
  const removeMember = useStore((s) => s.removeMember);
  const currentUser = useStore((s) => s.currentUser)!;

  const [tab, setTab] = useState<'plans' | 'bets' | 'members'>('plans');
  const [planOpen, setPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);

  if (!group) return <div className="text-zinc-400">Grupo no encontrado</div>;

  const memberUsers = group.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean) as any[];
  const nonMembers = users.filter((u) => !group.members.some((m) => m.userId === u.id));

  const handleCreatePlan = () => {
    if (!planTitle.trim()) return;
    const p = createPlan(group.id, planTitle.trim(), planDesc.trim() || undefined, planDate ? new Date(planDate).getTime() : undefined);
    setPlanOpen(false); setPlanTitle(''); setPlanDesc(''); setPlanDate('');
    nav(`/plans/${p.id}`);
  };

  const handleDeleteGroup = () => {
    if (confirm('¿Eliminar grupo y todo su contenido?')) {
      deleteGroup(group.id);
      nav('/');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">{group.name}</h2>
          {group.description && <p className="text-sm text-zinc-400">{group.description}</p>}
        </div>
        {group.ownerId === currentUser.id && (
          <button onClick={handleDeleteGroup} className="text-zinc-500 hover:text-red-400"><Trash2 size={18} /></button>
        )}
      </div>

      <div className="flex gap-2 border-b border-zinc-800">
        {(['plans', 'bets', 'members'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm border-b-2 ${tab === t ? 'border-zinc-200 text-zinc-100' : 'border-transparent text-zinc-500'}`}>
            {t === 'plans' ? 'Planes' : t === 'bets' ? 'Apuestas' : 'Miembros'}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="space-y-3">
          <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => setPlanOpen(true)}>
            <Plus size={16} /> Nuevo plan
          </button>
          {plans.length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Sin planes aún</p>}
          {plans.map((p) => (
            <button key={p.id} onClick={() => nav(`/plans/${p.id}`)} className="card w-full text-left hover:bg-zinc-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-100">{p.title}</h3>
                  {p.description && <p className="text-sm text-zinc-400">{p.description}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                    {p.date && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(p.date)}</span>}
                    <span>{p.tasks.length} tareas</span>
                    <span>{p.expenses.length} gastos</span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-zinc-500" />
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'bets' && (
        <div className="space-y-3">
          <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => nav(`/groups/${group.id}/bets?new=1`)}>
            <Plus size={16} /> Nueva apuesta
          </button>
          {bets.length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Sin apuestas aún</p>}
          {bets.map((b) => {
            const target = users.find((u) => u.id === b.targetUserId);
            const hidden = b.targetUserId === currentUser.id;
            if (hidden) return null; // target cannot see the bet
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
                  <ArrowRight size={18} className="text-zinc-500" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-3">
          <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => setMemberOpen(true)}>
            <UserPlus size={16} /> Añadir miembro
          </button>
          {memberUsers.map((u: any) => {
            const m = group.members.find((x) => x.userId === u.id)!;
            return (
              <div key={u.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-200 font-semibold">{u.name[0].toUpperCase()}</div>
                  <div>
                    <p className="text-zinc-100 font-medium">{u.name} {u.id === currentUser.id && <span className="text-xs text-zinc-500">(tú)</span>}</p>
                    <p className="text-xs text-zinc-500">{m.role === 'admin' ? 'Admin' : 'Miembro'}</p>
                  </div>
                </div>
                {group.ownerId === currentUser.id && u.id !== currentUser.id && (
                  <button onClick={() => removeMember(group.id, u.id)} className="text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Nuevo plan">
        <div className="space-y-3">
          <div><label className="label">Título</label><input className="input" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} /></div>
          <div><label className="label">Descripción</label><input className="input" value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} /></div>
          <div><label className="label">Fecha del plan</label><input type="date" className="input" value={planDate} onChange={(e) => setPlanDate(e.target.value)} /></div>
          <button className="btn btn-primary w-full" onClick={handleCreatePlan}>Crear</button>
        </div>
      </Modal>

      <Modal open={memberOpen} onClose={() => setMemberOpen(false)} title="Añadir miembro">
        <div className="space-y-2">
          {nonMembers.length === 0 && <p className="text-zinc-500 text-sm">No hay otros perfiles en este dispositivo. Crea perfiles en la pantalla de inicio.</p>}
          {nonMembers.map((u) => (
            <button key={u.id} onClick={() => { addMember(group.id, u.id); }} className="w-full card flex items-center gap-3 hover:bg-zinc-800">
              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-200 font-semibold">{u.name[0].toUpperCase()}</div>
              <span className="text-zinc-100">{u.name}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}