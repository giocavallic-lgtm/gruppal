export type ID = string;

export type Theme = 'system' | 'dark' | 'light';

export interface User {
  id: ID;
  name: string;
  avatar?: string;
  coins?: number; // app internal coin balance
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

export interface Message {
  id: ID;
  groupId: ID;
  userId: ID;
  body: string;
  replyToId?: ID;
  createdAt: number;
}

export interface ChampionshipResult {
  userId: ID;
  position: number;
  points: number;
}

export interface ChampionshipEvent {
  id: ID;
  championshipId: ID;
  name: string;
  date?: number;
  createdAt: number;
  results: ChampionshipResult[];
}

export interface Championship {
  id: ID;
  groupId: ID;
  name: string;
  description?: string;
  pointsSystem: number[];
  createdAt: number;
  createdBy: ID;
  events: ChampionshipEvent[];
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  plans: Plan[];
  bets: Bet[];
  messages: Message[];
  championships: Championship[];
}