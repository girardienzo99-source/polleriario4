'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Flame, 
  LayoutDashboard, 
  Store, 
  ClipboardList, 
  ChefHat, 
  Package, 
  Boxes, 
  BookOpen, 
  DollarSign, 
  Sparkles, 
  Wallet, 
  Users, 
  Truck, 
  Receipt, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccess, ROLE_LABELS } from '@/lib/domain/permissions';

export type AdminTab = 
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'kitchen'
  | 'production'
  | 'products'
  | 'stock'
  | 'recipes'
  | 'prices'
  | 'promotions'
  | 'cash'
  | 'customers'
  | 'purchases'
  | 'expenses'
  | 'arca'
  | 'reports'
  | 'settings';

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

  const allItems: Array<{ id: AdminTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de venta', icon: Store },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'kitchen', label: 'Cocina (KDS)', icon: ChefHat },
    { id: 'production', label: 'Tandas de producción', icon: Flame },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'stock', label: 'Stock e insumos', icon: Boxes },
    { id: 'recipes', label: 'Recetas', icon: BookOpen },
    { id: 'prices', label: 'Precios', icon: DollarSign },
    { id: 'promotions', label: 'Promociones', icon: Sparkles },
    { id: 'cash', label: 'Caja', icon: Wallet },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'purchases', label: 'Compras y proveedores', icon: Truck },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'arca', label: 'Facturación ARCA', icon: FileText, badge: 'Simulador' },
    { id: 'reports', label: 'Informes', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];
  const menuItems = allItems.filter(i => canAccess(role, i.id));

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-charcoal-900 border-r border-charcoal-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
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

            <Link
              href="/"
              target="_blank"
              title="Abrir tienda pública"
              className="text-charcoal-400 hover:text-white p-1 rounded-lg hover:bg-charcoal-800 transition"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] text-xs font-semibold">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
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
        <div className="p-3 border-t border-charcoal-800 bg-charcoal-950/60">
          <div className="flex items-center justify-between px-2 py-1.5 mb-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Usuario'}</p>
              <span className="text-[10px] text-fire-400 uppercase font-semibold block tracking-wider">
                {role ? ROLE_LABELS[role] : ''}{mode === 'demo' ? ' · demo' : ''}
              </span>
            </div>
            <button
              onClick={() => { void logout(); }}
              title="Cerrar sesión"
              className="p-1.5 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
