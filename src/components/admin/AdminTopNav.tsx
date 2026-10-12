'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  Clock, 
  Store, 
  Bell, 
  ShieldCheck, 
  Wallet, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PolleriaStore } from '@/lib/data/storage';
import { UserRole } from '@/types/database';

interface AdminTopNavProps {
  onOpenMobileSidebar: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({ 
  onOpenMobileSidebar,
  onNavigateToTab 
}) => {
  const { role, switchRole } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [cashStatus, setCashStatus] = useState<'abierta' | 'cerrada'>('abierta');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateStats = () => {
      const orders = PolleriaStore.getOrders();
      const pending = orders.filter(o => o.status === 'recibido' || o.status === 'en_preparacion');
      setPendingCount(pending.length);

      const cash = PolleriaStore.getCashSession();
      setCashStatus(cash.status);
    };

    updateStats();
    window.addEventListener('polleria_store_updated', updateStats);

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('es-AR', {
          timeZone: 'America/Argentina/Cordoba',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);

    return () => {
      window.removeEventListener('polleria_store_updated', updateStats);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-charcoal-900 border-b border-charcoal-800 px-4 flex items-center justify-between">
      {/* Left items */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-charcoal-800 text-charcoal-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <Store className="w-4 h-4 text-fire-500" />
          <span className="text-xs font-bold text-white">
            Pollería Los Campeones
          </span>
          <span className="text-[10px] bg-charcoal-800 text-charcoal-400 px-2 py-0.5 rounded-full">
            Sucursal Central Río Cuarto
          </span>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        {/* Date Time */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-charcoal-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-fire-500" />
          <span>{currentTime || 'Cargando...'}</span>
        </div>

        {/* Cash Register status pill */}
        <button
          onClick={() => onNavigateToTab('cash')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
            cashStatus === 'abierta'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          }`}
          title="Ver estado de caja"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Caja: {cashStatus === 'abierta' ? 'Abierta' : 'Cerrada'}</span>
        </button>

        {/* Pending Orders Counter */}
        <button
          onClick={() => onNavigateToTab('orders')}
          className="relative flex items-center gap-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 px-3 py-1 rounded-lg text-xs font-bold transition border border-charcoal-700"
          title="Ver pedidos pendientes"
        >
          <Bell className="w-3.5 h-3.5 text-amberGold-400" />
          <span className="hidden sm:inline">Pedidos:</span>
          <span className={`px-1.5 py-0.2 rounded-full font-black text-[11px] ${
            pendingCount > 0 ? 'bg-fire-600 text-white animate-pulse' : 'bg-charcoal-700 text-charcoal-400'
          }`}>
            {pendingCount}
          </span>
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-1 bg-charcoal-950 p-1 rounded-xl border border-charcoal-800 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-fire-500 ml-1.5" />
          <select
            value={role || 'admin'}
            onChange={e => switchRole(e.target.value as UserRole)}
            className="bg-transparent text-charcoal-200 font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value="admin" className="bg-charcoal-900 text-white">Rol: Admin</option>
            <option value="encargado" className="bg-charcoal-900 text-white">Rol: Encargada</option>
            <option value="cajero" className="bg-charcoal-900 text-white">Rol: Cajero</option>
            <option value="cocinero" className="bg-charcoal-900 text-white">Rol: Cocina</option>
            <option value="repartidor" className="bg-charcoal-900 text-white">Rol: Repartidor</option>
          </select>
        </div>

        {/* View Public Store */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Ver Tienda</span>
        </Link>
      </div>
    </header>
  );
};
