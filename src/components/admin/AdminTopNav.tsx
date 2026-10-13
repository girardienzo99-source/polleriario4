'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, Clock, Store, Bell, Wallet, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PolleriaStore } from '@/lib/data/storage';
import { canAccess, ModuleId } from '@/lib/domain/permissions';
import { useStoreValue, useNow, toast } from './ui';

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
  const orders = useStoreValue(() => PolleriaStore.getOrders(), []);
  const cashOpen = useStoreValue(() => PolleriaStore.isCashOpen(), false);

  const newOrders = orders.filter(o => o.status === 'recibido');
  const active = orders.filter(o => ['recibido', 'confirmado', 'en_preparacion'].includes(o.status));

  // Aviso de pedido nuevo (llega desde la tienda en otra pestaña vía evento storage)
  const prevNew = useRef<number | null>(null);
  useEffect(() => {
    if (prevNew.current !== null && newOrders.length > prevNew.current) {
      beep();
      toast(`Nuevo pedido recibido: ${newOrders[0]?.order_number ?? ''}`, 'info');
    }
    prevNew.current = newOrders.length;
  }, [newOrders.length, newOrders]);

  const clock = new Date(now).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Cordoba', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-charcoal-950/80 backdrop-blur-xl border-b border-charcoal-800 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onOpenMobileSidebar} aria-label="Abrir menú" className="lg:hidden p-2 rounded-xl bg-charcoal-800 text-charcoal-300 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <Store className="w-4 h-4 text-fire-500" />
          <span className="text-xs font-bold text-white">Pollería Los Campeones</span>
          <span className="text-[10px] bg-charcoal-800 text-charcoal-400 px-2 py-0.5 rounded-full">Casa central · Río Cuarto</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-charcoal-400 font-medium tabular-nums" suppressHydrationWarning>
          <Clock className="w-3.5 h-3.5 text-fire-500" />
          <span>{clock}</span>
        </div>

        {canAccess(role, 'cash') && (
          <button
            onClick={() => onNavigateToTab('cash')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
              cashOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Caja {cashOpen ? 'abierta' : 'cerrada'}</span>
          </button>
        )}

        {canAccess(role, 'kitchen') && (
          <button
            onClick={() => onNavigateToTab('kitchen')}
            className="relative flex items-center gap-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-charcoal-700"
            aria-label={`${active.length} pedidos activos`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Cocina</span>
            <span className={`px-1.5 rounded-full font-black text-[11px] ${newOrders.length > 0 ? 'bg-fire-600 text-white animate-pulse' : 'bg-charcoal-700 text-charcoal-300'}`}>
              {active.length}
            </span>
          </button>
        )}

        <Link href="/" target="_blank" className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold transition">
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ver tienda</span>
        </Link>
      </div>
    </header>
  );
};
