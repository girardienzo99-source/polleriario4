'use client';

import React, { useMemo, useState } from 'react';
import { Flame, Plus, CheckCircle2, XCircle, Timer, Drumstick } from 'lucide-react';
import { ProductionBatch } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatDateTimeAR, formatTimeAR } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Card, StatCard, Button, Badge, EmptyState, Modal, Field, inputCls, run, useStoreVersion, useNow, Table } from '../ui';

export const ProductionBatchesView: React.FC = () => {
  const v = useStoreVersion();
  const now = useNow(30_000);
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState<ProductionBatch | null>(null);
  const [cooked, setCooked] = useState(0);
  const [cancelling, setCancelling] = useState<ProductionBatch | null>(null);
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({ raw: 10, minutes: 80, operator: user?.full_name ?? '', notes: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { batches, rawChicken, spiedo, recipe } = useMemo(() => ({
    batches: PolleriaStore.getBatches(),
    rawChicken: PolleriaStore.getIngredients().find(i => i.id === 'ing-pollo-crudo'),
    spiedo: PolleriaStore.getProducts().find(p => p.id === 'prod-spiedo-entero'),
    recipe: PolleriaStore.getRecipes().find(r => r.product_id === 'prod-spiedo-entero'),
  }), [v]);

  const ingredients = PolleriaStore.getIngredients();
  const inOven = batches.filter(b => b.status === 'en_horno');
  const todayCooked = batches.filter(b => b.status === 'listo' && new Date(b.created_at).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.cooked_quantity, 0);

  return (
    <div className="space-y-5">
      <PageHeader icon={Flame} title="Tandas de producción"
        subtitle="Al iniciar una tanda se descuentan los insumos de la receta (pollo crudo, adobo…). Al cerrarla, los pollos cocidos pasan a stock terminado. La venta sólo descuenta stock terminado."
        actions={<Button variant="primary" onClick={() => setStarting(true)}><Plus className="w-4 h-4" /> Iniciar tanda</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pollo crudo disponible" value={rawChicken ? `${rawChicken.current_stock} u.` : '—'} icon={Drumstick} tone={rawChicken && rawChicken.current_stock <= rawChicken.min_stock ? 'amber' : 'default'} hint="Insumo (no se vende)" />
        <StatCard label="Pollos cocidos para vender" value={spiedo ? `${spiedo.current_stock} u.` : '—'} icon={Flame} tone="fire" hint="Stock terminado; medio pollo = 0,5" />
        <StatCard label="En horno ahora" value={inOven.reduce((a, b) => a + b.raw_chicken_quantity, 0)} icon={Timer} tone="amber" hint={`${inOven.length} tanda(s)`} />
        <StatCard label="Cocinados hoy" value={todayCooked} icon={CheckCircle2} tone="green" />
      </div>

      {inOven.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {inOven.map(b => {
            const start = new Date(b.start_time).getTime();
            const end = b.estimated_end_time ? new Date(b.estimated_end_time).getTime() : start + 80 * 60000;
            const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
            const remaining = Math.round((end - now) / 60000);
            return (
              <div key={b.id} className="rounded-2xl border border-fire-500/30 bg-gradient-to-br from-fire-500/10 to-transparent p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-black text-white">{b.batch_number}</p>
                    <p className="text-[11px] text-charcoal-400">{b.raw_chicken_quantity} pollos · {b.operator_name}</p>
                  </div>
                  <Badge tone={remaining <= 0 ? 'green' : 'amber'}>{remaining <= 0 ? 'Tiempo cumplido' : `Faltan ${remaining} min`}</Badge>
                </div>
                <div className="h-2 rounded-full bg-charcoal-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-fire-500 transition-all" style={{ width: `${pct}%` }} /></div>
                <p className="text-[11px] text-charcoal-400">Inicio {formatTimeAR(b.start_time)} · Fin estimado {formatTimeAR(b.estimated_end_time)}</p>
                <div className="flex gap-2">
                  <Button variant="success" className="flex-1" onClick={() => { setClosing(b); setCooked(b.raw_chicken_quantity); }}><CheckCircle2 className="w-3.5 h-3.5" /> Cerrar tanda</Button>
                  <Button variant="ghost" className="text-red-300" onClick={() => { setCancelling(b); setReason(''); }}><XCircle className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card title="Historial de tandas">
        <Table head={['Tanda', 'Inicio', 'Crudos', 'Cocidos', 'Desperdicio', 'Responsable', 'Estado']}
          empty={<EmptyState icon={Flame} title="Todavía no hay tandas registradas" />}>
          {batches.map(b => (
            <tr key={b.id} className="text-charcoal-200">
              <td className="px-5 py-2.5 font-bold text-white">{b.batch_number}</td>
              <td className="px-5 py-2.5 whitespace-nowrap">{formatDateTimeAR(b.start_time)}</td>
              <td className="px-5 py-2.5 tabular-nums">{b.raw_chicken_quantity}</td>
              <td className="px-5 py-2.5 tabular-nums">{b.status === 'listo' ? b.cooked_quantity : '—'}</td>
              <td className="px-5 py-2.5 tabular-nums">{b.status === 'en_horno' ? '—' : b.waste_quantity}</td>
              <td className="px-5 py-2.5">{b.operator_name}</td>
              <td className="px-5 py-2.5"><Badge tone={b.status === 'listo' ? 'green' : b.status === 'en_horno' ? 'amber' : 'red'}>{b.status === 'en_horno' ? 'En horno' : b.status === 'listo' ? 'Lista' : 'Cancelada'}</Badge></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={starting} onClose={() => setStarting(false)} title="Iniciar tanda de pollos al spiedo"
        footer={<>
          <Button variant="ghost" onClick={() => setStarting(false)}>Cancelar</Button>
          <Button variant="primary" onClick={() => { if (run(() => PolleriaStore.startBatch({ raw_quantity: form.raw, minutes: form.minutes, operator_name: form.operator, notes: form.notes }), 'Tanda iniciada: insumos descontados')) setStarting(false); }}>Iniciar</Button>
        </>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pollos crudos a hornear" hint={`Disponibles: ${rawChicken?.current_stock ?? 0}`}><input type="number" min={1} value={form.raw} onChange={e => setForm({ ...form, raw: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} className={inputCls} /></Field>
          <Field label="Tiempo de cocción (min)"><input type="number" min={10} value={form.minutes} onChange={e => setForm({ ...form, minutes: Math.max(10, Number(e.target.value) || 80) })} className={inputCls} /></Field>
          <Field label="Responsable"><input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} className={inputCls} /></Field>
          <Field label="Notas"><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></Field>
        </div>
        {recipe && (
          <div className="mt-4 rounded-xl bg-charcoal-950 border border-charcoal-800 p-3">
            <p className="text-[11px] font-bold text-charcoal-300 mb-2">Se descontará del inventario:</p>
            <ul className="text-xs space-y-1">
              {recipe.items.map(it => {
                const ing = ingredients.find(i => i.id === it.ingredient_id);
                const qty = Math.round(it.quantity * form.raw * (1 + it.waste_percentage / 100) * 1000) / 1000;
                const short = ing && ing.current_stock < qty;
                return <li key={it.id} className={`flex justify-between ${short ? 'text-red-300' : 'text-charcoal-200'}`}><span>{ing?.name ?? it.ingredient_id}</span><span className="tabular-nums">{qty} {it.unit_measure}{short ? ` (hay ${ing?.current_stock})` : ''}</span></li>;
              })}
            </ul>
          </div>
        )}
      </Modal>

      <Modal open={!!closing} onClose={() => setClosing(null)} title={`Cerrar ${closing?.batch_number ?? ''}`} size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setClosing(null)}>Volver</Button>
          <Button variant="success" onClick={() => { if (closing && run(() => PolleriaStore.markBatchReady(closing.id, cooked), `${cooked} pollos sumados al stock`)) setClosing(null); }}>Confirmar</Button>
        </>}>
        <Field label="Pollos cocidos en condiciones de venta" hint={`Entraron ${closing?.raw_chicken_quantity ?? 0}. La diferencia se registra como desperdicio.`}>
          <input type="number" min={0} max={closing?.raw_chicken_quantity} value={cooked} onChange={e => setCooked(Math.floor(Number(e.target.value) || 0))} className={inputCls} />
        </Field>
      </Modal>

      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title={`Cancelar ${cancelling?.batch_number ?? ''}`} size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setCancelling(null)}>Volver</Button>
          <Button variant="danger" disabled={!reason.trim()} onClick={() => { if (cancelling && run(() => PolleriaStore.cancelBatch(cancelling.id, reason), 'Tanda cancelada')) setCancelling(null); }}>Cancelar tanda</Button>
        </>}>
        <p className="text-xs text-charcoal-300 mb-3">Los insumos ya consumidos no vuelven al stock: toda la tanda se registra como desperdicio.</p>
        <Field label="Motivo"><textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className={inputCls} /></Field>
      </Modal>
    </div>
  );
};
