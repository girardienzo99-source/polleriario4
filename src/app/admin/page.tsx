'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { AdminTopNav } from '@/components/admin/AdminTopNav';
import { ThermalModal } from '@/components/admin/ThermalModal';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';
import { Toaster } from '@/components/admin/ui';
import { canAccess, defaultModule, ALL_MODULES } from '@/lib/domain/permissions';
import { PolleriaStore } from '@/lib/data/storage';

// Views
import { PosView } from '@/components/admin/views/PosView';
import { KitchenKdsView } from '@/components/admin/views/KitchenKdsView';
import { ProductsView } from '@/components/admin/views/ProductsView';
import { StockView } from '@/components/admin/views/StockView';
import { PricesView } from '@/components/admin/views/PricesView';
import { CashRegisterView } from '@/components/admin/views/CashRegisterView';
import { ArcaFiscalView } from '@/components/admin/views/ArcaFiscalView';
import { SettingsView } from '@/components/admin/views/SettingsView';

function FullScreenLoader({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-charcoal-950 flex items-center justify-center gap-2 text-charcoal-300 text-sm font-semibold">
      <Loader2 className="w-4 h-4 animate-spin text-fire-500" /> {text}
    </div>
  );
}

class AdminModuleErrorBoundary extends React.Component<
  { moduleKey: string; children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { moduleKey: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Error inesperado al cargar el módulo.',
    };
  }

  componentDidUpdate(prevProps: { moduleKey: string }) {
    if (prevProps.moduleKey !== this.props.moduleKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-charcoal-900 p-6 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">No se pudo mostrar este módulo</h2>
            <p className="text-xs text-charcoal-400 mt-1">{this.state.message}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 rounded-xl bg-fire-600 hover:bg-fire-500 text-white text-xs font-black transition"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => {
                PolleriaStore.resetToDemo();
                this.setState({ hasError: false, message: '' });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-xs font-bold border border-charcoal-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar datos demo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function isValidModule(val: string | null): val is AdminTab {
  return Boolean(val && (ALL_MODULES as readonly string[]).includes(val));
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady, role } = useAuth();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<AdminTab>(() => (isValidModule(tabParam) ? tabParam : 'pos'));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<ThermalReceiptProps | null>(null);

  // Protección de ruta: sin sesión → /login
  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace('/login');
  }, [isReady, isAuthenticated, router]);

  // Sincronizar cuando cambia el parámetro ?tab= externo o el rol del usuario
  useEffect(() => {
    if (!role) return;
    if (isValidModule(tabParam) && canAccess(role, tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(prev => (canAccess(role, prev) ? prev : defaultModule(role)));
    }
  }, [tabParam, role]);

  // Sincronizar con botones Atrás/Adelante del navegador
  useEffect(() => {
    if (!role) return;
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (isValidModule(p) && canAccess(role, p)) {
        setActiveTab(p);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [role]);

  const handleSelectTab = useCallback(
    (tab: AdminTab) => {
      if (!role || !canAccess(role, tab)) return;
      setActiveTab(tab);
      setIsMobileSidebarOpen(false);
      if (typeof window !== 'undefined') {
        const nextUrl = `/admin?tab=${tab}`;
        if (window.location.search !== `?tab=${tab}`) {
          window.history.replaceState(null, '', nextUrl);
        }
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    },
    [role],
  );

  // Atajos de teclado Alt+1 .. Alt+8 para cambiar rápido de módulo
  useEffect(() => {
    if (!role) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < ALL_MODULES.length) {
        const mod = ALL_MODULES[idx];
        if (canAccess(role, mod)) {
          e.preventDefault();
          handleSelectTab(mod);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [role, handleSelectTab]);

  if (!isReady || !isAuthenticated || !role) return <FullScreenLoader text="Verificando sesión…" />;

  const currentTab = canAccess(role, activeTab) ? activeTab : defaultModule(role);

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex">
      <AdminSidebar
        activeTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminTopNav onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} onNavigateToTab={handleSelectTab} />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
          <AdminModuleErrorBoundary moduleKey={currentTab}>
            {currentTab === 'pos' && <PosView onPrintTicket={setReceiptToPrint} />}
            {currentTab === 'kitchen' && <KitchenKdsView />}
            {currentTab === 'products' && <ProductsView />}
            {currentTab === 'stock' && <StockView />}
            {currentTab === 'prices' && <PricesView />}
            {currentTab === 'cash' && <CashRegisterView />}
            {currentTab === 'arca' && <ArcaFiscalView onPrintTicket={setReceiptToPrint} />}
            {currentTab === 'settings' && <SettingsView />}
          </AdminModuleErrorBoundary>
        </main>
      </div>

      <ThermalModal receiptProps={receiptToPrint} onClose={() => setReceiptToPrint(null)} />
      <Toaster />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<FullScreenLoader text="Cargando sistema…" />}>
      <AdminContent />
    </Suspense>
  );
}
