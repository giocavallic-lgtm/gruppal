import type { Plan, Championship } from './types';

export const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SIMPLE_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];

export function pointsForPosition(system: number[], position: number): number {
  return position > 0 ? system[position - 1] ?? 0 : 0;
}

export interface StandingRow {
  userId: string;
  points: number;
  races: number;
  wins: number;
  bestPosition: number | null;
  totalTimeMs?: number;
  bestTimeMs?: number;
}

export function computeStandings(championship: Championship): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const event of championship.events) {
    for (const result of event.results) {
      const row = map.get(result.userId) ?? {
        userId: result.userId,
        points: 0,
        races: 0,
        wins: 0,
        bestPosition: null,
        totalTimeMs: 0,
        bestTimeMs: undefined,
      };
      row.points += result.points;
      row.races += 1;
      if (result.position === 1) row.wins += 1;
      row.bestPosition = row.bestPosition === null ? result.position : Math.min(row.bestPosition, result.position);
      if (result.timeMs != null) {
        row.totalTimeMs = (row.totalTimeMs ?? 0) + result.timeMs;
        row.bestTimeMs = row.bestTimeMs == null ? result.timeMs : Math.min(row.bestTimeMs, result.timeMs);
      }
      map.set(result.userId, row);
    }
  }
  const rows = [...map.values()];
  if (championship.scoringType === 'times') {
    return rows.sort(
      (a, b) =>
        (a.totalTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.totalTimeMs ?? Number.MAX_SAFE_INTEGER) ||
        (a.bestTimeMs ?? Number.MAX_SAFE_INTEGER) - (b.bestTimeMs ?? Number.MAX_SAFE_INTEGER)
    );
  }
  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      (a.bestPosition ?? Number.MAX_SAFE_INTEGER) - (b.bestPosition ?? Number.MAX_SAFE_INTEGER)
  );
}

export function formatTimeMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
  }
  return `${seconds.toFixed(2)}s`;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

export function formatDate(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Compute net balances for a plan's expenses: who owes whom.
export function computeBalances(plan: Plan): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const e of plan.expenses) {
    const share = e.amount / (e.splitAmong.length || 1);
    // payer gets +amount (others owe them)
    bal[e.paidById] = (bal[e.paidById] ?? 0) + e.amount;
    for (const uid of e.splitAmong) {
      bal[uid] = (bal[uid] ?? 0) - share;
    }
  }
  return bal;
}

// Simplify debts into list of {from, to, amount}
export function simplifyDebts(bal: Record<string, number>): { from: string; to: string; amount: number }[] {
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];
  for (const [id, amt] of Object.entries(bal)) {
    if (amt > 0.005) creditors.push({ id, amt });
    else if (amt < -0.005) debtors.push({ id, amt: -amt });
  }
  const res: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const amt = Math.min(d.amt, c.amt);
    res.push({ from: d.id, to: c.id, amount: amt });
    d.amt -= amt; c.amt -= amt;
    if (d.amt < 0.005) i++;
    if (c.amt < 0.005) j++;
  }
  return res;
}