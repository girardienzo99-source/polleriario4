'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  PieChart as PieIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const ReportsView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setOrders(PolleriaStore.getOrders());
    setSales(PolleriaStore.getSales());
    setProducts(PolleriaStore.getProducts());
  }, []);

  // Top products sales
  const topProductsData = [
    { name: 'Pollo al Spiedo', cantidad: 38, total: 551000 },
    { name: 'Combo Campeón', cantidad: 26, total: 517400 },
    { name: 'Papas Fritas Grandes', cantidad: 45, total: 202500 },
    { name: 'Suprema Napolitana', cantidad: 18, total: 207000 },
    { name: 'Docena Empanadas', cantidad: 16, total: 192000 },
    { name: 'Coca-Cola 1.5L', cantidad: 42, total: 134400 },
  ];

  const paymentBreakdownData = [
    { name: 'Efectivo', value: 73400, color: '#10b981' },
    { name: 'Mercado Pago', value: 57100, color: '#3b82f6' },
    { name: 'Transferencia', value: 24500, color: '#a855f7' },
    { name: 'Tarjeta Débito', value: 8200, color: '#f59e0b' },
  ];

  const exportReportCSV = () => {
    const headers = ['Producto', 'Cantidad Vendida', 'Total Recaudado (ARS)'];
    const rows = topProductsData.map(p => [`"${p.name}"`, p.cantidad, p.total]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `reporte_ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-fire-500" />
            Informes y Estadísticas Comerciales
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Métricas de facturación, platos más vendidos, utilidad estimada y medios de cobro
          </p>
        </div>

        <button
          onClick={exportReportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold border border-charcoal-700 transition"
        >
          <Download className="w-4 h-4" />
          Exportar Informe CSV
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Total Facturado Estimado</span>
          <div className="text-3xl font-black text-white">$ 1.804.400</div>
          <span className="text-[11px] text-emerald-400 font-semibold">Semana en curso</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Ganancia Bruta Estimada</span>
          <div className="text-3xl font-black text-emerald-400">$ 938.200</div>
          <span className="text-[11px] text-charcoal-400">Margen promedio: 52%</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Ticket Promedio por Pedido</span>
          <div className="text-3xl font-black text-fire-400">$ 19.450</div>
          <span className="text-[11px] text-charcoal-400">Impulsado por Combos Campeón</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top products bar chart */}
        <div className="lg:col-span-8 bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800 space-y-4">
          <h3 className="font-black text-white text-base">Platos y Productos Más Vendidos</h3>
          <p className="text-xs text-charcoal-400">Unidades despachadas en la última semana</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={130} />
                <Tooltip
                  formatter={(val: any) => [`${val} unidades`, 'Ventas']}
                  contentStyle={{ backgroundColor: '#141416', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="cantidad" fill="#ea580c" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Pie Chart */}
        <div className="lg:col-span-4 bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-white text-base">Medios de Cobro</h3>
            <p className="text-xs text-charcoal-400">Participación por volumen de facturación</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatARS(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {paymentBreakdownData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-charcoal-300 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
