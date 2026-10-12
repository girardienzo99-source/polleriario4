/**
 * Agregaciones para Dashboard e Informes. Todo se calcula a partir de los
 * registros guardados (ventas, pedidos, gastos). Sin cifras fijas.
 */
import { toCents, fromCents } from './money.ts';

export const TZ = 'America/Argentina/Cordoba';

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Clave de día AAAA-MM-DD en hora de Córdoba. */
export function dayKey(isoOrDate: string | Date): string {
  return dayFmt.format(typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate);
}

export function lastNDays(n: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(now.getTime() - i * 86_400_000)));
  return out;
}

export interface SaleLike {
  total: number;
  payment_method: string;
  created_at: string;
  items: { product_id?: string; description: string; quantity: number; unit_price: number; subtotal: number; cost_price: number }[];
}

export interface ExpenseLike {
  amount: number;
  expense_date: string; // AAAA-MM-DD
}

export interface OrderLike {
  status: string;
  created_at: string;
  channel: string;
  total: number;
}

export interface SalesSummary {
  count: number;
  total: number;
  avgTicket: number;
  cost: number;
  grossProfit: number;
  byPayment: { method: string; total: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export function filterByDays<T extends { created_at: string }>(rows: T[], days: Set<string>): T[] {
  return rows.filter(r => days.has(dayKey(r.created_at)));
}

export function summarizeSales(sales: SaleLike[]): SalesSummary {
  let total = 0, cost = 0;
  const pay = new Map<string, { total: number; count: number }>();
  const prod = new Map<string, { quantity: number; revenue: number }>();
  for (const s of sales) {
    const t = toCents(s.total);
    total += t;
    const p = pay.get(s.payment_method) ?? { total: 0, count: 0 };
    p.total += t; p.count += 1;
    pay.set(s.payment_method, p);
    for (const it of s.items) {
      cost += toCents((it.cost_price || 0) * it.quantity);
      const key = it.description;
      const q = prod.get(key) ?? { quantity: 0, revenue: 0 };
      q.quantity += it.quantity; q.revenue += toCents(it.subtotal);
      prod.set(key, q);
    }
  }
  return {
    count: sales.length,
    total: fromCents(total),
    avgTicket: sales.length ? fromCents(Math.round(total / sales.length)) : 0,
    cost: fromCents(cost),
    grossProfit: fromCents(total - cost),
    byPayment: [...pay.entries()].map(([method, v]) => ({ method, total: fromCents(v.total), count: v.count })).sort((a, b) => b.total - a.total),
    topProducts: [...prod.entries()].map(([name, v]) => ({ name, quantity: v.quantity, revenue: fromCents(v.revenue) })).sort((a, b) => b.quantity - a.quantity),
  };
}

export function salesSeries(sales: SaleLike[], days: string[]): { day: string; label: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>(days.map(d => [d, { total: 0, count: 0 }]));
  for (const s of sales) {
    const k = dayKey(s.created_at);
    const e = map.get(k);
    if (e) { e.total += toCents(s.total); e.count += 1; }
  }
  return days.map(d => {
    const e = map.get(d)!;
    const [, m, dd] = d.split('-');
    return { day: d, label: `${dd}/${m}`, total: fromCents(e.total), count: e.count };
  });
}

export function sumExpenses(expenses: ExpenseLike[], days: Set<string>): number {
  return fromCents(expenses.filter(e => days.has(e.expense_date)).reduce((a, e) => a + toCents(e.amount), 0));
}

export function countOrdersByStatus(orders: OrderLike[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const o of orders) out[o.status] = (out[o.status] ?? 0) + 1;
  return out;
}

export function countByChannel(orders: OrderLike[]): { channel: string; count: number; total: number }[] {
  const m = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    if (o.status === 'cancelado') continue;
    const e = m.get(o.channel) ?? { count: 0, total: 0 };
    e.count += 1; e.total += toCents(o.total);
    m.set(o.channel, e);
  }
  return [...m.entries()].map(([channel, v]) => ({ channel, count: v.count, total: fromCents(v.total) })).sort((a, b) => b.count - a.count);
}

/** Variación porcentual; null si no hay base de comparación. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
