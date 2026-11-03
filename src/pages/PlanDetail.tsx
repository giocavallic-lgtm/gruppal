import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Receipt, Calendar } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import { formatDate, formatMoney, computeBalances, simplifyDebts } from '../utils';

export default function PlanDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const group = useStore((s) => plan ? s.groups.find((g) => g.id === plan.groupId) : undefined);
  const users = useStore((s) => s.users);
  const deletePlan = useStore((s) => s.deletePlan);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const currentUser = useStore((s) => s.currentUser)!;

  const [tab, setTab] = useState<'tasks' | 'expenses'>('tasks');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [expOpen, setExpOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState(currentUser.id);
  const [expSplit, setExpSplit] = useState<string[]>([]);

  if (!plan || !group) return <div className="text-zinc-400">Plan no encontrado</div>;

  const memberUsers = group.members.map((m) => users.find((u) => u.id === m.userId)).filter(Boolean) as any[];

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    addTask(plan.id, taskTitle.trim(), taskAssignee || undefined, taskDue ? new Date(taskDue).getTime() : undefined);
    setTaskOpen(false); setTaskTitle(''); setTaskAssignee(''); setTaskDue('');
  };

  const toggleStatus = (taskId: string, cur: string) => {
    const next = cur === 'done' ? 'todo' : cur === 'todo' ? 'doing' : 'done';
    updateTask(plan.id, taskId, { status: next as any });
  };

  const handleAddExpense = () => {
    if (!expTitle.trim() || !expAmount) return;
    const split = expSplit.length ? expSplit : memberUsers.map((u: any) => u.id);
    addExpense(plan.id, {
      title: expTitle.trim(),
      amount: Number(expAmount),
      paidById: expPaidBy,
      splitAmong: split,
    });
    setExpOpen(false); setExpTitle(''); setExpAmount(''); setExpSplit([]);
  };

  const toggleSplit = (uid: string) => {
    setExpSplit((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const bal = computeBalances(plan);
  const debts = simplifyDebts(bal);

  const statusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle2 size={18} className="text-green-400" />;
    if (s === 'doing') return <Clock size={18} className="text-amber-400" />;
    return <Circle size={18} className="text-zinc-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">{plan.title}</h2>
          {plan.description && <p className="text-sm text-zinc-400">{plan.description}</p>}
          <div className="flex gap-3 mt-2 text-xs text-zinc-500">
            {plan.date && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(plan.date)}</span>}
            <span>{plan.tasks.filter((t) => t.status === 'done').length}/{plan.tasks.length} tareas</span>
          </div>
        </div>
        <button onClick={() => { if (confirm('¿Eliminar plan?')) { deletePlan(plan.id); nav(-1); } }} className="text-zinc-500 hover:text-red-400"><Trash2 size={18} /></button>
      </div>

      <div className="flex gap-2 border-b border-zinc-800">
        <button onClick={() => setTab('tasks')} className={`px-3 py-2 text-sm border-b-2 ${tab === 'tasks' ? 'border-zinc-200 text-zinc-100' : 'border-transparent text-zinc-500'}`}>Tareas</button>
        <button onClick={() => setTab('expenses')} className={`px-3 py-2 text-sm border-b-2 ${tab === 'expenses' ? 'border-zinc-200 text-zinc-100' : 'border-transparent text-zinc-500'}`}>Gastos</button>
      </div>

      {tab === 'tasks' && (
        <div className="space-y-3">
          <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => setTaskOpen(true)}>
            <Plus size={16} /> Nueva tarea
          </button>
          {plan.tasks.length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Sin tareas</p>}
          {plan.tasks.map((t) => {
            const assignee = users.find((u) => u.id === t.assigneeId);
            return (
              <div key={t.id} className="card flex items-center gap-3">
                <button onClick={() => toggleStatus(t.id, t.status)}>{statusIcon(t.status)}</button>
                <div className="flex-1 min-w-0">
                  <p className={`text-zinc-100 ${t.status === 'done' ? 'line-through text-zinc-500' : ''}`}>{t.title}</p>
                  <div className="flex gap-2 text-xs text-zinc-500 mt-1">
                    {assignee && <span>→ {assignee.name}</span>}
                    {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(plan.id, t.id)} className="text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <button className="btn btn-secondary w-full flex items-center justify-center gap-2" onClick={() => setExpOpen(true)}>
            <Plus size={16} /> Nuevo gasto
          </button>

          {plan.expenses.length === 0 && <p className="text-zinc-500 text-sm text-center py-6">Sin gastos</p>}

          <div className="space-y-2">
            {plan.expenses.map((e) => {
              const payer = users.find((u) => u.id === e.paidById);
              return (
                <div key={e.id} className="card flex items-center justify-between">
                  <div>
                    <p className="text-zinc-100 font-medium">{e.title}</p>
                    <p className="text-xs text-zinc-500">{payer?.name} pagó · dividido entre {e.splitAmong.length}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-200 font-semibold">{formatMoney(e.amount)}</span>
                    <button onClick={() => deleteExpense(plan.id, e.id)} className="text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {plan.expenses.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-zinc-200 flex items-center gap-2"><Receipt size={16} /> Balances</h3>
              <div className="space-y-1">
                {memberUsers.map((u: any) => {
                  const b = bal[u.id] ?? 0;
                  return (
                    <div key={u.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{u.name}</span>
                      <span className={b > 0.005 ? 'text-green-400' : b < -0.005 ? 'text-red-400' : 'text-zinc-500'}>
                        {b > 0 ? '+' : ''}{formatMoney(b)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {debts.length > 0 && (
                <div className="border-t border-zinc-800 pt-3 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Liquidación sugerida</p>
                  {debts.map((d, i) => (
                    <p key={i} className="text-sm text-zinc-300">
                      <span className="text-red-400">{users.find((u) => u.id === d.from)?.name}</span> → <span className="text-green-400">{users.find((u) => u.id === d.to)?.name}</span>: {formatMoney(d.amount)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Nueva tarea">
        <div className="space-y-3">
          <div><label className="label">Título</label><input className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} /></div>
          <div>
            <label className="label">Asignar a</label>
            <select className="input" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
              <option value="">Sin asignar</option>
              {memberUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div><label className="label">Fecha límite</label><input type="date" className="input" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></div>
          <button className="btn btn-primary w-full" onClick={handleAddTask}>Crear</button>
        </div>
      </Modal>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Nuevo gasto">
        <div className="space-y-3">
          <div><label className="label">Concepto</label><input className="input" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} /></div>
          <div><label className="label">Importe (€)</label><input type="number" className="input" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} /></div>
          <div>
            <label className="label">Pagado por</label>
            <select className="input" value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)}>
              {memberUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Dividir entre (vacío = todos)</label>
            <div className="flex flex-wrap gap-2">
              {memberUsers.map((u: any) => (
                <button key={u.id} type="button" onClick={() => toggleSplit(u.id)} className={`px-3 py-1 rounded-lg text-sm border ${expSplit.includes(u.id) ? 'bg-zinc-200 text-zinc-900 border-zinc-200' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary w-full" onClick={handleAddExpense}>Añadir</button>
        </div>
      </Modal>
    </div>
  );
}