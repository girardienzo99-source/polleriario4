'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Store, 
  ChefHat, 
  Package, 
  Boxes, 
  DollarSign, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut, 
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccess, ROLE_LABELS, ModuleId } from '@/lib/domain/permissions';

export type AdminTab = ModuleId;

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, role, logout, mode } = useAuth();

  const allItems: Array<{ id: AdminTab; label: string; shortLabel: string; icon: React.ElementType; badge?: string }> = [
    { id: 'pos', label: 'Punto de venta', shortLabel: 'POS', icon: Store },
    { id: 'kitchen', label: 'Cocina', shortLabel: 'Cocina', icon: ChefHat },
    { id: 'products', label: 'Productos', shortLabel: 'Productos', icon: Package },
    { id: 'stock', label: 'Stock e insumos', shortLabel: 'Stock', icon: Boxes },
    { id: 'prices', label: 'Precios', shortLabel: 'Precios', icon: DollarSign },
    { id: 'cash', label: 'Caja', shortLabel: 'Caja', icon: Wallet },
    { id: 'arca', label: 'Facturación ARCA', shortLabel: 'ARCA', icon: FileText, badge: 'Simulador' },
    { id: 'settings', label: 'Configuración', shortLabel: 'Config', icon: Settings },
  ];
  const menuItems = allItems.filter(i => canAccess(role, i.id));

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 bg-charcoal-900 border-r border-charcoal-800 flex flex-col justify-between transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="min-h-0 flex-1 flex flex-col">
          <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
            <Link href="/admin" onClick={onCloseMobile} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fire-500 to-crimson-600 flex items-center justify-center text-white shadow-glow">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-sm text-white tracking-tight uppercase">
                  Pollería <span className="text-fire-500">PRO</span>
                </span>
                <span className="block text-[10px] text-charcoal-400 font-medium">Gestión Gastronómica</span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/"
                title="Ir a la tienda pública"
                className="text-charcoal-400 hover:text-white p-1.5 rounded-lg hover:bg-charcoal-800 transition"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Cerrar menú"
                className="lg:hidden text-charcoal-400 hover:text-white p-1.5 rounded-lg hover:bg-charcoal-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 text-xs font-semibold">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                    isActive
                      ? 'bg-fire-600 text-white font-bold shadow-glow'
                      : 'text-charcoal-300 hover:bg-charcoal-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-charcoal-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide ${
                      isActive ? 'bg-white/20 text-white' : 'bg-charcoal-800 text-fire-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-charcoal-800 bg-charcoal-950/60 space-y-2">
          <Link
            href="/"
            className="flex lg:hidden items-center justify-center gap-2 w-full rounded-xl border border-charcoal-800 bg-charcoal-900 px-3 py-2 text-xs font-bold text-charcoal-200 hover:text-white transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-fire-400" />
            Volver a la tienda pública
          </Link>
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Usuario'}</p>
              <span className="text-[10px] text-fire-400 uppercase font-semibold block tracking-wider">
                {role ? ROLE_LABELS[role] : ''}{mode === 'demo' ? ' · demo' : ''}
              </span>
            </div>
            <button
              onClick={() => { void logout(); }}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-2 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Barra inferior de acceso rápido en teléfonos y tablets */}
      <nav
        aria-label="Navegación rápida de módulos"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-charcoal-800 bg-charcoal-950/95 backdrop-blur-xl lg:hidden"
      >
        <div className="no-scrollbar flex items-center justify-around gap-1 overflow-x-auto px-2 py-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-w-[60px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${
                  isActive
                    ? 'bg-fire-600/20 text-fire-400 border border-fire-500/30'
                    : 'text-charcoal-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-fire-400' : 'text-charcoal-400'}`} />
                <span className="truncate">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
