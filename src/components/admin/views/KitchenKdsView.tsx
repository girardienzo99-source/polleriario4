'use client';

import React, { useMemo, useState } from 'react';
import { ChefHat, Clock, Bike, Store, Play, CheckCircle2, Maximize2, Minimize2, Flame } from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatTimeAR } from '@/lib/formatters';
import { delayLevel } from '@/lib/domain/orders';
import { Button, EmptyState, run, useStoreVersion, useNow } from '../ui';

const COLUMNS: { status: OrderStatus[]; title: string; accent: string }[] = [
  { status: ['recibido', 'confirmado'], title: 'Por empezar', accent: 'text-sky-400' },
  { status: ['en_preparacion'], title: 'En preparación', accent: 'text-amber-400' },
  { status: ['listo'], title: 'Listos para entregar', accent: 'text-emerald-400' },
];

export const KitchenKdsView: React.FC = () => {
  const v = useStoreVersion();
  const now = useNow(15_000);
  const [full, setFull] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { orders, spiedo } = useMemo(() => ({
    orders: PolleriaStore.getOrders().filter(o => ['recibido', 'confirmado', 'en_preparacion', 'listo'].includes(o.status)).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    spiedo: PolleriaStore.getProducts().find(p => p.id === 'prod-spiedo-entero'),
  }), [v]);

  const toggleFull = async () => {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); setFull(true); }
      else { await document.exitFullscreen(); setFull(false); }
    } catch { /* algunos navegadores lo bloquean */ }
  };

  const Card = ({ o }: { o: Order }) => {
    const mins = Math.floor((now - new Date(o.created_at).getTime()) / 60000);
    const d = o.status === 'listo' ? 'ok' : delayLevel(o.created_at, now);
    return (
      <div className={`rounded-2xl border-2 bg-charcoal-900 p-4 space-y-3 ${d === 'late' ? 'border-red-500 shadow-[0_0_24px_-6px_rgba(239,68,68,.6)]' : d === 'warn' ? 'border-amber-500/70' : 'border-charcoal-800'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-black text-white leading-none">{o.order_number.replace('#POL-', '#')}</p>
            <p className="text-[11px] text-charcoal-400 mt-1 flex items-center gap-1">
              {o.delivery_type === 'delivery' ? <><Bike className="w-3 h-3" /> Envío</> : <><Store className="w-3 h-3" /> Retiro</>} · {o.customer_name.split(' ')[0]}
            </p>
          </div>
          <div className={`text-right ${d === 'late' ? 'text-red-400' : d === 'warn' ? 'text-amber-400' : 'text-charcoal-300'}`}>
            <p className="text-xl font-black tabular-nums flex items-center gap-1 justify-end"><Clock className="w-4 h-4" />{mins}′</p>
            <p className="text-[10px]">Ingresó {formatTimeAR(o.created_at)}</p>
            {o.requested_time && <p className="text-[10px] text-fire-300 font-bold">Para las {o.requested_time}</p>}
          </div>
        </div>
        <ul className="space-y-1.5">
          {o.items.map(i => (
            <li key={i.id} className="text-sm">
              <span className="font-black text-fire-400 mr-1.5">{i.quantity}×</span>
              <span className="text-white font-semibold">{i.product_name}</span>
              {i.notes && <p className="text-xs text-amber-300 ml-6">→ {i.notes}</p>}
            </li>
          ))}
        </ul>
        {o.notes && <p className="text-xs text-amber-200 bg-amber-500/10 rounded-lg px-2.5 py-1.5">{o.notes}</p>}
        {o.status !== 'listo' ? (
          o.status === 'en_preparacion' ? (
            <Button variant="success" className="w-full py-3 text-sm" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'listo'), `${o.order_number} listo`)}><CheckCircle2 className="w-4 h-4" /> Marcar listo</Button>
          ) : (
            <Button variant="primary" className="w-full py-3 text-sm" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'en_preparacion'))}><Play className="w-4 h-4" /> Iniciar preparación</Button>
          )
        ) : (
          <p className="text-center text-xs font-bold text-emerald-400 py-2">Esperando {o.delivery_type === 'delivery' ? 'repartidor' : 'retiro'}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fire-500/10 border border-fire-500/20 flex items-center justify-center text-fire-400"><ChefHat className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-white">Cocina</h1>
            <p className="text-xs text-charcoal-400">Amarillo: +15 min · Rojo: +30 min. Se actualiza solo.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {spiedo && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-700 bg-charcoal-900 px-3 py-2 text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-fire-400" /> Pollos al spiedo listos: <span className={spiedo.current_stock <= spiedo.min_stock ? 'text-amber-400' : 'text-emerald-400'}>{spiedo.current_stock}</span>
            </span>
          )}
          <Button onClick={toggleFull}>{full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />} Pantalla completa</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map(col => {
          const list = orders.filter(o => col.status.includes(o.status));
          return (
            <section key={col.title} className="rounded-2xl bg-charcoal-950/60 border border-charcoal-800 p-3 min-h-[300px]">
              <h2 className={`text-xs font-black uppercase tracking-wider mb-3 px-1 flex justify-between ${col.accent}`}>{col.title}<span className="text-charcoal-400">{list.length}</span></h2>
              <div className="space-y-3">
                {list.length ? list.map(o => <Card key={o.id} o={o} />) : <EmptyState title="Sin pedidos" />}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
