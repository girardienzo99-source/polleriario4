'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp, Receipt, ClipboardList, Clock, Flame, CheckCircle2, XCircle, Wallet, AlertTriangle,
  Store, ChefHat, Package, Boxes, FileText, Sparkles, ShoppingBag, Truck,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';
import { dayKey, lastNDays, summarizeSales, salesSeries, filterByDays, sumExpenses, countOrdersByStatus, pctChange } from '@/lib/domain/reports';
import { useAuth } from '@/context/AuthContext';
import { canAccess, ModuleId } from '@/lib/domain/permissions';
import { PageHeader, Card, StatCard, EmptyState, Badge, useStoreVersion } from '../ui';

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', debito: 'Débito', credito: 'Crédito', mercadopago: 'Mercado Pago', mixto: 'Mixto',
};

export const DashboardView: React.FC<{ onNavigate: (tab: ModuleId) => void }> = ({ onNavigate }) => {
  const v = useStoreVersion();
  const { role, user } = useAuth();

  const data = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const sales = PolleriaStore.getSales();
    const orders = PolleriaStore.getOrders();
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86_400_000));
    const todaySet = new Set([today]);
    const salesToday = filterByDays(sales, todaySet);
    const salesYesterday = filterByDays(sales, new Set([yesterday]));
    const s = summarizeSales(salesToday);
    const sy = summarizeSales(salesYesterday);
    const ordersToday = filterByDays(orders, todaySet);
    const status = countOrdersByStatus(ordersToday);
    const days14 = lastNDays(14);
    const series = salesSeries(filterByDays(sales, new Set(days14)), days14);
    const expensesToday = sumExpenses(PolleriaStore.getExpenses(), todaySet);
    const lowIngredients = PolleriaStore.getIngredients().filter(i => i.is_alert_active && i.current_stock <= i.min_stock);
    const lowProducts = PolleriaStore.getProducts().filter(p => p.active && (p.stock_mode === 'batch' || p.stock_mode === 'simple') && p.current_stock <= p.min_stock);
    const promos = PolleriaStore.getPromotions().filter(p => p.is_active);
    const cash = PolleriaStore.getCashSession();
    const batchesInOven = PolleriaStore.getBatches().filter(b => b.status === 'en_horno');
    return { s, sy, status, ordersToday, series, expensesToday, lowIngredients, lowProducts, promos, cash, batchesInOven };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  if (!data) return null;
  const { s, sy, status, ordersToday, series, expensesToday, lowIngredients, lowProducts, promos, cash, batchesInOven } = data;
  const change = pctChange(s.total, sy.total);
  const hasSeries = series.some(x => x.total > 0);

  const quick: { id: ModuleId; label: string; icon: React.ElementType }[] = [
    { id: 'pos', label: 'Nueva venta', icon: Store },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'cash', label: cash.status === 'abierta' ? 'Caja' : 'Abrir caja', icon: Wallet },
    { id: 'kitchen', label: 'Cocina', icon: ChefHat },
    { id: 'production', label: 'Tandas', icon: Flame },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'arca', label: 'Facturación', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${user?.full_name.split(' ')[0] ?? ''}`}
        subtitle="Resumen de hoy calculado con las ventas, pedidos y gastos registrados en el sistema."
        actions={quick.filter(q => canAccess(role, q.id)).slice(0, 3).map(q => (
          <button key={q.id} onClick={() => onNavigate(q.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 px-3 py-2 text-xs font-bold text-white transition">
            <q.icon className="w-3.5 h-3.5 text-fire-400" /> {q.label}
          </button>
        ))}
      />

      {cash.status !== 'abierta' && canAccess(role, 'cash') && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
          <div className="flex items-center gap-3 text-sm text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            La caja está cerrada. No se pueden registrar cobros hasta abrirla.
          </div>
          <button onClick={() => onNavigate('cash')} className="rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 px-4 py-2 text-xs font-black">Abrir caja</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Facturación de hoy" value={formatARS(s.total)} icon={TrendingUp} tone="fire"
          hint={change === null ? 'Sin ventas ayer para comparar' : `${change >= 0 ? '+' : ''}${change}% vs. ayer`} />
        <StatCard label="Ventas cobradas" value={s.count} icon={Receipt} tone="green" hint={s.count ? `Ticket promedio ${formatARS(s.avgTicket)}` : 'Todavía no hay cobros hoy'} />
        <StatCard label="Ganancia bruta est." value={formatARS(s.grossProfit)} icon={Sparkles} tone="blue" hint="Ventas − costo de productos" />
        <StatCard label="Gastos de hoy" value={formatARS(expensesToday)} icon={Wallet} tone="red" hint="Registrados en Gastos" />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { k: 'recibido', label: 'Recibidos', icon: ClipboardList, cls: 'text-sky-400' },
          { k: 'en_preparacion', label: 'En cocina', icon: Clock, cls: 'text-amber-400' },
          { k: 'listo', label: 'Listos', icon: CheckCircle2, cls: 'text-emerald-400' },
          { k: 'en_reparto', label: 'En reparto', icon: Truck, cls: 'text-violet-400' },
          { k: 'entregado', label: 'Entregados', icon: ShoppingBag, cls: 'text-charcoal-300' },
          { k: 'cancelado', label: 'Cancelados', icon: XCircle, cls: 'text-red-400' },
        ].map(x => (
          <div key={x.k} className="rounded-2xl border border-charcoal-800 bg-charcoal-900/70 p-3">
            <x.icon className={`w-4 h-4 mb-2 ${x.cls}`} />
            <div className="text-xl font-black text-white tabular-nums">{status[x.k] ?? 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-charcoal-400 font-semibold">{x.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Facturación últimos 14 días" className="lg:col-span-2">
          {hasSeries ? (
            <div className="h-64 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#242426" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={n => `$${Math.round(n / 1000)}k`} width={48} />
                  <Tooltip contentStyle={{ background: '#141416', border: '1px solid #242426', borderRadius: 12, fontSize: 12 }} formatter={(n: number) => [formatARS(n), 'Facturación']} />
                  <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="Sin ventas registradas en los últimos 14 días" text="El gráfico se completa automáticamente con cada cobro en el punto de venta o al cobrar un pedido." />
          )}
        </Card>

        <Card title="Cobros por medio de pago (hoy)">
          {s.byPayment.length ? (
            <ul className="space-y-3">
              {s.byPayment.map(p => {
                const pct = s.total ? Math.round((p.total / s.total) * 100) : 0;
                return (
                  <li key={p.method}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-charcoal-200 font-semibold">{PAYMENT_LABELS[p.method] ?? p.method} <span className="text-charcoal-500">· {p.count}</span></span>
                      <span className="text-white font-bold tabular-nums">{formatARS(p.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-charcoal-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-fire-500 to-crimson-500" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={Wallet} title="Sin cobros hoy" />
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Más vendidos hoy">
          {s.topProducts.length ? (
            <ol className="space-y-2.5">
              {s.topProducts.slice(0, 6).map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-xs">
                  <span className="w-6 h-6 rounded-lg bg-charcoal-800 text-charcoal-300 flex items-center justify-center font-black text-[11px]">{i + 1}</span>
                  <span className="flex-1 text-charcoal-200 truncate">{p.name}</span>
                  <span className="text-charcoal-400 tabular-nums">{p.quantity} u.</span>
                  <span className="text-white font-bold tabular-nums w-20 text-right">{formatARS(p.revenue)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={ShoppingBag} title="Todavía no hay ventas hoy" />
          )}
        </Card>

        <Card title="Alertas de stock" action={canAccess(role, 'stock') ? <button onClick={() => onNavigate('stock')} className="text-[11px] font-bold text-fire-400 hover:underline">Ver stock</button> : undefined}>
          {lowIngredients.length + lowProducts.length ? (
            <ul className="space-y-2 text-xs">
              {lowProducts.map(p => (
                <li key={p.id} className="flex justify-between gap-2"><span className="text-charcoal-200 truncate">{p.name}</span><Badge tone={p.current_stock <= 0 ? 'red' : 'amber'}>{p.current_stock} u.</Badge></li>
              ))}
              {lowIngredients.map(i => (
                <li key={i.id} className="flex justify-between gap-2"><span className="text-charcoal-200 truncate">{i.name}</span><Badge tone={i.current_stock <= 0 ? 'red' : 'amber'}>{i.current_stock} {i.unit_measure}</Badge></li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CheckCircle2} title="Todo el stock está sobre el mínimo" />
          )}
        </Card>

        <Card title="Operación">
          <ul className="space-y-3 text-xs">
            <li className="flex justify-between"><span className="text-charcoal-400">Pedidos de hoy</span><span className="text-white font-bold">{ordersToday.length}</span></li>
            <li className="flex justify-between"><span className="text-charcoal-400">Tandas en horno</span><span className="text-white font-bold">{batchesInOven.length}</span></li>
            <li className="flex justify-between"><span className="text-charcoal-400">Promociones activas</span><span className="text-white font-bold">{promos.length}</span></li>
            <li className="flex justify-between"><span className="text-charcoal-400">Efectivo esperado en caja</span><span className="text-white font-bold">{cash.status === 'abierta' ? formatARS(cash.expected_cash) : '—'}</span></li>
          </ul>
          <div className="grid grid-cols-4 gap-2 mt-5">
            {quick.filter(q => canAccess(role, q.id)).map(q => (
              <button key={q.id} onClick={() => onNavigate(q.id)} title={q.label} className="flex flex-col items-center gap-1 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500/50 py-2.5 transition">
                <q.icon className="w-4 h-4 text-fire-400" />
                <span className="text-[9px] text-charcoal-300 font-semibold">{q.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
