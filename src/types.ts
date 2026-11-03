export type ID = string;

export interface User {
  id: ID;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface GroupMember {
  userId: ID;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface Group {
  id: ID;
  name: string;
  description?: string;
  ownerId: ID;
  members: GroupMember[];
  inviteCode?: string;
  createdAt: number;
}

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: ID;
  title: string;
  assigneeId?: ID;
  status: TaskStatus;
  dueDate?: number; // timestamp
  notes?: string;
}

export interface Expense {
  id: ID;
  title: string;
  amount: number; // total
  paidById: ID;
  splitAmong: ID[]; // userIds
  createdAt: number;
  settled?: boolean;
}

export interface Plan {
  id: ID;
  groupId: ID;
  title: string;
  description?: string;
  date?: number; // event date
  tasks: Task[];
  expenses: Expense[];
  createdAt: number;
  createdBy: ID;
}

export type BetStatus = 'open' | 'resolved' | 'cancelled';

export interface BetOption {
  id: ID;
  label: string;
}

export interface BetWager {
  userId: ID;
  optionId: ID;
  amount?: number; // optional stake
  createdAt: number;
}

export interface Bet {
  id: ID;
  groupId: ID;
  title: string;
  description?: string;
  targetUserId: ID; // the person the bet is about -> cannot see it
  options: BetOption[];
  wagers: BetWager[];
  status: BetStatus;
  winningOptionId?: ID;
  createdAt: number;
  createdBy: ID;
  resolvedAt?: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  plans: Plan[];
  bets: Bet[];
}