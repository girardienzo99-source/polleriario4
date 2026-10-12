'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar, AdminTab } from '@/components/admin/AdminSidebar';
import { AdminTopNav } from '@/components/admin/AdminTopNav';
import { ThermalModal } from '@/components/admin/ThermalModal';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';

// Views
import { DashboardView } from '@/components/admin/views/DashboardView';
import { PosView } from '@/components/admin/views/PosView';
import { OrdersView } from '@/components/admin/views/OrdersView';
import { KitchenKdsView } from '@/components/admin/views/KitchenKdsView';
import { ProductionBatchesView } from '@/components/admin/views/ProductionBatchesView';
import { ProductsView } from '@/components/admin/views/ProductsView';
import { StockView } from '@/components/admin/views/StockView';
import { RecipesView } from '@/components/admin/views/RecipesView';
import { PricesView } from '@/components/admin/views/PricesView';
import { PromotionsView } from '@/components/admin/views/PromotionsView';
import { CashRegisterView } from '@/components/admin/views/CashRegisterView';
import { CustomersView } from '@/components/admin/views/CustomersView';
import { PurchasesView } from '@/components/admin/views/PurchasesView';
import { ExpensesView } from '@/components/admin/views/ExpensesView';
import { ArcaFiscalView } from '@/components/admin/views/ArcaFiscalView';
import { ReportsView } from '@/components/admin/views/ReportsView';
import { SettingsView } from '@/components/admin/views/SettingsView';

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, role } = useAuth();

  const tabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam || 'dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<ThermalReceiptProps | null>(null);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`, { scroll: false });
  };

  const handlePrintTicket = (props: ThermalReceiptProps) => {
    setReceiptToPrint(props);
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <AdminTopNav
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateToTab={handleSelectTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={handleSelectTab} />}
          {activeTab === 'pos' && <PosView onPrintTicket={handlePrintTicket} />}
          {activeTab === 'orders' && <OrdersView onPrintTicket={handlePrintTicket} />}
          {activeTab === 'kitchen' && <KitchenKdsView />}
          {activeTab === 'production' && <ProductionBatchesView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'stock' && <StockView />}
          {activeTab === 'recipes' && <RecipesView />}
          {activeTab === 'prices' && <PricesView />}
          {activeTab === 'promotions' && <PromotionsView />}
          {activeTab === 'cash' && <CashRegisterView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'arca' && <ArcaFiscalView onPrintTicket={handlePrintTicket} />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Thermal Ticket Printer Modal */}
      <ThermalModal
        receiptProps={receiptToPrint}
        onClose={() => setReceiptToPrint(null)}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-charcoal-950 flex items-center justify-center text-white text-sm font-bold">
        Cargando sistema administrativo...
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}
