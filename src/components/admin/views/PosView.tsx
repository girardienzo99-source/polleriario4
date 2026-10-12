'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  CreditCard, 
  Printer, 
  FileText, 
  Check, 
  User, 
  Sparkles, 
  Flame, 
  RotateCcw 
} from 'lucide-react';
import { Product, ProductVariant, PaymentMethod, Customer } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';
import { ARCAClient } from '@/lib/arca/client';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';

interface PosViewProps {
  onPrintTicket: (props: ThermalReceiptProps) => void;
}

interface PosCartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export const PosView: React.FC<PosViewProps> = ({ onPrintTicket }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('final');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paidWithCash, setPaidWithCash] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [deliveryType, setDeliveryType] = useState<'retiro' | 'delivery'>('retiro');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    setProducts(PolleriaStore.getProducts());
    setCategories(PolleriaStore.getCategories());
    setCustomers(PolleriaStore.getCustomers());
  }, []);

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const unitPrice = variant ? variant.final_price : product.sale_price;
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;

    setCart(prev => {
      const exists = prev.find(i => i.id === itemId);
      if (exists) {
        return prev.map(i =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          product,
          variant,
          quantity: 1,
          unitPrice,
          subtotal: unitPrice,
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    setCart(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, quantity: qty, subtotal: qty * i.unitPrice }
          : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPaidWithCash(0);
    setDeliveryFee(0);
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const cashChange = paymentMethod === 'efectivo' && paidWithCash > total ? paidWithCash - total : 0;

  const handleCompleteSale = async (issueFiscal: boolean = false) => {
    if (cart.length === 0) return;

    const selectedCust = customers.find(c => c.id === selectedCustomerId);
    const customerName = selectedCust ? selectedCust.full_name : 'Consumidor Final';

    // 1. Registrar venta en Store
    const sale = PolleriaStore.recordSale({
      id: `sale-${Date.now()}`,
      business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      sale_number: '',
      channel: 'mostrador',
      customer_id: selectedCustomerId !== 'final' ? selectedCustomerId : undefined,
      customer_name: customerName,
      subtotal: subtotal,
      discount: discountAmount,
      tax_amount: Math.round(subtotal * 0.21),
      total: total,
      payment_method: paymentMethod,
      fiscal_status: issueFiscal ? 'autorizado' : 'no_fiscal',
      items: cart.map(i => ({
        id: `si-${Date.now()}-${i.id}`,
        sale_id: '',
        product_id: i.product.id,
        variant_id: i.variant?.id,
        description: i.variant ? `${i.product.name} (${i.variant.name})` : i.product.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        subtotal: i.subtotal,
        cost_price: i.product.cost_price,
      })),
      created_at: new Date().toISOString(),
    });

    // 2. Descontar recetas
    cart.forEach(item => {
      PolleriaStore.consumeRecipeForProduct(item.product.id, item.quantity);
    });

    // 3. Preparar datos para ticket
    let fiscalData: any = undefined;
    if (issueFiscal) {
      const fiscalSettings = PolleriaStore.getFiscalSettings();
      const arcaRes = await ARCAClient.authorizeInvoice(fiscalSettings, {
        business_id: fiscalSettings.business_id,
        sale_id: sale.id,
        voucher_type: 6, // Factura B
        point_of_sale: fiscalSettings.point_of_sale,
        receiver_doc_type: 96,
        receiver_doc_number: selectedCust?.doc_number || '0',
        receiver_name: customerName,
        receiver_iva_condition: 'Consumidor Final',
        net_amount: subtotal / 1.21,
        vat_amount: subtotal - subtotal / 1.21,
        exempt_amount: 0,
        total_amount: total,
        items: cart.map(i => ({
          description: i.product.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          subtotal: i.subtotal,
        })),
      });

      if (arcaRes.success) {
        fiscalData = {
          voucherLetter: 'B' as const,
          pointOfSale: fiscalSettings.point_of_sale,
          voucherNumber: arcaRes.voucher_number || 1042,
          cae: arcaRes.cae || '74428901234567',
          caeExpiration: arcaRes.cae_expiration || '2026-10-22',
          qrDataUrl: arcaRes.qr_data_url,
          isSimulation: arcaRes.is_simulation,
          receiverName: customerName,
          receiverDoc: selectedCust?.doc_number || 'Consumidor Final',
        };
      }
    }

    // 4. Abrir modal de ticket térmico
    onPrintTicket({
      type: issueFiscal ? 'fiscal' : 'commercial',
      orderNumber: sale.sale_number,
      customerName: customerName,
      paymentMethod: paymentMethod.toUpperCase(),
      items: cart.map(i => ({
        name: i.variant ? `${i.product.name} (${i.variant.name})` : i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      subtotal: subtotal,
      discount: discountAmount,
      deliveryFee: deliveryFee,
      total: total,
      fiscalData: fiscalData,
    });

    setSuccessNotice(`¡Venta ${sale.sale_number} completada con éxito!`);
    setTimeout(() => setSuccessNotice(null), 3000);
    clearCart();
  };

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      {/* Left Column: Product Catalog & Touch Selector */}
      <div className="lg:col-span-7 flex flex-col space-y-4 h-full overflow-hidden">
        {/* Search & Categories Bar */}
        <div className="bg-charcoal-900 p-4 rounded-3xl border border-charcoal-800 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Buscar producto o escanear código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-fire-600 text-white shadow-glow'
                  : 'bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-fire-600 text-white shadow-glow'
                    : 'bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Touch Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map(prod => (
              <div
                key={prod.id}
                className="bg-charcoal-900 border border-charcoal-800 hover:border-fire-500/50 rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer group active:scale-95 shadow"
                onClick={() => addToCart(prod)}
              >
                <div className="space-y-1.5">
                  <div className="h-20 w-full rounded-xl overflow-hidden bg-charcoal-950">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <h4 className="font-bold text-xs text-white line-clamp-2">{prod.name}</h4>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-charcoal-800/80 mt-2">
                  <span className="font-black text-xs text-fire-400">
                    {formatARS(prod.sale_price)}
                  </span>
                  <button className="w-6 h-6 rounded-lg bg-fire-600 hover:bg-fire-500 text-white flex items-center justify-center shadow">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: POS Cart & Register Payment */}
      <div className="lg:col-span-5 bg-charcoal-900 rounded-3xl border border-charcoal-800 p-5 flex flex-col justify-between h-full shadow-2xl">
        {/* Header Ticket */}
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-charcoal-800">
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-fire-500" />
                Ticket Mostrador
              </h3>
              <span className="text-[10px] text-charcoal-400">Caja: Lucas Gómez (Turno Activo)</span>
            </div>

            <button
              onClick={clearCart}
              title="Limpiar ticket"
              className="text-charcoal-500 hover:text-red-400 text-xs flex items-center gap-1 p-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </button>
          </div>

          {/* Customer & Delivery select */}
          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-charcoal-400 block mb-0.5">Cliente:</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white text-xs"
              >
                <option value="final">Consumidor Final</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.doc_type || 'Doc'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-charcoal-400 block mb-0.5">Medio de Pago:</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white text-xs font-bold"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="mercadopago">📱 Mercado Pago</option>
                <option value="transferencia">🏦 Transferencia Alias</option>
                <option value="debito">💳 Tarjeta Débito</option>
                <option value="credito">💳 Tarjeta Crédito</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ticket Items Scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-charcoal-500 text-xs">
              Ticket vacío. Seleccioná platos a la izquierda para iniciar la venta.
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="bg-charcoal-950 p-2.5 rounded-xl border border-charcoal-800 flex justify-between items-center text-xs"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-white truncate">{item.product.name}</h5>
                  <span className="text-[10px] text-charcoal-400">
                    {formatARS(item.unitPrice)} c/u
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-5 h-5 rounded bg-charcoal-800 text-charcoal-300 flex items-center justify-center hover:bg-charcoal-700"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="font-bold text-white w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-5 h-5 rounded bg-charcoal-800 text-charcoal-300 flex items-center justify-center hover:bg-charcoal-700"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <span className="font-black text-white text-xs w-20 text-right">
                  {formatARS(item.subtotal)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Totals & Quick Pay Controls */}
        <div className="space-y-3 pt-3 border-t border-charcoal-800">
          {paymentMethod === 'efectivo' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-charcoal-400 block mb-0.5">Paga con ($):</label>
                <input
                  type="number"
                  placeholder="Ej: 20000"
                  value={paidWithCash || ''}
                  onChange={e => setPaidWithCash(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-charcoal-400 block mb-0.5">Vuelto a entregar:</label>
                <div className="bg-charcoal-950 border border-charcoal-800 rounded-xl p-2 font-black text-emerald-400">
                  {formatARS(cashChange)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Total breakdown */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-charcoal-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">{formatARS(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-1 border-t border-charcoal-800">
              <span>TOTAL A COBRAR:</span>
              <span className="text-xl text-fire-400">{formatARS(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleCompleteSale(false)}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-fire-600 hover:bg-fire-500 text-white font-black text-xs shadow-glow transition active:scale-95 disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              Ticket Comercial
            </button>

            <button
              onClick={() => handleCompleteSale(true)}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow transition active:scale-95 disabled:opacity-40"
            >
              <FileText className="w-4 h-4" />
              Factura ARCA (B)
            </button>
          </div>

          {successNotice && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center rounded-xl font-bold animate-in fade-in">
              {successNotice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
