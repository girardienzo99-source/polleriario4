'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ChefHat, 
  Flame, 
  CreditCard, 
  FileText, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';
import { Order } from '@/types/database';
import { AdminTab } from '../AdminSidebar';

interface DashboardViewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [cashSession, setCashSession] = useState<any>(null);

  useEffect(() => {
    const load = () => {
      setOrders(PolleriaStore.getOrders());
      setIngredients(PolleriaStore.getIngredients());
      setCashSession(PolleriaStore.getCashSession());
    };
    load();
    window.addEventListener('polleria_store_updated', load);
    return () => window.removeEventListener('polleria_store_updated', load);
  }, []);

  // Metrics
  const totalSalesToday = orders.reduce((acc, curr) => acc + (curr.payment_status === 'pagado' ? curr.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'recibido' || o.status === 'en_preparacion');
  const readyOrders = orders.filter(o => o.status === 'listo');
  const deliveredOrders = orders.filter(o => o.status === 'entregado');
  const criticalStockItems = ingredients.filter(i => i.current_stock <= i.min_stock);

  // Weekly Sales Chart Mock
  const chartData = [
    { day: 'Lun', ventas: 185000 },
    { day: 'Mar', ventas: 240000 },
    { day: 'Mié', ventas: 290000 },
    { day: 'Jue', ventas: 310000 },
    { day: 'Vie', ventas: 480000 },
    { day: 'Sáb', ventas: 620000 },
    { day: 'Dom', ventas: 740000 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800">
        <div>
          <h1 className="text-2xl font-black text-white">Panel de Control General</h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Resumen operativo en tiempo real de Pollería Los Campeones • Río Cuarto
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-fire-600 hover:bg-fire-500 text-white rounded-xl text-xs font-black shadow-glow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Venta Mostrador (POS)
          </button>
          <button
            onClick={() => onNavigate('kitchen')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold border border-charcoal-700 transition"
          >
            <ChefHat className="w-4 h-4 text-orange-400" />
            Cocina KDS
          </button>
          <button
            onClick={() => onNavigate('production')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold border border-charcoal-700 transition"
          >
            <Flame className="w-4 h-4 text-fire-500" />
            Tanda Spiedo
          </button>
          <button
            onClick={() => onNavigate('arca')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold border border-charcoal-700 transition"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Facturación ARCA
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales */}
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-2">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-bold">Ventas Totales Hoy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatARS(totalSalesToday)}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.8% vs domingo anterior
          </div>
        </div>

        {/* Orders in Preparation */}
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-2">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-bold">Pedidos en Cocina</span>
            <div className="w-8 h-8 rounded-lg bg-fire-500/10 text-fire-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-fire-400">
            {pendingOrders.length}
          </div>
          <div className="text-[11px] text-charcoal-400">
            {readyOrders.length} listos para entrega
          </div>
        </div>

        {/* Cash Status */}
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-2">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-bold">Efectivo en Caja</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatARS(cashSession?.expected_cash || 25000)}
          </div>
          <div className="text-[11px] text-charcoal-400">
            Turno: {cashSession?.user_name ? 'Lucas Gómez' : 'Activo'}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-2">
          <div className="flex items-center justify-between text-charcoal-400">
            <span className="text-xs font-bold">Alertas de Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amberGold-500/10 text-amberGold-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${criticalStockItems.length > 0 ? 'text-amberGold-400' : 'text-emerald-400'}`}>
            {criticalStockItems.length}
          </div>
          <div className="text-[11px] text-charcoal-400">
            {criticalStockItems.length > 0 ? 'Insumos bajo mínimo' : 'Stock en niveles óptimos'}
          </div>
        </div>
      </div>

      {/* Chart & Quick Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-8 bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Facturación Semanal</h3>
              <p className="text-xs text-charcoal-400">Ventas comparadas por día de la semana (ARS)</p>
            </div>
            <span className="text-xs font-bold text-fire-400 bg-fire-500/10 px-2.5 py-1 rounded-lg border border-fire-500/20">
              Promedio: $ 410.000 / día
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatARS(Number(value)), 'Ventas']}
                  contentStyle={{ backgroundColor: '#141416', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="ventas" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods breakdown */}
        <div className="lg:col-span-4 bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800 space-y-4">
          <h3 className="text-base font-black text-white">Medios de Cobro</h3>
          <p className="text-xs text-charcoal-400">Distribución de ingresos de la jornada</p>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal-300">Efectivo en Local</span>
                <span className="font-bold text-white">45% ($ 73.400)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal-300">Mercado Pago (QR/Link)</span>
                <span className="font-bold text-white">35% ($ 57.100)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal-300">Transferencias Alias CBU</span>
                <span className="font-bold text-white">15% ($ 24.500)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-charcoal-300">Tarjeta Débito (Posnet)</span>
                <span className="font-bold text-white">5% ($ 8.200)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
                <div className="h-full bg-amberGold-500 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Orders Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden">
        <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Últimos Pedidos en Vivo</h3>
            <p className="text-xs text-charcoal-400">Canales: Landing web, Mostrador, WhatsApp y Teléfono</p>
          </div>

          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-bold text-fire-400 hover:text-fire-300 transition"
          >
            Ver todos los pedidos →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Pedido</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Canal</th>
                <th className="p-3.5">Entrega</th>
                <th className="p-3.5">Detalle Platos</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {orders.slice(0, 5).map(ord => (
                <tr key={ord.id} className="hover:bg-charcoal-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{ord.order_number}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{ord.customer_name}</div>
                    <div className="text-[10px] text-charcoal-400">{ord.customer_phone}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="capitalize bg-charcoal-800 px-2 py-0.5 rounded font-semibold text-charcoal-300">
                      {ord.channel}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-semibold ${ord.delivery_type === 'delivery' ? 'text-blue-400' : 'text-charcoal-300'}`}>
                      {ord.delivery_type === 'delivery' ? '🛵 Delivery' : '🏪 Retiro'}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs truncate text-charcoal-300">
                    {ord.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                  </td>
                  <td className="p-3.5 font-black text-white">{formatARS(ord.total)}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      ord.status === 'recibido'
                        ? 'bg-amberGold-500/20 text-amberGold-400 border border-amberGold-500/30'
                        : ord.status === 'en_preparacion'
                        ? 'bg-fire-600/20 text-fire-400 border border-fire-500/30'
                        : ord.status === 'listo'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-charcoal-800 text-charcoal-400'
                    }`}>
                      {ord.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onNavigate('orders')}
                      className="px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-[11px] font-bold"
                    >
                      Gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
