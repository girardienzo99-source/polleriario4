'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Play, 
  AlertTriangle, 
  Flame, 
  Store, 
  Bike, 
  RefreshCw 
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';

export const KitchenKdsView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = () => {
    // Only show active kitchen orders: recibido or en_preparacion
    const all = PolleriaStore.getOrders();
    const kitchenActive = all.filter(o => o.status === 'recibido' || o.status === 'en_preparacion');
    setOrders(kitchenActive);
  };

  useEffect(() => {
    loadOrders();
    window.addEventListener('polleria_store_updated', loadOrders);
    const interval = setInterval(loadOrders, 10000); // 10s auto-refresh for kitchen tablet
    return () => {
      window.removeEventListener('polleria_store_updated', loadOrders);
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    PolleriaStore.updateOrderStatus(orderId, status);
    loadOrders();
  };

  const getElapsedTimeMinutes = (createdDate: string) => {
    const diffMs = Date.now() - new Date(createdDate).getTime();
    return Math.floor(diffMs / (1000 * 60));
  };

  return (
    <div className="space-y-6">
      {/* KDS Header */}
      <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-fire-500" />
            Pantalla KDS de Cocina y Spiedo
          </h1>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Optimizado para tablets y monitores en el sector de elaboración
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white bg-fire-600/20 text-fire-400 border border-fire-500/30 px-3 py-1.5 rounded-xl">
            {orders.length} pedidos en marcha
          </span>

          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Grid of Kitchen Ticket Cards */}
      {orders.length === 0 ? (
        <div className="text-center py-24 bg-charcoal-900 rounded-3xl border border-charcoal-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-white">¡Cocina al día!</h3>
          <p className="text-xs text-charcoal-400">
            No hay comandas pendientes de elaboración en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {orders.map(ord => {
            const elapsed = getElapsedTimeMinutes(ord.created_at);
            const isLate = elapsed >= 30;
            const isCaution = elapsed >= 18 && elapsed < 30;

            return (
              <div
                key={ord.id}
                className={`bg-charcoal-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition ${
                  isLate
                    ? 'border-red-500 shadow-glow-lg'
                    : isCaution
                    ? 'border-amberGold-500/70'
                    : 'border-charcoal-800'
                }`}
              >
                {/* Card Header */}
                <div className={`p-4 border-b flex justify-between items-center ${
                  isLate
                    ? 'bg-red-950/40 border-red-500/50'
                    : isCaution
                    ? 'bg-amberGold-950/30 border-amberGold-500/30'
                    : 'bg-charcoal-950 border-charcoal-800'
                }`}>
                  <div>
                    <span className="text-2xl font-black text-white tracking-tight">
                      {ord.order_number}
                    </span>
                    <span className="block text-[11px] text-charcoal-300 font-bold mt-0.5">
                      {ord.customer_name}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className={`flex items-center gap-1 font-black text-sm px-2 py-0.5 rounded-lg ${
                      isLate
                        ? 'bg-red-600 text-white animate-pulse'
                        : isCaution
                        ? 'bg-amberGold-600 text-charcoal-950'
                        : 'bg-charcoal-800 text-charcoal-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {elapsed} min
                    </div>
                    <span className="text-[10px] text-charcoal-400 font-semibold block mt-1">
                      {ord.delivery_type === 'delivery' ? '🛵 DELIVERY' : '🏪 RETIRO LOCAL'}
                    </span>
                  </div>
                </div>

                {/* Items in preparation */}
                <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-80">
                  <div className="space-y-2">
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-charcoal-950 p-3 rounded-2xl border border-charcoal-800/80 flex items-start gap-3"
                      >
                        <span className="w-8 h-8 rounded-xl bg-fire-600/20 text-fire-400 font-black text-base flex items-center justify-center shrink-0 border border-fire-500/30">
                          {it.quantity}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-extrabold text-white text-sm">
                            {it.product_name}
                          </h4>
                          {it.notes && (
                            <span className="text-xs text-amberGold-400 font-bold block mt-1 bg-amberGold-500/10 p-1 rounded border border-amberGold-500/20">
                              → {it.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* General order notes */}
                  {ord.notes && (
                    <div className="bg-fire-950/40 p-3 rounded-2xl border border-fire-500/30 text-fire-300 text-xs">
                      <strong className="block text-[10px] text-fire-400 uppercase tracking-wider mb-0.5">
                        Instrucciones de Cocina:
                      </strong>
                      {ord.notes}
                    </div>
                  )}
                </div>

                {/* Status Advancement Action */}
                <div className="p-4 bg-charcoal-950 border-t border-charcoal-800">
                  {ord.status === 'recibido' ? (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'en_preparacion')}
                      className="w-full py-3.5 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-glow flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Iniciar Preparación
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'listo')}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Marcar Pedido Listo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
