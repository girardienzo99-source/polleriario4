'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Receipt, Wallet, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';
import { lastNDays, filterByDays, summarizeSales, salesSeries, sumExpenses, countByChannel, countOrdersByStatus } from '@/lib/domain/reports';
import { PageHeader, Card, StatCard, Button, EmptyState, Table, useStoreVersion } from '../ui';

const RANGES = [{ d: 1, l: 'Hoy' }, { d: 7, l: '7 días' }, { d: 30, l: '30 días' }, { d: 90, l: '90 días' }];
const COLORS = ['#f97316', '#ef4444', '#fbbf24', '#38bdf8', '#a78bfa', '#34d399'];
const PAY: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', debito: 'Débito', credito: 'Crédito', mercadopago: 'Mercado Pago', mixto: 'Mixto' };
const CH: Record<string, string> = { landing: 'Web', mostrador: 'Mostrador', whatsapp: 'WhatsApp', telefono: 'Teléfono', interno: 'Interno' };

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const ReportsView: React.FC = () => {
  const v = useStoreVersion();
  const [range, setRange] = useState(7);

  const r = useMemo(() => {
    const days = lastNDays(range);
    const set = new Set(days);
    const sales = filterByDays(PolleriaStore.getSales(), set);
    const orders = filterByDays(PolleriaStore.getOrders(), set);
    const s = summarizeSales(sales);
    const expenses = sumExpenses(PolleriaStore.getExpenses(), set);
    return { days, sales, s, expenses, series: salesSeries(sales, days), channels: countByChannel(orders), status: countOrdersByStatus(orders), ordersCount: orders.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, range]);

  const exportSales = () => downloadCsv(`ventas_${r.days[0]}_${r.days[r.days.length - 1]}.csv`, [
    ['Número', 'Fecha', 'Canal', 'Cliente', 'Medio de pago', 'Subtotal', 'Descuento', 'Total', 'Estado fiscal'],
    ...r.sales.map(x => [x.sale_number, new Date(x.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' }), x.channel, x.customer_name ?? '', PAY[x.payment_method] ?? x.payment_method, x.subtotal, x.discount, x.total, x.fiscal_status]),
  ]);

  const net = r.s.grossProfit - r.expenses;

  return (
    <div className="space-y-5">
      <PageHeader icon={BarChart3} title="Informes" subtitle="Calculados exclusivamente con ventas, pedidos y gastos registrados."
        actions={<>
          <div className="flex rounded-xl bg-charcoal-900 border border-charcoal-800 p-1">
            {RANGES.map(x => <button key={x.d} onClick={() => setRange(x.d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${range === x.d ? 'bg-fire-600 text-white' : 'text-charcoal-300 hover:text-white'}`}>{x.l}</button>)}
          </div>
          <Button onClick={exportSales} disabled={!r.sales.length}><Download className="w-4 h-4" /> Exportar CSV</Button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Facturación" value={formatARS(r.s.total)} icon={TrendingUp} tone="fire" hint={`${r.s.count} ventas`} />
        <StatCard label="Ticket promedio" value={formatARS(r.s.avgTicket)} icon={Receipt} tone="blue" />
        <StatCard label="Ganancia bruta est." value={formatARS(r.s.grossProfit)} icon={Sparkles} tone="green" hint={`Costo ${formatARS(r.s.cost)}`} />
        <StatCard label="Resultado tras gastos" value={formatARS(net)} icon={Wallet} tone={net >= 0 ? 'green' : 'red'} hint={`Gastos ${formatARS(r.expenses)}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Facturación por día" className="lg:col-span-2">
          {r.s.count ? (
            <div className="h-64 -ml-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r.series}>
                  <CartesianGrid stroke="#242426" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={n => `$${Math.round(n / 1000)}k`} width={48} />
                  <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#141416', border: '1px solid #242426', borderRadius: 12, fontSize: 12 }} formatter={(n: number) => [formatARS(n), 'Facturación']} />
                  <Bar dataKey="total" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon={BarChart3} title="Sin ventas en el período" />}
        </Card>
        <Card title="Medios de pago">
          {r.s.byPayment.length ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={r.s.byPayment} dataKey="total" nameKey="method" innerRadius={40} outerRadius={65} paddingAngle={2} stroke="none">
                      {r.s.byPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#141416', border: '1px solid #242426', borderRadius: 12, fontSize: 12 }} formatter={(n: number, k: string) => [formatARS(n), PAY[k] ?? k]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 text-xs mt-2">
                {r.s.byPayment.map((p, i) => <li key={p.method} className="flex justify-between"><span className="flex items-center gap-2 text-charcoal-300"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{PAY[p.method] ?? p.method}</span><span className="text-white font-bold">{formatARS(p.total)}</span></li>)}
              </ul>
            </>
          ) : <EmptyState title="Sin cobros" />}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Productos más vendidos">
          <Table head={['Producto', 'Cantidad', 'Facturación']} empty={<EmptyState title="Sin datos" />}>
            {r.s.topProducts.slice(0, 15).map(p => (
              <tr key={p.name} className="text-charcoal-200">
                <td className="px-5 py-2">{p.name}</td>
                <td className="px-5 py-2 tabular-nums">{p.quantity}</td>
                <td className="px-5 py-2 tabular-nums font-bold text-white">{formatARS(p.revenue)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title={`Pedidos por canal (${r.ordersCount})`}>
          <Table head={['Canal', 'Pedidos', 'Monto']} empty={<EmptyState title="Sin pedidos en el período" />}>
            {r.channels.map(c => (
              <tr key={c.channel} className="text-charcoal-200">
                <td className="px-5 py-2">{CH[c.channel] ?? c.channel}</td>
                <td className="px-5 py-2 tabular-nums">{c.count}</td>
                <td className="px-5 py-2 tabular-nums font-bold text-white">{formatARS(c.total)}</td>
              </tr>
            ))}
          </Table>
          {r.ordersCount > 0 && <p className="text-[11px] text-charcoal-400 mt-3">Cancelados: {r.status.cancelado ?? 0} · Entregados: {r.status.entregado ?? 0}</p>}
        </Card>
      </div>
    </div>
  );
};
