'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Menu, Clock, Store, Bell, Wallet, ExternalLink, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PolleriaStore } from '@/lib/data/storage';
import { canAccess, ModuleId } from '@/lib/domain/permissions';
import { formatARS } from '@/lib/formatters';
import { useStoreVersion, useNow, toast } from './ui';

interface AdminTopNavProps {
  onOpenMobileSidebar: () => void;
  onNavigateToTab: (tab: ModuleId) => void;
}

/** Aviso sonoro corto (Web Audio, sin archivos externos). */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {
    /* el navegador puede bloquear audio sin interacción previa */
  }
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({ onOpenMobileSidebar, onNavigateToTab }) => {
  const { role } = useAuth();
  const now = useNow(30_000);
  const v = useStoreVersion();

  const { newOrdersCount, latestNewOrderNumber, activeCount, lowStockCount, salesCount, salesTotal, cashOpen } = useMemo(() => {
    const orders = PolleriaStore.getOrders();
    const sales = PolleriaStore.getSales();
    const products = PolleriaStore.getProducts();
    const ingredients = PolleriaStore.getIngredients();
    const cashOpen = PolleriaStore.isCashOpen();

    const newOrders = orders.filter(o => o.status === 'recibido');
    const active = orders.filter(o => ['recibido', 'confirmado', 'en_preparacion'].includes(o.status));
    const lowStockCount =
      products.filter(p => p.active && p.stock_mode !== 'none' && p.current_stock <= p.min_stock).length +
      ingredients.filter(i => i.current_stock <= i.min_stock).length;
    const salesTotal = sales.reduce((acc, s) => acc + s.total, 0);

    return {
      newOrdersCount: newOrders.length,
      latestNewOrderNumber: newOrders[0]?.order_number ?? '',
      activeCount: active.length,
      lowStockCount,
      salesCount: sales.length,
      salesTotal,
      cashOpen,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  // Aviso de pedido nuevo (llega desde la tienda en otra pestaña vía evento storage)
  const prevNew = useRef<number | null>(null);
  useEffect(() => {
    if (prevNew.current !== null && newOrdersCount > prevNew.current) {
      beep();
      toast(`Nuevo pedido recibido: ${latestNewOrderNumber}`, 'info');
    }
    prevNew.current = newOrdersCount;
  }, [newOrdersCount, latestNewOrderNumber]);

  const clock = new Date(now).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Cordoba', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-charcoal-950/85 backdrop-blur-xl border-b border-charcoal-800 px-3 sm:px-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button type="button" onClick={onOpenMobileSidebar} aria-label="Abrir menú" className="lg:hidden p-2 rounded-xl bg-charcoal-800 text-charcoal-300 hover:text-white shrink-0">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Store className="w-4 h-4 text-fire-500 shrink-0" />
          <span className="text-xs font-bold text-white truncate">Los Campeones</span>
          <span className="hidden md:inline-block text-[10px] bg-charcoal-800 text-charcoal-400 px-2 py-0.5 rounded-full shrink-0">Casa central · Río Cuarto</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-charcoal-400 font-medium tabular-nums" suppressHydrationWarning>
          <Clock className="w-3.5 h-3.5 text-fire-500" />
          <span>{clock}</span>
        </div>

        {canAccess(role, 'pos') && salesCount > 0 && (
          <button
            type="button"
            onClick={() => onNavigateToTab('pos')}
            title="Ventas registradas"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-charcoal-900 border border-charcoal-800 text-charcoal-200 hover:border-charcoal-700 transition tabular-nums"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{salesCount} vta{salesCount === 1 ? '' : 's'} · {formatARS(salesTotal)}</span>
          </button>
        )}

        {canAccess(role, 'stock') && lowStockCount > 0 && (
          <button
            type="button"
            onClick={() => onNavigateToTab('stock')}
            title={`${lowStockCount} ítems con stock bajo o crítico`}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Stock bajo</span>
            <span className="px-1.5 rounded-full bg-amber-500/20 text-amber-200 font-black text-[11px]">{lowStockCount}</span>
          </button>
        )}

        {canAccess(role, 'cash') && (
          <button
            type="button"
            onClick={() => onNavigateToTab('cash')}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
              cashOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Caja</span>
            <span>{cashOpen ? 'abierta' : 'cerrada'}</span>
          </button>
        )}

        {canAccess(role, 'kitchen') && (
          <button
            type="button"
            onClick={() => onNavigateToTab('kitchen')}
            className="relative flex items-center gap-1 sm:gap-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition border border-charcoal-700"
            aria-label={`${activeCount} pedidos activos`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Cocina</span>
            <span className={`px-1.5 rounded-full font-black text-[11px] ${newOrdersCount > 0 ? 'bg-fire-600 text-white animate-pulse' : 'bg-charcoal-700 text-charcoal-300'}`}>
              {activeCount}
            </span>
          </button>
        )}

        <Link href="/" title="Ver tienda pública" className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold transition">
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tienda</span>
        </Link>
      </div>
    </header>
  );
};
