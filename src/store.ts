import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, User, Group, Plan, Task, Expense, Bet } from './types';

// polyfill uuid if not installed -> use crypto
function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Actions {
  // user
  setCurrentUser: (u: User | null) => void;
  createUser: (name: string) => User;
  updateUser: (id: string, patch: Partial<User>) => void;

  // groups
  createGroup: (name: string, description?: string) => Group;
  updateGroup: (id: string, patch: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addMember: (groupId: string, userId: string) => void;
  removeMember: (groupId: string, userId: string) => void;

  // plans
  createPlan: (groupId: string, title: string, description?: string, date?: number) => Plan;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  addTask: (planId: string, title: string, assigneeId?: string, dueDate?: number) => Task;
  updateTask: (planId: string, taskId: string, patch: Partial<Task>) => void;
  deleteTask: (planId: string, taskId: string) => void;
  addExpense: (planId: string, e: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (planId: string, expenseId: string, patch: Partial<Expense>) => void;
  deleteExpense: (planId: string, expenseId: string) => void;

  // bets
  createBet: (groupId: string, title: string, targetUserId: string, options: string[], description?: string) => Bet;
  addWager: (betId: string, userId: string, optionId: string, amount?: number) => void;
  resolveBet: (betId: string, winningOptionId: string) => void;
  cancelBet: (betId: string) => void;
  deleteBet: (betId: string) => void;
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      groups: [],
      plans: [],
      bets: [],

      setCurrentUser: (u) => set({ currentUser: u }),

      createUser: (name) => {
        const u: User = { id: uid(), name, createdAt: Date.now() };
        set((s) => ({ users: [...s.users, u] }));
        return u;
      },

      updateUser: (id, patch) =>
        set((s) => {
          const users = s.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
          const currentUser = s.currentUser && s.currentUser.id === id ? { ...s.currentUser, ...patch } : s.currentUser;
          return { users, currentUser };
        }),

      createGroup: (name, description) => {
        const cu = get().currentUser;
        if (!cu) throw new Error('No user');
        const g: Group = {
          id: uid(),
          name,
          description,
          ownerId: cu.id,
          members: [{ userId: cu.id, role: 'admin', joinedAt: Date.now() }],
          createdAt: Date.now(),
        };
        set((s) => ({ groups: [...s.groups, g] }));
        return g;
      },

      updateGroup: (id, patch) =>
        set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      deleteGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          plans: s.plans.filter((p) => p.groupId !== id),
          bets: s.bets.filter((b) => b.groupId !== id),
        })),

      addMember: (groupId, userId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId && !g.members.some((m) => m.userId === userId)
              ? { ...g, members: [...g.members, { userId, role: 'member', joinedAt: Date.now() }] }
              : g
          ),
        })),

      removeMember: (groupId, userId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId ? { ...g, members: g.members.filter((m) => m.userId !== userId) } : g
          ),
        })),

      createPlan: (groupId, title, description, date) => {
        const cu = get().currentUser;
        const p: Plan = {
          id: uid(),
          groupId,
          title,
          description,
          date,
          tasks: [],
          expenses: [],
          createdAt: Date.now(),
          createdBy: cu?.id ?? '',
        };
        set((s) => ({ plans: [...s.plans, p] }));
        return p;
      },

      updatePlan: (id, patch) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      addTask: (planId, title, assigneeId, dueDate) => {
        const t: Task = { id: uid(), title, assigneeId, status: 'todo', dueDate };
        set((s) => ({
          plans: s.plans.map((p) => (p.id === planId ? { ...p, tasks: [...p.tasks, t] } : p)),
        }));
        return t;
      },

      updateTask: (planId, taskId, patch) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
              : p
          ),
        })),

      deleteTask: (planId, taskId) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
          ),
        })),

      addExpense: (planId, e) => {
        const ex: Expense = { ...e, id: uid(), createdAt: Date.now() };
        set((s) => ({
          plans: s.plans.map((p) => (p.id === planId ? { ...p, expenses: [...p.expenses, ex] } : p)),
        }));
        return ex;
      },

      updateExpense: (planId, expenseId, patch) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? { ...p, expenses: p.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) }
              : p
          ),
        })),

      deleteExpense: (planId, expenseId) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId ? { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) } : p
          ),
        })),

      createBet: (groupId, title, targetUserId, options, description) => {
        const cu = get().currentUser;
        const bet: Bet = {
          id: uid(),
          groupId,
          title,
          description,
          targetUserId,
          options: options.map((o) => ({ id: uid(), label: o })),
          wagers: [],
          status: 'open',
          createdAt: Date.now(),
          createdBy: cu?.id ?? '',
        };
        set((s) => ({ bets: [...s.bets, bet] }));
        return bet;
      },

      addWager: (betId, userId, optionId, amount) =>
        set((s) => ({
          bets: s.bets.map((b) =>
            b.id === betId
              ? {
                  ...b,
                  wagers: [...b.wagers.filter((w) => w.userId !== userId), { userId, optionId, amount, createdAt: Date.now() }],
                }
              : b
          ),
        })),

      resolveBet: (betId, winningOptionId) =>
        set((s) => ({
          bets: s.bets.map((b) =>
            b.id === betId ? { ...b, status: 'resolved', winningOptionId, resolvedAt: Date.now() } : b
          ),
        })),

      cancelBet: (betId) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, status: 'cancelled' } : b)),
        })),

      deleteBet: (betId) => set((s) => ({ bets: s.bets.filter((b) => b.id !== betId) })),
    }),
    { name: 'gruppal-store' }
  )
);

export { uid };