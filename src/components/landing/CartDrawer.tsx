'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, ArrowRight, Minus, Plus, ShoppingBag, Store, Tag, Trash2, Truck, X } from 'lucide-react';
import type { Product } from '@/types/database';
import { formatARS } from '@/lib/formatters';
import { useCart } from '@/context/CartContext';
import { MAX_QTY_PER_LINE } from './availability';
import { useOverlay } from './hooks';
import { cx } from './ui';

export function CartDrawer() {
  const {
    isCartOpen,
    openCart,
    closeCart,
    isCheckoutOpen,
    openCheckout,
    lines,
    itemCount,
    setQuantity,
    removeItem,
    addItem,
    catalog,
    couponCode,
    discountPercent,
    applyCoupon,
    removeCoupon,
    deliveryType,
    setDeliveryType,
    zoneId,
    setZoneId,
    activeZones,
    totals,
    hasUnavailable,
  } = useCart();
  const panelRef = useOverlay<HTMLDivElement>(isCartOpen, closeCart);
  const [code, setCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const inCartProductIds = useMemo(() => new Set(lines.map(l => l.productId)), [lines]);
  const suggestions = useMemo<Product[]>(() => {
    return (catalog?.products ?? [])
      .filter(p => p.active && p.is_available && p.is_visible_landing && !inCartProductIds.has(p.id))
      .filter(p => ['prod-papas-fritas', 'prod-empanadas', 'prod-gaseosa', 'prod-cerveza'].includes(p.id) || (p.category_id && ['cat-guarniciones', 'cat-bebidas'].includes(p.category_id)))
      .slice(0, 3);
  }, [catalog?.products, inCartProductIds]);

  if (!isCartOpen) {
    if (isCheckoutOpen || itemCount === 0) return null;
    return (
      <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden">
        <button
          type="button"
          onClick={openCart}
          aria-label={`Ver pedido (${itemCount} productos, total ${formatARS(totals.total)})`}
          className="flex w-full items-center justify-between rounded-2xl border border-fire-400/30 bg-fire-600 px-5 py-3.5 text-white shadow-2xl shadow-fire-950/80 transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-charcoal-950/30 text-xs font-bold tabular-nums">
              {itemCount}
            </span>
            <span className="text-sm font-semibold">Ver tu pedido</span>
          </span>
          <span className=" flex items-center gap-2 font-display text-lg font-semibold tabular-nums">
            {formatARS(totals.total)}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>
      </div>
    );
  }

  const submitCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const r = applyCoupon(code);
    setCouponMsg({ ok: r.ok, text: r.message });
    if (r.ok) setCode('');
  };

  const deliveryBlocked = deliveryType === 'delivery' && activeZones.length === 0;
  const canCheckout = lines.length > 0 && !hasUnavailable && !deliveryBlocked;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={closeCart} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col border-l border-white/[0.07] bg-charcoal-950 shadow-2xl focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 id="cart-title" className="font-display text-2xl text-bone">
              Tu pedido
            </h2>
            <p className="text-xs text-charcoal-400">
              {itemCount === 0 ? 'Todavía no agregaste productos' : `${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-charcoal-300 transition hover:bg-white/5 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-fire-600/10 text-fire-400">
              <ShoppingBag className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-6 font-display text-2xl text-bone">Tu carrito está vacío</p>
            <p className="mt-2 text-sm text-charcoal-400">Elegí algo rico de la carta para empezar.</p>
            <a href="/#carta" onClick={closeCart} className="btn-primary mt-8">
              Ver la carta
            </a>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="space-y-4">
                {lines.map(l => {
                  const max = Math.min(l.maxQuantity, MAX_QTY_PER_LINE);
                  return (
                    <li key={l.key} className={cx('flex gap-4 rounded-2xl border p-3', l.available ? 'border-white/[0.06] bg-charcoal-900/60' : 'border-crimson-500/40 bg-crimson-950/30')}>
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-charcoal-800">
                        <Image src={l.product.image_url} alt={l.displayName} fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-bone">{l.displayName}</p>
                            {l.variant && <p className="text-xs text-charcoal-400">{l.variant.name}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(l.key)}
                            aria-label={`Quitar ${l.displayName}${l.variant ? ` (${l.variant.name})` : ''} del carrito`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-charcoal-500 transition hover:bg-white/5 hover:text-crimson-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        {!l.available && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-crimson-300">
                            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            {l.maxQuantity <= 0 ? 'Agotado. Quitalo para continuar.' : `Sólo quedan ${l.maxQuantity}. Ajustá la cantidad.`}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center rounded-full border border-white/10">
                            <button
                              type="button"
                              onClick={() => setQuantity(l.key, l.quantity - 1)}
                              aria-label={`Restar una unidad de ${l.displayName}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-charcoal-300 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold tabular-nums text-bone" aria-label={`Cantidad ${l.quantity}`}>
                              {l.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(l.key, l.quantity + 1)}
                              disabled={l.quantity >= max}
                              aria-label={`Sumar una unidad de ${l.displayName}`}
                              className="grid h-8 w-8 place-items-center rounded-full text-charcoal-300 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 disabled:opacity-30"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <p className="font-display text-lg tabular-nums text-bone">{formatARS(l.subtotal)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Sugerencias de acompañamiento */}
              {suggestions.length > 0 && (
                <div className="mt-6 rounded-2xl border border-white/[0.06] bg-charcoal-900/40 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fire-400 mb-2.5 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> ¿Sumamos a tu pedido?
                  </p>
                  <div className="space-y-2">
                    {suggestions.map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-3 bg-charcoal-950/70 border border-white/[0.04] rounded-xl p-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-charcoal-800">
                            <Image src={s.image_url} alt={s.name} fill sizes="40px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-bone truncate">{s.name}</p>
                            <p className="text-[11px] font-bold text-fire-300">{formatARS(s.sale_price)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem(s.id, undefined, 1)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-fire-600/20 hover:bg-fire-600 text-fire-200 hover:text-white border border-fire-500/30 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entrega */}
              <fieldset className="mt-8">
                <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Entrega</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.06] bg-charcoal-900/60 p-1.5">
                  {[
                    { v: 'retiro' as const, label: 'Retiro en local', icon: Store },
                    { v: 'delivery' as const, label: 'Envío', icon: Truck },
                  ].map(o => (
                    <button
                      key={o.v}
                      type="button"
                      aria-pressed={deliveryType === o.v}
                      onClick={() => setDeliveryType(o.v)}
                      className={cx(
                        'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400',
                        deliveryType === o.v ? 'bg-bone text-charcoal-950' : 'text-charcoal-300 hover:text-bone',
                      )}
                    >
                      <o.icon className="h-4 w-4" aria-hidden="true" />
                      {o.label}
                    </button>
                  ))}
                </div>
                {deliveryType === 'delivery' &&
                  (activeZones.length ? (
                    <div className="mt-3">
                      <label htmlFor="cart-zone" className="sr-only">
                        Zona de envío
                      </label>
                      <select id="cart-zone" value={zoneId} onChange={e => setZoneId(e.target.value)} className="field">
                        {activeZones.map(z => (
                          <option key={z.id} value={z.id}>
                            {z.name} — {formatARS(z.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-crimson-300">No hay zonas de envío habilitadas. Elegí retiro en el local.</p>
                  ))}
              </fieldset>

              {/* Cupón */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Cupón de descuento</p>
                {couponCode ? (
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm text-emerald-200">
                      <Tag className="h-4 w-4" aria-hidden="true" />
                      <span className="font-mono font-semibold tracking-wider">{couponCode}</span> · {discountPercent}% OFF
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon();
                        setCouponMsg(null);
                      }}
                      className="text-xs font-medium text-emerald-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitCoupon} className="mt-3 flex gap-2">
                    <label htmlFor="coupon" className="sr-only">
                      Código de cupón
                    </label>
                    <input
                      id="coupon"
                      value={code}
                      onChange={e => {
                        setCode(e.target.value.toUpperCase());
                        setCouponMsg(null);
                      }}
                      placeholder="Ingresá tu código"
                      className="field font-mono uppercase tracking-wider"
                      autoComplete="off"
                      aria-describedby={couponMsg ? 'coupon-msg' : undefined}
                    />
                    <button type="submit" disabled={!code.trim()} className="btn-ghost shrink-0 px-5 disabled:opacity-40">
                      Aplicar
                    </button>
                  </form>
                )}
                {couponMsg && !couponCode && (
                  <p id="coupon-msg" role="status" className={cx('mt-2 text-xs', couponMsg.ok ? 'text-emerald-300' : 'text-crimson-300')}>
                    {couponMsg.text}
                  </p>
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-white/[0.06] bg-charcoal-950 px-6 pb-6 pt-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-charcoal-300">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatARS(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <dt>Descuento ({discountPercent}%)</dt>
                    <dd className="tabular-nums">−{formatARS(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-charcoal-300">
                  <dt>{deliveryType === 'delivery' ? 'Envío' : 'Retiro en local'}</dt>
                  <dd className="tabular-nums">{deliveryType === 'delivery' ? formatARS(totals.deliveryFee) : 'Sin cargo'}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/[0.06] pt-3">
                  <dt className="font-medium text-bone">Total</dt>
                  <dd className="font-display text-3xl tabular-nums text-bone">{formatARS(totals.total)}</dd>
                </div>
              </dl>
              {hasUnavailable && (
                <p className="mt-3 text-xs text-crimson-300" role="alert">
                  Hay productos sin stock suficiente. Ajustalos para continuar.
                </p>
              )}
              <button type="button" onClick={openCheckout} disabled={!canCheckout} className="btn-primary mt-5 w-full py-4 text-base">
                Continuar con el pedido
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
