'use client';

import React, { useMemo, useState } from 'react';
import { ChefHat, Clock, Bike, Store, Play, CheckCircle2, CheckCheck, Maximize2, Minimize2, Flame } from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatTimeAR } from '@/lib/formatters';
import { delayLevel } from '@/lib/domain/orders';
import { Button, EmptyState, run, useStoreVersion, useNow } from '../ui';

const COLUMNS: { status: OrderStatus[]; title: string; accent: string }[] = [
  { status: ['recibido', 'confirmado'], title: 'Por empezar', accent: 'text-sky-400' },
  { status: ['en_preparacion'], title: 'En preparación', accent: 'text-amber-400' },
  { status: ['listo', 'en_reparto'], title: 'Listos y en entrega', accent: 'text-emerald-400' },
];

function OrderKdsCard({ o, now }: { o: Order; now: number }) {
  const mins = Math.max(0, Math.floor((now - new Date(o.created_at).getTime()) / 60000));
  const d = o.status === 'listo' || o.status === 'en_reparto' ? 'ok' : delayLevel(o.created_at, now);
  return (
    <div className={`rounded-2xl border-2 bg-charcoal-900 p-4 space-y-3 ${d === 'late' ? 'border-red-500 shadow-[0_0_24px_-6px_rgba(239,68,68,.6)]' : d === 'warn' ? 'border-amber-500/70' : 'border-charcoal-800'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-black text-white leading-none">{o.order_number.replace('#POL-', '#')}</p>
          <p className="text-[11px] text-charcoal-400 mt-1 flex items-center gap-1">
            {o.delivery_type === 'delivery' ? <><Bike className="w-3 h-3 text-sky-400" /> Envío</> : <><Store className="w-3 h-3 text-amber-400" /> Retiro</>} · {o.customer_name.split(' ')[0]}
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

      {o.status === 'recibido' || o.status === 'confirmado' ? (
        <Button type="button" variant="primary" className="w-full py-3 text-sm" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'en_preparacion'), `${o.order_number} en preparación`)}>
          <Play className="w-4 h-4" /> Iniciar preparación
        </Button>
      ) : o.status === 'en_preparacion' ? (
        <Button type="button" variant="success" className="w-full py-3 text-sm" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'listo'), `${o.order_number} listo`)}>
          <CheckCircle2 className="w-4 h-4" /> Marcar listo
        </Button>
      ) : o.status === 'listo' ? (
        o.delivery_type === 'delivery' ? (
          <div className="space-y-2">
            <p className="text-center text-xs font-bold text-emerald-400 py-0.5">Listo · Esperando repartidor</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" className="py-2.5 text-xs font-bold" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'en_reparto'), `${o.order_number} en reparto`)}>
                <Bike className="w-3.5 h-3.5 text-sky-400" /> Despachar
              </Button>
              <Button type="button" variant="ghost" className="py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'entregado'), `${o.order_number} entregado`)}>
                <CheckCheck className="w-3.5 h-3.5" /> Entregar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-xs font-bold text-emerald-400 py-0.5">Listo · Esperando retiro</p>
            <Button type="button" variant="success" className="w-full py-2.5 text-xs font-bold" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'entregado'), `${o.order_number} entregado`)}>
              <CheckCheck className="w-4 h-4" /> Entregar al cliente
            </Button>
          </div>
        )
      ) : o.status === 'en_reparto' ? (
        <div className="space-y-2">
          <p className="text-center text-xs font-bold text-sky-400 py-0.5 flex items-center justify-center gap-1.5">
            <Bike className="w-3.5 h-3.5" /> En viaje con repartidor
          </p>
          <Button type="button" variant="success" className="w-full py-2.5 text-xs font-bold" onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, 'entregado'), `${o.order_number} entregado al cliente`)}>
            <CheckCheck className="w-4 h-4" /> Confirmar entrega
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export const KitchenKdsView: React.FC = () => {
  const v = useStoreVersion();
  const now = useNow(15_000);
  const [full, setFull] = useState(false);
  const [filter, setFilter] = useState<'all' | 'retiro' | 'delivery'>('all');
  const [mobileStage, setMobileStage] = useState<number | 'all'>('all');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { allOrders, spiedo } = useMemo(() => ({
    allOrders: PolleriaStore.getOrders().filter(o => ['recibido', 'confirmado', 'en_preparacion', 'listo', 'en_reparto'].includes(o.status)).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    spiedo: PolleriaStore.getProducts().find(p => p.id === 'prod-spiedo-entero'),
  }), [v]);

  const orders = useMemo(() => {
    return allOrders.filter(o => filter === 'all' || o.delivery_type === filter);
  }, [allOrders, filter]);

  const toggleFull = async () => {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); setFull(true); }
      else { await document.exitFullscreen(); setFull(false); }
    } catch { /* algunos navegadores lo bloquean */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fire-500/10 border border-fire-500/20 flex items-center justify-center text-fire-400"><ChefHat className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-white">Cocina</h1>
            <p className="text-xs text-charcoal-400">Amarillo: +15 min · Rojo: +30 min. Se actualiza en tiempo real.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {spiedo && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-700 bg-charcoal-900 px-3 py-2 text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-fire-400" /> Spiedo listo: <span className={spiedo.current_stock <= spiedo.min_stock ? 'text-amber-400' : 'text-emerald-400'}>{spiedo.current_stock}</span>
            </span>
          )}
          <Button type="button" onClick={toggleFull} className="hidden sm:inline-flex">{full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />} Pantalla completa</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="no-scrollbar flex overflow-x-auto rounded-xl bg-charcoal-900 border border-charcoal-800 p-1">
          {[
            { id: 'all' as const, label: `Todos (${allOrders.length})` },
            { id: 'retiro' as const, label: `Mostrador (${allOrders.filter(o => o.delivery_type === 'retiro').length})` },
            { id: 'delivery' as const, label: `Delivery (${allOrders.filter(o => o.delivery_type === 'delivery').length})` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filter === f.id ? 'bg-fire-600 text-white' : 'text-charcoal-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Selector de etapa para móviles */}
        <div className="no-scrollbar flex overflow-x-auto rounded-xl bg-charcoal-900 border border-charcoal-800 p-1 md:hidden">
          <button
            type="button"
            onClick={() => setMobileStage('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
              mobileStage === 'all' ? 'bg-charcoal-700 text-white' : 'text-charcoal-400'
            }`}
          >
            3 etapas
          </button>
          {COLUMNS.map((col, idx) => {
            const count = orders.filter(o => col.status.includes(o.status)).length;
            return (
              <button
                key={col.title}
                type="button"
                onClick={() => setMobileStage(idx)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                  mobileStage === idx ? 'bg-fire-600 text-white' : 'text-charcoal-400'
                }`}
              >
                {col.title.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col, idx) => {
          const list = orders.filter(o => col.status.includes(o.status));
          const hiddenOnMobile = mobileStage !== 'all' && mobileStage !== idx;
          return (
            <section
              key={col.title}
              className={`rounded-2xl bg-charcoal-950/60 border border-charcoal-800 p-3 min-h-[220px] md:min-h-[300px] ${
                hiddenOnMobile ? 'hidden md:block' : 'block'
              }`}
            >
              <h2 className={`text-xs font-black uppercase tracking-wider mb-3 px-1 flex justify-between ${col.accent}`}>{col.title}<span className="text-charcoal-400">{list.length}</span></h2>
              <div className="space-y-3">
                {list.length ? list.map(o => <OrderKdsCard key={o.id} o={o} now={now} />) : <EmptyState title="Sin pedidos" />}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
