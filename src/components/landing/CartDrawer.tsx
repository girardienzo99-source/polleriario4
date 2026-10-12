'use client';

import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  ArrowRight, 
  Bike, 
  Store 
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const CartDrawer: React.FC = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    total, 
    discount, 
    isCartOpen, 
    setIsCartOpen, 
    setIsCheckoutOpen,
    discountCode,
    applyDiscountCode,
    selectedZoneId,
    setSelectedZoneId,
    deliveryFee,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'retiro'>('delivery');

  const zones = typeof window !== 'undefined' ? PolleriaStore.getDeliveryZones() : [];

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const ok = applyDiscountCode(inputCoupon);
    if (!ok) {
      setCouponError(true);
      setTimeout(() => setCouponError(false), 2500);
    } else {
      setCouponError(false);
      setInputCoupon('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-charcoal-900 border-l border-charcoal-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-fire-500" />
            <h3 className="font-black text-lg text-white">Mi Pedido Actual</h3>
            <span className="bg-charcoal-800 text-charcoal-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center text-charcoal-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-charcoal-800 flex items-center justify-center mx-auto text-charcoal-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-white">El carrito está vacío</p>
              <p className="text-xs text-charcoal-400">
                Agregá deliciosos pollos asados, papas y bebidas de nuestro menú.
              </p>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="bg-charcoal-950 p-3.5 rounded-xl border border-charcoal-800 flex gap-3 items-center"
              >
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 bg-charcoal-800"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">
                    {item.product.name}
                  </h4>
                  {item.variant && (
                    <span className="text-[11px] text-fire-400 font-semibold block">
                      {item.variant.name}
                    </span>
                  )}
                  <span className="text-xs font-bold text-charcoal-300 block mt-0.5">
                    {formatARS(item.unitPrice)} c/u
                  </span>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 flex items-center justify-center transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 flex items-center justify-center transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between h-16">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-charcoal-500 hover:text-red-400 transition self-end"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black text-white">
                    {formatARS(item.subtotal)}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Delivery vs Retiro selector */}
          {items.length > 0 && (
            <div className="bg-charcoal-950 p-3.5 rounded-xl border border-charcoal-800 space-y-3">
              <label className="text-xs font-bold text-charcoal-300 block">
                Forma de entrega:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                    deliveryType === 'delivery'
                      ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                      : 'bg-charcoal-800 border-charcoal-700 text-charcoal-400'
                  }`}
                >
                  <Bike className="w-4 h-4" /> Envío Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('retiro')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                    deliveryType === 'retiro'
                      ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                      : 'bg-charcoal-800 border-charcoal-700 text-charcoal-400'
                  }`}
                >
                  <Store className="w-4 h-4" /> Retiro en Local
                </button>
              </div>

              {deliveryType === 'delivery' && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-charcoal-400 block font-medium">
                    Zona de reparto en Río Cuarto:
                  </span>
                  <select
                    value={selectedZoneId}
                    onChange={e => setSelectedZoneId(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-fire-500"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} (+{formatARS(z.price)}) - {z.estimated_minutes} min
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Coupon Code Input */}
          {items.length > 0 && (
            <div className="bg-charcoal-950 p-3.5 rounded-xl border border-charcoal-800">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400" />
                  <input
                    type="text"
                    placeholder="Cupón de descuento (ej: CAMPEON10)"
                    value={inputCoupon}
                    onChange={e => setInputCoupon(e.target.value)}
                    className="w-full bg-charcoal-900 border border-charcoal-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-charcoal-800 hover:bg-charcoal-700 text-xs font-bold text-white px-3 py-1.5 rounded-lg border border-charcoal-700 transition"
                >
                  Aplicar
                </button>
              </form>
              {discountCode && (
                <p className="text-[11px] text-emerald-400 font-bold mt-2">
                  ✓ Cupón {discountCode} aplicado con éxito (-{formatARS(discount)})
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-red-400 font-bold mt-2">
                  ✗ Cupón no válido o vencido. Probá con CAMPEON10 o RIOCUARTO.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer & Totals */}
        {items.length > 0 && (
          <div className="p-4 border-t border-charcoal-800 bg-charcoal-950 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-charcoal-400">
                <span>Subtotal comidas:</span>
                <span className="font-semibold text-white">{formatARS(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Descuento aplicado:</span>
                  <span>-{formatARS(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-charcoal-400">
                <span>Envío delivery:</span>
                <span className="font-semibold text-white">
                  {deliveryType === 'delivery' ? formatARS(deliveryFee) : 'Gratis (Retiro)'}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-charcoal-800">
                <span>Total a pagar:</span>
                <span className="text-xl text-fire-400">
                  {formatARS(deliveryType === 'delivery' ? total : subtotal - discount)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-extrabold py-3.5 rounded-xl shadow-glow transition active:scale-95 text-sm"
            >
              Continuar al Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
