'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Bike, 
  Store, 
  Phone, 
  MessageCircle, 
  ChefHat 
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateTimeAR } from '@/lib/formatters';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';

interface OrdersViewProps {
  onPrintTicket: (props: ThermalReceiptProps) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onPrintTicket }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadOrders = () => {
    setOrders(PolleriaStore.getOrders());
  };

  useEffect(() => {
    loadOrders();
    window.addEventListener('polleria_store_updated', loadOrders);
    return () => window.removeEventListener('polleria_store_updated', loadOrders);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    PolleriaStore.updateOrderStatus(orderId, newStatus);
    loadOrders();
  };

  const handlePrintKitchenDocket = (ord: Order) => {
    onPrintTicket({
      type: 'kitchen',
      orderNumber: ord.order_number,
      customerName: ord.customer_name,
      deliveryType: ord.delivery_type,
      deliveryAddress: ord.customer_address,
      notes: ord.notes,
      items: ord.items.map(i => ({
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
        notes: i.notes,
      })),
      subtotal: ord.subtotal,
      deliveryFee: ord.delivery_fee,
      total: ord.total,
    });
  };

  const handlePrintCommercialTicket = (ord: Order) => {
    onPrintTicket({
      type: 'commercial',
      orderNumber: ord.order_number,
      customerName: ord.customer_name,
      customerPhone: ord.customer_phone,
      deliveryType: ord.delivery_type,
      deliveryAddress: ord.customer_address,
      paymentMethod: ord.payment_method.toUpperCase(),
      notes: ord.notes,
      items: ord.items.map(i => ({
        name: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
        notes: i.notes,
      })),
      subtotal: ord.subtotal,
      deliveryFee: ord.delivery_fee,
      discount: ord.discount,
      total: ord.total,
    });
  };

  const filteredOrders = orders.filter(ord => {
    if (filterStatus !== 'all' && ord.status !== filterStatus) return false;
    if (filterChannel !== 'all' && ord.channel !== filterChannel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = ord.order_number.toLowerCase().includes(q);
      const matchCust = ord.customer_name.toLowerCase().includes(q);
      const matchPhone = ord.customer_phone.includes(q);
      if (!matchNum && !matchCust && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-fire-500" />
              Gestión Integral de Pedidos
            </h1>
            <p className="text-xs text-charcoal-400 mt-1">
              Control de pedidos web, mostrador, WhatsApp y delivery en tiempo real
            </p>
          </div>

          <span className="text-xs font-bold text-charcoal-300 bg-charcoal-800 px-3 py-1.5 rounded-xl border border-charcoal-700">
            Total registrados: {orders.length}
          </span>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Buscar por nro pedido (#POL-1001), cliente o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-semibold"
            >
              <option value="all">Todos los Estados</option>
              <option value="recibido">🟡 Recibidos</option>
              <option value="en_preparacion">🟠 En Preparación</option>
              <option value="listo">🟢 Listos</option>
              <option value="en_reparto">🛵 En Reparto</option>
              <option value="entregado">✓ Entregados</option>
              <option value="cancelado">✗ Cancelados</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-semibold"
            >
              <option value="all">Todos los Canales</option>
              <option value="landing">🌐 Landing Web</option>
              <option value="mostrador">🏪 Mostrador</option>
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="telefono">📞 Teléfono</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-charcoal-900 rounded-3xl border border-charcoal-800">
            <ClipboardList className="w-12 h-12 text-charcoal-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No hay pedidos con los filtros aplicados</p>
          </div>
        ) : (
          filteredOrders.map(ord => (
            <div
              key={ord.id}
              className="bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 rounded-2xl p-4 sm:p-5 transition shadow flex flex-col lg:flex-row justify-between gap-4"
            >
              {/* Order Info */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-lg text-white">{ord.order_number}</span>
                  <span className="text-[10px] text-charcoal-400 bg-charcoal-950 px-2 py-0.5 rounded border border-charcoal-800">
                    {formatDateTimeAR(ord.created_at)}
                  </span>
                  <span className="text-[10px] font-bold text-fire-400 bg-fire-500/10 px-2 py-0.5 rounded border border-fire-500/20 capitalize">
                    {ord.channel}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ord.delivery_type === 'delivery'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-charcoal-800 text-charcoal-300'
                  }`}>
                    {ord.delivery_type === 'delivery' ? '🛵 Delivery' : '🏪 Retiro Local'}
                  </span>
                </div>

                {/* Customer & Address */}
                <div className="text-xs text-charcoal-300">
                  <span className="font-bold text-white">{ord.customer_name}</span>
                  <span className="mx-2">•</span>
                  <span>{ord.customer_phone}</span>
                  {ord.customer_address && (
                    <span className="block text-charcoal-400 mt-0.5">
                      📍 {ord.customer_address} {ord.delivery_zone_name ? `(${ord.delivery_zone_name})` : ''}
                    </span>
                  )}
                </div>

                {/* Items breakdown */}
                <div className="bg-charcoal-950 p-2.5 rounded-xl border border-charcoal-800/80 space-y-1">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-white font-medium">
                        <strong className="text-fire-400">{it.quantity}x</strong> {it.product_name}
                      </span>
                      <span className="text-charcoal-400">{formatARS(it.subtotal)}</span>
                    </div>
                  ))}
                  {ord.delivery_fee > 0 && (
                    <div className="flex justify-between text-xs text-charcoal-400 pt-1 border-t border-charcoal-800">
                      <span>Envío delivery:</span>
                      <span>{formatARS(ord.delivery_fee)}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {ord.notes && (
                  <p className="text-xs text-amberGold-400 italic bg-amberGold-500/10 p-2 rounded-lg border border-amberGold-500/20">
                    Obs: {ord.notes}
                  </p>
                )}
              </div>

              {/* Status Controls & Printing */}
              <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-charcoal-800 pt-3 lg:pt-0 lg:pl-5 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-charcoal-400 font-medium">Estado Actual:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      ord.status === 'recibido'
                        ? 'bg-amberGold-500/20 text-amberGold-400 border border-amberGold-500/30'
                        : ord.status === 'en_preparacion'
                        ? 'bg-fire-600/20 text-fire-400 border border-fire-500/30'
                        : ord.status === 'listo'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ord.status === 'entregado'
                        ? 'bg-charcoal-800 text-charcoal-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-charcoal-400 font-medium">Pago:</span>
                    <span className="font-bold text-white uppercase text-[11px]">
                      {ord.payment_method} ({ord.payment_status})
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-sm font-black text-white">
                    <span>Total Pedido:</span>
                    <span className="text-fire-400 text-base">{formatARS(ord.total)}</span>
                  </div>
                </div>

                {/* State Progress Buttons */}
                <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                  {ord.status === 'recibido' && (
                    <button
                      onClick={() => handleStatusChange(ord.id, 'en_preparacion')}
                      className="col-span-2 py-2 rounded-xl bg-fire-600 hover:bg-fire-500 text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                    >
                      <ChefHat className="w-3.5 h-3.5" /> Enviar a Cocina
                    </button>
                  )}

                  {ord.status === 'en_preparacion' && (
                    <button
                      onClick={() => handleStatusChange(ord.id, 'listo')}
                      className="col-span-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Listo
                    </button>
                  )}

                  {ord.status === 'listo' && (
                    <button
                      onClick={() => handleStatusChange(ord.id, 'entregado')}
                      className="col-span-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Entregado
                    </button>
                  )}
                </div>

                {/* Print Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => handlePrintKitchenDocket(ord)}
                    className="p-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Printer className="w-3 h-3 text-orange-400" /> Comanda
                  </button>

                  <button
                    onClick={() => handlePrintCommercialTicket(ord)}
                    className="p-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Printer className="w-3 h-3 text-emerald-400" /> Ticket
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
