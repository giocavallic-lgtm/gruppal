import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Receipt, Calendar, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { formatDate, formatMoney, computeBalances, simplifyDebts } from '../utils';

export default function PlanDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const group = useStore((s) => (plan ? s.groups.find((g) => g.id === plan.groupId) : undefined));
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
    setTaskOpen(false);
    setTaskTitle('');
    setTaskAssignee('');
    setTaskDue('');
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
    setExpOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpSplit([]);
  };

  const toggleSplit = (uid: string) => {
    setExpSplit((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const bal = computeBalances(plan);
  const debts = simplifyDebts(bal);
  const total = plan.expenses.reduce((sum, e) => sum + e.amount, 0);
  const done = plan.tasks.filter((t) => t.status === 'done').length;
  const pct = plan.tasks.length ? Math.round((done / plan.tasks.length) * 100) : 0;

  const statusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle2 size={19} className="text-pos" />;
    if (s === 'doing') return <Clock size={19} className="text-warn" />;
    return <Circle size={19} className="text-zinc-500" />;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={plan.title}
        backTo={`/groups/${group.id}`}
        subtitle={
          <div className="space-y-1">
            {plan.description && <p>{plan.description}</p>}
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              {plan.date && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(plan.date)}
                </span>
              )}
              <span>
                {done}/{plan.tasks.length} tareas
              </span>
            </div>
          </div>
        }
        action={
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Eliminar plan?')) {
                const isOwner = currentUser?.id === group?.ownerId;
                const isAdmin = group?.members?.some((m) => m.userId === currentUser?.id && m.role === 'admin');
                if (!isOwner && !isAdmin) {
                  alert('Solo el creador del grupo o un administrador pueden eliminar planes.');
                  return;
                }
                deletePlan(plan.id);
                nav(`/groups/${group.id}`);
              }
            }}
            aria-label="Eliminar plan"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        }
      />

      {plan.tasks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="progress flex-1">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-zinc-500">{pct}%</span>
        </div>
      )}

      <div className="seg" role="tablist" aria-label="Secciones del plan">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tasks'}
          onClick={() => setTab('tasks')}
          className={tab === 'tasks' ? 'active' : ''}
        >
          Tareas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'expenses'}
          onClick={() => setTab('expenses')}
          className={tab === 'expenses' ? 'active' : ''}
        >
          Gastos
        </button>
      </div>

      {tab === 'tasks' && (
        <div className="space-y-3">
          <button className="btn btn-secondary w-full" onClick={() => setTaskOpen(true)}>
            <Plus size={16} /> Nueva tarea
          </button>

          {plan.tasks.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Sin tareas. Añade la primera.</p>
          )}

          {plan.tasks.map((t) => {
            const assignee = users.find((u) => u.id === t.assigneeId);
            return (
              <div key={t.id} className="card flex items-center gap-3 py-3.5">
                <button
                  type="button"
                  onClick={() => toggleStatus(t.id, t.status)}
                  aria-label="Cambiar estado de la tarea"
                  className="shrink-0 transition active:scale-90"
                >
                  {statusIcon(t.status)}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-zinc-100 ${
                      t.status === 'done' ? 'text-zinc-500 line-through' : ''
                    }`}
                  >
                    {t.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {assignee && <span>→ {assignee.name}</span>}
                    {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                    <span className="text-zinc-600">
                      {t.status === 'todo' ? 'Por hacer' : t.status === 'doing' ? 'En curso' : 'Hecho'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask(plan.id, t.id)}
                  aria-label="Eliminar tarea"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <button className="btn btn-secondary w-full" onClick={() => setExpOpen(true)}>
            <Plus size={16} /> Nuevo gasto
          </button>

          {plan.expenses.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">Sin gastos. Registra el primero.</p>
          )}

          {plan.expenses.length > 0 && (
            <div className="card flex items-center justify-between py-3">
              <span className="text-sm text-zinc-400">Total gastado</span>
              <span className="text-lg font-semibold text-zinc-100">{formatMoney(total)}</span>
            </div>
          )}

          <div className="space-y-2">
            {plan.expenses.map((e) => {
              const payer = users.find((u) => u.id === e.paidById);
              return (
                <div key={e.id} className="card flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">{e.title}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {payer?.name} pagó · dividido entre {e.splitAmong.length}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold tabular-nums text-zinc-200">{formatMoney(e.amount)}</span>
                    <button
                      type="button"
                      onClick={() => deleteExpense(plan.id, e.id)}
                      aria-label="Eliminar gasto"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {plan.expenses.length > 0 && (
            <div className="card space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-zinc-200">
                <Receipt size={16} /> Balances
              </h3>
              <div className="space-y-1.5">
                {memberUsers.map((u: any) => {
                  const b = bal[u.id] ?? 0;
                  return (
                    <div key={u.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{u.name}</span>
                      <span
                        className={`font-medium tabular-nums ${
                          b > 0.005 ? 'text-pos' : b < -0.005 ? 'text-neg' : 'text-zinc-500'
                        }`}
                      >
                        {b > 0 ? '+' : ''}
                        {formatMoney(b)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {debts.length > 0 && (
                <div className="space-y-2 border-t border-zinc-800/70 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Liquidación sugerida
                  </p>
                  {debts.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800/40 px-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-neg">{users.find((u) => u.id === d.from)?.name}</span>
                        <ArrowRight size={12} className="shrink-0 text-zinc-600" />
                        <span className="truncate text-pos">{users.find((u) => u.id === d.to)?.name}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-zinc-200">
                        {formatMoney(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Nueva tarea">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="task-title">
              Título
            </label>
            <input
              id="task-title"
              className="input"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Comprar bebidas"
              maxLength={80}
            />
          </div>
          <div>
            <label className="label" htmlFor="task-assignee">
              Asignar a
            </label>
            <select
              id="task-assignee"
              className="input"
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {memberUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-due">
              Fecha límite
            </label>
            <input
              id="task-due"
              type="date"
              className="input"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
            />
          </div>
          <button className="btn btn-primary w-full py-3" onClick={handleAddTask} disabled={!taskTitle.trim()}>
            Crear tarea
          </button>
        </div>
      </Modal>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Nuevo gasto">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="exp-title">
              Concepto
            </label>
            <input
              id="exp-title"
              className="input"
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="Cena, taxi, entradas…"
              maxLength={80}
            />
          </div>
          <div>
            <label className="label" htmlFor="exp-amount">
              Importe (€)
            </label>
            <input
              id="exp-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="input"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="label" htmlFor="exp-paid-by">
              Pagado por
            </label>
            <select
              id="exp-paid-by"
              className="input"
              value={expPaidBy}
              onChange={(e) => setExpPaidBy(e.target.value)}
            >
              {memberUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              Dividir entre <span className="normal-case tracking-normal text-zinc-600">(vacío = todos)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {memberUsers.map((u: any) => {
                const active = expSplit.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleSplit(u.id)}
                    aria-pressed={active}
                    className={`rounded-xl border px-3 py-1.5 text-sm transition active:scale-95 ${
                      active
                        ? 'border-zinc-200 bg-zinc-200 font-medium text-zinc-900'
                        : 'border-zinc-700/70 bg-zinc-800/70 text-zinc-300'
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            className="btn btn-primary w-full py-3"
            onClick={handleAddExpense}
            disabled={!expTitle.trim() || !expAmount}
          >
            Añadir gasto
          </button>
        </div>
      </Modal>
    </div>
  );
}
