import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './lib/supabase';
import { hasSupabase } from './config';
import type { AppState, User, Group, GroupMember, Plan, Task, Expense, Bet, BetOption, BetWager, Message, Championship, ChampionshipEvent, ScoringType, Theme } from './types';
import { pointsForPosition } from './utils';

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------- mapping helpers (DB row -> app type) ----------
function rowToUser(r: any): User {
  return { id: r.id, name: r.name, avatar: r.avatar, coins: r.coins ?? 1000, createdAt: new Date(r.created_at).getTime() };
}
function rowToGroup(r: any, members: GroupMember[]): Group {
  return { id: r.id, name: r.name, description: r.description ?? undefined, ownerId: r.owner_id, members, inviteCode: r.invite_code, createdAt: new Date(r.created_at).getTime() };
}
function rowToTask(r: any): Task {
  return { id: r.id, title: r.title, assigneeId: r.assignee_id ?? undefined, status: r.status, dueDate: r.due_date ?? undefined, notes: r.notes ?? undefined };
}
function rowToExpense(r: any): Expense {
  return { id: r.id, title: r.title, amount: Number(r.amount), paidById: r.paid_by, splitAmong: r.split_among ?? [], createdAt: new Date(r.created_at).getTime() };
}
function rowToPlan(r: any, tasks: Task[], expenses: Expense[]): Plan {
  return { id: r.id, groupId: r.group_id, title: r.title, description: r.description ?? undefined, date: r.date ?? undefined, tasks, expenses, createdAt: new Date(r.created_at).getTime(), createdBy: r.created_by ?? '' };
}
function rowToBet(r: any, options: BetOption[], wagers: BetWager[]): Bet {
  return { id: r.id, groupId: r.group_id, title: r.title, description: r.description ?? undefined, targetUserId: r.target_user_id, options, wagers, status: r.status, winningOptionId: r.winning_option_id ?? undefined, createdAt: new Date(r.created_at).getTime(), createdBy: r.created_by ?? '', resolvedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : undefined };
}
function rowToMessage(r: any): Message {
  return { id: r.id, groupId: r.group_id, userId: r.user_id, body: r.body, replyToId: r.reply_to_id ?? undefined, createdAt: new Date(r.created_at).getTime() };
}
function rowToChampionship(r: any, events: ChampionshipEvent[]): Championship {
  return {
    id: r.id,
    groupId: r.group_id,
    name: r.name,
    description: r.description ?? undefined,
    scoringType: r.scoring_type === 'times' ? 'times' : 'points',
    pointsSystem: Array.isArray(r.points_system) ? r.points_system.map(Number) : [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    createdAt: new Date(r.created_at).getTime(),
    createdBy: r.created_by ?? '',
    events,
  };
}

interface Actions {
  // auth
  session: any;
  authLoading: boolean;
  mode: 'local' | 'cloud';
  initAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;

  // preferences
  theme: Theme;
  reduceMotion: boolean;
  setTheme: (theme: Theme) => void;
  setReduceMotion: (reduceMotion: boolean) => void;

  // user (local mode)
  setCurrentUser: (u: User | null) => void;
  createUser: (name: string) => User;
  updateUser: (id: string, patch: Partial<User>) => void;

  // data
  loadAll: () => Promise<void>;

  // groups
  createGroup: (name: string, description?: string) => Group;
  updateGroup: (id: string, patch: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addMember: (groupId: string, userId: string) => void;
  removeMember: (groupId: string, userId: string) => void;
  joinGroupByCode: (code: string) => Promise<string>;

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

  // chat
  sendMessage: (groupId: string, body: string, replyToId?: string) => Message | undefined;
  deleteMessage: (id: string) => void;

  // championships
  createChampionship: (groupId: string, name: string, description: string | undefined, scoringType: ScoringType, pointsSystem: number[]) => Championship;
  deleteChampionship: (id: string) => void;
  addChampionshipEvent: (championshipId: string, name: string, date?: number) => ChampionshipEvent;
  deleteChampionshipEvent: (championshipId: string, eventId: string) => void;
  setEventResults: (championshipId: string, eventId: string, entries: { userId: string; position?: number; timeMs?: number }[]) => void;
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set, get) => {
      const cloud = hasSupabase;

      function awardCoins(userId: string, amount: number) {
        if (!userId || !amount) return;
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, coins: (u.coins ?? 1000) + amount } : u
          ),
          currentUser:
            s.currentUser?.id === userId
              ? { ...s.currentUser, coins: (s.currentUser.coins ?? 1000) + amount }
              : s.currentUser,
        }));
        if (cloud && supabase) {
          supabase.rpc('add_coins', { p_user_id: userId, p_amount: amount }).then(({ error }) => {
            if (error) console.error('add_coins', error);
          });
        }
      }

      // ---------- cloud: load all data for current user ----------
      async function loadAll() {
        if (!cloud || !supabase) return;
        const session = get().session;
        const userId = session?.user?.id;
        if (!userId) return;

        // profile
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const user: User = prof ? rowToUser(prof) : { id: userId, name: session.user.email?.split('@')[0] ?? 'User', createdAt: Date.now() };

        // groups where member
        const { data: gms } = await supabase.from('group_members').select('group_id, role, joined_at').eq('user_id', userId);
        const groupIds = (gms ?? []).map((g: any) => g.group_id);
        let groups: Group[] = [];
        if (groupIds.length) {
          const { data: grs } = await supabase.from('groups').select('*').in('id', groupIds);
          // members per group
          const { data: allGm } = await supabase.from('group_members').select('*').in('group_id', groupIds);
          groups = (grs ?? []).map((g: any) => {
            const ms = (allGm ?? []).filter((m: any) => m.group_id === g.id).map((m: any) => ({ userId: m.user_id, role: m.role, joinedAt: new Date(m.joined_at).getTime() }));
            return rowToGroup(g, ms);
          });
        }

        // plans for these groups
        let plans: Plan[] = [];
        if (groupIds.length) {
          const { data: pls } = await supabase.from('plans').select('*').in('group_id', groupIds);
          const planIds = (pls ?? []).map((p: any) => p.id);
          let tasksByPlan: Record<string, Task[]> = {};
          let expensesByPlan: Record<string, Expense[]> = {};
          if (planIds.length) {
            const { data: ts } = await supabase.from('tasks').select('*').in('plan_id', planIds);
            const { data: es } = await supabase.from('expenses').select('*').in('plan_id', planIds);
            for (const t of ts ?? []) { (tasksByPlan[t.plan_id] ??= []).push(rowToTask(t)); }
            for (const e of es ?? []) { (expensesByPlan[e.plan_id] ??= []).push(rowToExpense(e)); }
          }
          plans = (pls ?? []).map((p: any) => rowToPlan(p, tasksByPlan[p.id] ?? [], expensesByPlan[p.id] ?? []));
        }

        // bets for these groups
        let bets: Bet[] = [];
        if (groupIds.length) {
          const { data: bs } = await supabase.from('bets').select('*').in('group_id', groupIds);
          // filter target != me (RLS already does, but safe)
          const betIds = (bs ?? []).filter((b: any) => b.target_user_id !== userId).map((b: any) => b.id);
          let optionsByBet: Record<string, BetOption[]> = {};
          let wagersByBet: Record<string, BetWager[]> = {};
          if (betIds.length) {
            const { data: opts } = await supabase.from('bet_options').select('*').in('bet_id', betIds);
            const { data: wgs } = await supabase.from('bet_wagers').select('*').in('bet_id', betIds);
            for (const o of opts ?? []) { (optionsByBet[o.bet_id] ??= []).push({ id: o.id, label: o.label }); }
            for (const w of wgs ?? []) { (wagersByBet[w.bet_id] ??= []).push({ userId: w.user_id, optionId: w.option_id, amount: w.amount ?? undefined, createdAt: new Date(w.created_at).getTime() }); }
          }
          bets = (bs ?? []).filter((b: any) => b.target_user_id !== userId).map((b: any) => rowToBet(b, optionsByBet[b.id] ?? [], wagersByBet[b.id] ?? []));
        }

        // messages for these groups (latest 1000, then chronological)
        let messages: Message[] = [];
        if (groupIds.length) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('*')
            .in('group_id', groupIds)
            .order('created_at', { ascending: false })
            .limit(1000);
          messages = (msgs ?? []).map(rowToMessage).sort((a, b) => a.createdAt - b.createdAt);
        }

        // championships + events + results
        let championships: Championship[] = [];
        if (groupIds.length) {
          const { data: chs } = await supabase.from('championships').select('*').in('group_id', groupIds);
          const chIds = (chs ?? []).map((c: any) => c.id);
          let events: any[] = [];
          let results: any[] = [];
          if (chIds.length) {
            const { data: evs } = await supabase.from('championship_events').select('*').in('championship_id', chIds);
            events = evs ?? [];
            const evIds = events.map((e: any) => e.id);
            if (evIds.length) {
              const { data: rs } = await supabase.from('championship_results').select('*').in('event_id', evIds);
              results = rs ?? [];
            }
          }
          championships = (chs ?? []).map((c: any) =>
            rowToChampionship(
              c,
              events
                .filter((e: any) => e.championship_id === c.id)
                .map((e: any) => ({
                  id: e.id,
                  championshipId: e.championship_id,
                  name: e.name,
                  date: e.date ?? undefined,
                  createdAt: new Date(e.created_at).getTime(),
                  results: results
                    .filter((r: any) => r.event_id === e.id)
                    .map((r: any) => ({ userId: r.user_id, position: r.position, points: r.points, timeMs: r.time_ms ?? undefined })),
                }))
            )
          );
        }

        // users cache: collect all member ids
        const allUserIds = new Set<string>();
        groups.forEach((g) => g.members.forEach((m) => allUserIds.add(m.userId)));
        messages.forEach((m) => allUserIds.add(m.userId));
        championships.forEach((c) => {
          if (c.createdBy) allUserIds.add(c.createdBy);
          c.events.forEach((e) => e.results.forEach((r) => allUserIds.add(r.userId)));
        });
        plans.forEach((p) => { if (p.createdBy) allUserIds.add(p.createdBy); });
        bets.forEach((b) => { allUserIds.add(b.targetUserId); allUserIds.add(b.createdBy); b.wagers.forEach((w) => allUserIds.add(w.userId)); });
        let users: User[] = [user];
        if (allUserIds.size) {
          const { data: profs } = await supabase.from('profiles').select('*').in('id', Array.from(allUserIds));
          users = (profs ?? []).map(rowToUser);
          if (!users.find((u) => u.id === userId)) users.unshift(user);
        }

        set({ currentUser: user, users, groups, plans, bets, messages, championships, authLoading: false });
      }

      // ---------- realtime ----------
      let realtimeChannel: any = null;
      let messagesChannel: any = null;
      function subscribeRealtime() {
        if (!cloud || !supabase) return;
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        if (messagesChannel) supabase.removeChannel(messagesChannel);
        realtimeChannel = supabase
          .channel('crewzy-changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => { loadAll(); })
          .subscribe();
        messagesChannel = supabase
          .channel('crewzy-messages')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
            const row = payload?.new;
            if (!row || row.user_id === get().currentUser?.id) return;
            if (typeof document === 'undefined' || !document.hidden) return;
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
            const group = get().groups.find((g) => g.id === row.group_id);
            const sender = get().users.find((u) => u.id === row.user_id);
            const title = group ? group.name : 'Crewzy';
            const body = `${sender?.name ?? 'Alguien'}: ${String(row.body ?? '').slice(0, 100)}`;
            try {
              new Notification(title, { body, icon: './icon-192.png', tag: row.group_id });
            } catch (e) {
              console.error('notification', e);
            }
          })
          .subscribe();
      }

      // ---------- auth ----------
      async function initAuth() {
        if (!cloud || !supabase) { set({ authLoading: false, mode: 'local' }); return; }
        set({ authLoading: true, mode: 'cloud' });
        const { data } = await supabase.auth.getSession();
        set({ session: data.session });
        if (data.session) { await loadAll(); subscribeRealtime(); }
        else set({ authLoading: false });
        supabase.auth.onAuthStateChange(async (_e, sess) => {
          set({ session: sess });
          if (sess) { await loadAll(); subscribeRealtime(); }
          else set({ currentUser: null, users: [], groups: [], plans: [], bets: [], messages: [], championships: [], authLoading: false });
        });
      }

      async function signIn(email: string, password: string) {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      async function signUp(email: string, password: string, name: string) {
        if (!supabase) return;
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, accepted_terms: true } } });
        if (error) throw error;
      }
      async function signOut() {
        if (supabase) await supabase.auth.signOut();
        set({ session: null, currentUser: null, users: [], groups: [], plans: [], bets: [], messages: [], championships: [] });
      }

      async function joinGroupByCode(code: string): Promise<string> {
        if (!supabase) return '';
        const { data, error } = await supabase!.rpc('join_group_by_code', { code });
        if (error) throw error;
        await loadAll();
        return data as string;
      }

      return {
        currentUser: null,
        users: [],
        groups: [],
        plans: [],
        bets: [],
        messages: [],
        championships: [],
        session: null,
        authLoading: cloud,
        mode: cloud ? 'cloud' : 'local',
        theme: 'system',
        reduceMotion: false,

        initAuth,
        signIn,
        signUp,
        signOut,
        signOutEverywhere: async () => {
          if (supabase) await supabase.auth.signOut({ scope: 'global' });
          set({ session: null, currentUser: null, users: [], groups: [], plans: [], bets: [], messages: [], championships: [] });
        },
        updateEmail: async (email) => {
          if (!supabase) return;
          const { error } = await supabase.auth.updateUser({ email });
          if (error) throw error;
        },
        updatePassword: async (password) => {
          if (!supabase) return;
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
        },
        setTheme: (theme) => set({ theme }),
        setReduceMotion: (reduceMotion) => set({ reduceMotion }),

        loadAll,
        joinGroupByCode,

        setCurrentUser: (u) => set({ currentUser: u }),

        createUser: (name) => {
          if (cloud) {
            // cloud users come from auth; this shouldn't be called in cloud mode
            const u: User = { id: uid(), name, createdAt: Date.now() };
            set((s) => ({ users: [...s.users, u] }));
            return u;
          }
          const u: User = { id: uid(), name, createdAt: Date.now() };
          set((s) => ({ users: [...s.users, u] }));
          return u;
        },

        updateUser: (id, patch) =>
          set((s) => {
            const users = s.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
            const currentUser = s.currentUser && s.currentUser.id === id ? { ...s.currentUser, ...patch } : s.currentUser;
            if (cloud && supabase) {
              const row: any = {};
              if (patch.name !== undefined) row.name = patch.name;
              if (patch.avatar !== undefined) row.avatar = patch.avatar;
              if (Object.keys(row).length) supabase.from('profiles').update(row).eq('id', id).then(() => {});
            }
            return { users, currentUser };
          }),

        // ----- groups -----
        createGroup: (name, description) => {
          const cu = get().currentUser;
          if (cloud && supabase && cu) {
            const id = uid();
            const code = Math.random().toString(36).slice(2, 10);
          const g: Group = { id, name, description, ownerId: cu.id, members: [{ userId: cu.id, role: 'admin', joinedAt: Date.now() }], inviteCode: code, createdAt: Date.now() };
            // optimistic
            set((s) => ({ groups: [...s.groups, g] }));
            supabase.from('groups').insert({ id, name, description, owner_id: cu.id, invite_code: code }).then(({ error }) => {
              if (error) { console.error(error); set((s) => ({ groups: s.groups.filter((x) => x.id !== id) })); }
            });
            if (cu) awardCoins(cu.id, 10);
            return g;
          }
          const g: Group = { id: uid(), name, description, ownerId: (cu?.id ?? ''), members: cu ? [{ userId: cu.id, role: 'admin', joinedAt: Date.now() }] : [], inviteCode: Math.random().toString(36).slice(2, 10), createdAt: Date.now() };
          set((s) => ({ groups: [...s.groups, g] }));
          if (cu) awardCoins(cu.id, 10);
          return g;
        },

        updateGroup: (id, patch) => {
          set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
          if (cloud && supabase) {
            const row: any = {};
            if (patch.name !== undefined) row.name = patch.name;
            if (patch.description !== undefined) row.description = patch.description;
            supabase.from('groups').update(row).eq('id', id).then(() => {});
          }
        },

        deleteGroup: (id) => {
          set((s) => ({ groups: s.groups.filter((g) => g.id !== id), plans: s.plans.filter((p) => p.groupId !== id), bets: s.bets.filter((b) => b.groupId !== id) }));
          if (cloud && supabase) supabase.from('groups').delete().eq('id', id).then(() => {});
        },

        addMember: (groupId, userId) => {
          set((s) => ({
            groups: s.groups.map((g) =>
              g.id === groupId && !g.members.some((m) => m.userId === userId)
                ? { ...g, members: [...g.members, { userId, role: 'member', joinedAt: Date.now() }] }
                : g
            ),
          }));
          if (cloud && supabase) supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role: 'member' }).then(() => {});
        },

        removeMember: (groupId, userId) => {
          set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? { ...g, members: g.members.filter((m) => m.userId !== userId) } : g)) }));
          if (cloud && supabase) supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId).then(() => {});
        },

        // ----- plans -----
        createPlan: (groupId, title, description, date) => {
          const cu = get().currentUser;
          const id = uid();
          const p: Plan = { id, groupId, title, description, date, tasks: [], expenses: [], createdAt: Date.now(), createdBy: cu?.id ?? '' };
          set((s) => ({ plans: [...s.plans, p] }));
          if (cloud && supabase) {
            supabase.from('plans').insert({ id, group_id: groupId, title, description, date, created_by: cu?.id ?? null }).then(({ error }) => {
              if (error) { console.error(error); set((s) => ({ plans: s.plans.filter((x) => x.id !== id) })); }
            });
          }
          if (cu) awardCoins(cu.id, 5);
          return p;
        },

        updatePlan: (id, patch) => {
          set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
          if (cloud && supabase) {
            const row: any = {};
            if (patch.title !== undefined) row.title = patch.title;
            if (patch.description !== undefined) row.description = patch.description;
            if (patch.date !== undefined) row.date = patch.date;
            supabase.from('plans').update(row).eq('id', id).then(() => {});
          }
        },

        deletePlan: (id) => {
          set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
          if (cloud && supabase) supabase.from('plans').delete().eq('id', id).then(() => {});
        },

        addTask: (planId, title, assigneeId, dueDate) => {
          const t: Task = { id: uid(), title, assigneeId, status: 'todo', dueDate };
          set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, tasks: [...p.tasks, t] } : p)) }));
          if (cloud && supabase) {
            supabase.from('tasks').insert({ id: t.id, plan_id: planId, title, assignee_id: assigneeId ?? null, status: 'todo', due_date: dueDate ?? null }).then(() => {});
          }
          return t;
        },

        updateTask: (planId, taskId, patch) => {
          set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) } : p)) }));
          if (cloud && supabase) {
            const row: any = {};
            if (patch.title !== undefined) row.title = patch.title;
            if (patch.assigneeId !== undefined) row.assignee_id = patch.assigneeId;
            if (patch.status !== undefined) row.status = patch.status;
            if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
            if (patch.notes !== undefined) row.notes = patch.notes;
            supabase.from('tasks').update(row).eq('id', taskId).then(() => {});
          }
        },

        deleteTask: (planId, taskId) => {
          set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p)) }));
          if (cloud && supabase) supabase.from('tasks').delete().eq('id', taskId).then(() => {});
        },

        addExpense: (planId, e) => {
          const ex: Expense = { ...e, id: uid(), createdAt: Date.now() };
          set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, expenses: [...p.expenses, ex] } : p)) }));
          if (cloud && supabase) {
            supabase.from('expenses').insert({ id: ex.id, plan_id: planId, title: e.title, amount: e.amount, paid_by: e.paidById, split_among: e.splitAmong }).then(() => {});
          }
          return ex;
        },

        updateExpense: (planId, expenseId, patch) => {
          set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, expenses: p.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) } : p)) }));
          if (cloud && supabase) {
            const row: any = {};
            if (patch.title !== undefined) row.title = patch.title;
            if (patch.amount !== undefined) row.amount = patch.amount;
            if (patch.paidById !== undefined) row.paid_by = patch.paidById;
            if (patch.splitAmong !== undefined) row.split_among = patch.splitAmong;
            supabase.from('expenses').update(row).eq('id', expenseId).then(() => {});
          }
        },

        deleteExpense: (planId, expenseId) => {
          set((s) => ({ plans: s.plans.map((p) => (p.id === planId ? { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) } : p)) }));
          if (cloud && supabase) supabase.from('expenses').delete().eq('id', expenseId).then(() => {});
        },

        // ----- bets -----
        createBet: (groupId, title, targetUserId, options, description) => {
          const cu = get().currentUser;
          const id = uid();
          const opts: BetOption[] = options.map((o) => ({ id: uid(), label: o }));
          const bet: Bet = { id, groupId, title, description, targetUserId, options: opts, wagers: [], status: 'open', createdAt: Date.now(), createdBy: cu?.id ?? '' };
          set((s) => ({ bets: [...s.bets, bet] }));
          if (cu) awardCoins(cu.id, 5);
          if (cloud && supabase) {
            supabase.from('bets').insert({ id, group_id: groupId, title, description, target_user_id: targetUserId, status: 'open', created_by: cu?.id ?? null }).then(async ({ error }) => {
              if (error) { console.error(error); set((s) => ({ bets: s.bets.filter((x) => x.id !== id) })); return; }
              await supabase!.from('bet_options').insert(opts.map((o) => ({ id: o.id, bet_id: id, label: o.label })));
            });
          }
          return bet;
        },

        addWager: (betId, userId, optionId, amount) => {
          const amt = amount ?? 0;
          const bet = get().bets.find((b) => b.id === betId);
          const prev = bet?.wagers.find((w) => w.userId === userId);
          const prevAmount = prev?.amount ?? 0;
          const cu = get().currentUser;
          const available = (cu?.coins ?? 1000) + prevAmount;
          if (amt > available) return;
          if (prev && prevAmount > 0) awardCoins(userId, prevAmount);
          if (amt > 0) awardCoins(userId, -amt);
          set((s) => ({
            bets: s.bets.map((b) =>
              b.id === betId
                ? { ...b, wagers: [...b.wagers.filter((w) => w.userId !== userId), { userId, optionId, amount: amt || undefined, createdAt: Date.now() }] }
                : b
            ),
          }));
          if (cloud && supabase) {
            supabase.from('bet_wagers').upsert({ bet_id: betId, user_id: userId, option_id: optionId, amount: amt || null }, { onConflict: 'bet_id,user_id' }).then(() => {});
          }
        },

        resolveBet: (betId, winningOptionId) => {
          const bet = get().bets.find((b) => b.id === betId);
          const wagers = bet?.wagers ?? [];
          const totalPot = wagers.reduce((sum, w) => sum + (w.amount ?? 0), 0);
          const winningPool = wagers.filter((w) => w.optionId === winningOptionId).reduce((sum, w) => sum + (w.amount ?? 0), 0);
          set((s) => ({ bets: s.bets.map((b) => (b.id === betId ? { ...b, status: 'resolved', winningOptionId, resolvedAt: Date.now() } : b)) }));
          if (cloud && supabase) supabase.from('bets').update({ status: 'resolved', winning_option_id: winningOptionId, resolved_at: new Date().toISOString() }).eq('id', betId).then(() => {});
          if (winningPool > 0 && totalPot > 0) {
            // distribuir el bote proporcionalmente entre los ganadores
            const winners = wagers.filter((w) => w.optionId === winningOptionId);
            let distributed = 0;
            winners.forEach((w, idx) => {
              const amt = w.amount ?? 0;
              const payout = idx === winners.length - 1 ? totalPot - distributed : Math.floor((amt / winningPool) * totalPot);
              distributed += payout;
              if (payout > 0) awardCoins(w.userId, payout);
            });
          } else if (totalPot > 0) {
            // nadie acertó: devolver todo
            wagers.forEach((w) => {
              if ((w.amount ?? 0) > 0) awardCoins(w.userId, w.amount ?? 0);
            });
          }
        },

        cancelBet: (betId) => {
          const bet = get().bets.find((b) => b.id === betId);
          bet?.wagers.forEach((w) => {
            if ((w.amount ?? 0) > 0) awardCoins(w.userId, w.amount ?? 0);
          });
          set((s) => ({ bets: s.bets.map((b) => (b.id === betId ? { ...b, status: 'cancelled' } : b)) }));
          if (cloud && supabase) supabase.from('bets').update({ status: 'cancelled' }).eq('id', betId).then(() => {});
        },

        deleteBet: (betId) => {
          const bet = get().bets.find((b) => b.id === betId);
          if (bet && bet.status === 'open') {
            bet.wagers.forEach((w) => {
              if ((w.amount ?? 0) > 0) awardCoins(w.userId, w.amount ?? 0);
            });
          }
          set((s) => ({ bets: s.bets.filter((b) => b.id !== betId) }));
          if (cloud && supabase) supabase.from('bets').delete().eq('id', betId).then(() => {});
        },

        // ----- chat -----
        sendMessage: (groupId, body, replyToId) => {
          const cu = get().currentUser;
          const text = body.trim();
          if (!cu || !text) return undefined;
          const m: Message = { id: uid(), groupId, userId: cu.id, body: text, replyToId, createdAt: Date.now() };
          set((s) => ({ messages: [...s.messages, m] }));
          if (cloud && supabase) {
            supabase
              .from('messages')
              .insert({ id: m.id, group_id: groupId, user_id: cu.id, body: text, reply_to_id: replyToId ?? null })
              .then(({ error }) => {
                if (error) {
                  console.error(error);
                  set((s) => ({ messages: s.messages.filter((x) => x.id !== m.id) }));
                }
              });
          }
          return m;
        },

        deleteMessage: (id) => {
          set((s) => ({ messages: s.messages.filter((m) => m.id !== id) }));
          if (cloud && supabase) supabase.from('messages').delete().eq('id', id).then(() => {});
        },

        // ----- championships -----
        createChampionship: (groupId, name, description, scoringType, pointsSystem) => {
          const cu = get().currentUser;
          const id = uid();
          const c: Championship = {
            id,
            groupId,
            name,
            description,
            scoringType,
            pointsSystem,
            createdAt: Date.now(),
            createdBy: cu?.id ?? '',
            events: [],
          };
          set((s) => ({ championships: [...s.championships, c] }));
          if (cloud && supabase) {
            supabase
              .from('championships')
              .insert({
                id,
                group_id: groupId,
                name,
                description: description ?? null,
                scoring_type: scoringType,
                points_system: pointsSystem,
                created_by: cu?.id ?? null,
              })
              .then(({ error }) => {
                if (error) {
                  console.error(error);
                  set((s) => ({ championships: s.championships.filter((x) => x.id !== id) }));
                }
              });
          }
          return c;
        },

        deleteChampionship: (id) => {
          set((s) => ({ championships: s.championships.filter((c) => c.id !== id) }));
          if (cloud && supabase) supabase.from('championships').delete().eq('id', id).then(() => {});
        },

        addChampionshipEvent: (championshipId, name, date) => {
          const ev: ChampionshipEvent = {
            id: uid(),
            championshipId,
            name,
            date,
            createdAt: Date.now(),
            results: [],
          };
          set((s) => ({
            championships: s.championships.map((c) =>
              c.id === championshipId ? { ...c, events: [...c.events, ev] } : c
            ),
          }));
          if (cloud && supabase) {
            supabase
              .from('championship_events')
              .insert({ id: ev.id, championship_id: championshipId, name, date: date ?? null })
              .then(({ error }) => {
                if (error) {
                  console.error(error);
                  set((s) => ({
                    championships: s.championships.map((c) =>
                      c.id === championshipId
                        ? { ...c, events: c.events.filter((x) => x.id !== ev.id) }
                        : c
                    ),
                  }));
                }
              });
          }
          return ev;
        },

        deleteChampionshipEvent: (championshipId, eventId) => {
          set((s) => ({
            championships: s.championships.map((c) =>
              c.id === championshipId
                ? { ...c, events: c.events.filter((e) => e.id !== eventId) }
                : c
            ),
          }));
          if (cloud && supabase) supabase.from('championship_events').delete().eq('id', eventId).then(() => {});
        },

        setEventResults: (championshipId, eventId, entries) => {
          const championship = get().championships.find((c) => c.id === championshipId);
          if (!championship) return;
          const system = championship.pointsSystem;
          let results: { userId: string; position: number; points: number; timeMs?: number }[];
          if (championship.scoringType === 'times') {
            const sorted = [...entries].sort((a, b) => (a.timeMs ?? Number.MAX_SAFE_INTEGER) - (b.timeMs ?? Number.MAX_SAFE_INTEGER));
            results = sorted.map((e, i) => ({ userId: e.userId, position: i + 1, points: 0, timeMs: e.timeMs }));
          } else {
            results = entries.map((e) => ({
              userId: e.userId,
              position: e.position ?? 0,
              points: pointsForPosition(system, e.position ?? 0),
              timeMs: undefined,
            }));
          }
          set((s) => ({
            championships: s.championships.map((c) =>
              c.id === championshipId
                ? {
                    ...c,
                    events: c.events.map((e) => (e.id === eventId ? { ...e, results } : e)),
                  }
                : c
            ),
          }));
          if (cloud && supabase) {
            const rows = results.map((r) => ({
              event_id: eventId,
              user_id: r.userId,
              position: r.position,
              points: r.points,
              time_ms: r.timeMs ?? null,
            }));
            (async () => {
              const { error: delError } = await supabase!
                .from('championship_results')
                .delete()
                .eq('event_id', eventId);
              if (delError) {
                console.error(delError);
                return;
              }
              if (rows.length) {
                const { error } = await supabase!.from('championship_results').insert(rows);
                if (error) console.error(error);
              }
            })();
          }
        },
      };
    },
    {
      name: 'crewzy-store',
      // only persist in local mode; in cloud mode data comes from server
      partialize: (state) => (hasSupabase ? { } : state),
    }
  )
);