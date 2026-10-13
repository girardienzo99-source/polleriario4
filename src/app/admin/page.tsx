'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { AdminTopNav } from '@/components/admin/AdminTopNav';
import { ThermalModal } from '@/components/admin/ThermalModal';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';
import { Toaster } from '@/components/admin/ui';
import { canAccess, defaultModule } from '@/lib/domain/permissions';

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

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady, role } = useAuth();

  const tabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || 'pos');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<ThermalReceiptProps | null>(null);

  // Protección de ruta: sin sesión → /login
  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace('/login');
  }, [isReady, isAuthenticated, router]);

  // Sólo módulos permitidos para el rol
  useEffect(() => {
    if (!role) return;
    const wanted = tabParam || activeTab;
    const next = canAccess(role, wanted) ? wanted : defaultModule(role);
    if (next !== activeTab) setActiveTab(next);
  }, [tabParam, role, activeTab]);

  if (!isReady || !isAuthenticated || !role) return <FullScreenLoader text="Verificando sesión…" />;

  const handleSelectTab = (tab: AdminTab) => {
    if (!canAccess(role, tab)) return;
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`, { scroll: false });
  };

  const allowed = canAccess(role, activeTab);

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex">
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminTopNav onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} onNavigateToTab={handleSelectTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {allowed && (
            <>
              {activeTab === 'pos' && <PosView onPrintTicket={setReceiptToPrint} />}
              {activeTab === 'kitchen' && <KitchenKdsView />}
              {activeTab === 'products' && <ProductsView />}
              {activeTab === 'stock' && <StockView />}
              {activeTab === 'prices' && <PricesView />}
              {activeTab === 'cash' && <CashRegisterView />}
              {activeTab === 'arca' && <ArcaFiscalView onPrintTicket={setReceiptToPrint} />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
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
