import type { Plan } from './types';

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