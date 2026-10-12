'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, Copy, ShoppingBag, Tag } from 'lucide-react';
import type { Product, Promotion } from '@/types/database';
import { formatARS } from '@/lib/formatters';
import { findCoupon } from '@/lib/domain/pricing';
import { useCart } from '@/context/CartContext';
import { defaultVariant, isSellable, unitPriceOf } from './availability';
import { nowInCordoba } from './business';
import { SectionHeading, cx } from './ui';

function isPromoActiveToday(p: Promotion): boolean {
  if (!p.is_active) return false;
  const { day } = nowInCordoba();
  if (p.active_days?.length && !p.active_days.includes(day)) return false;
  if (p.active_channels?.length && !p.active_channels.includes('landing')) return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Cordoba' }).format(new Date()); // YYYY-MM-DD
  if (p.start_date && today < p.start_date.slice(0, 10)) return false;
  if (p.end_date && today > p.end_date.slice(0, 10)) return false;
  return true;
}

/** Ahorro real del combo frente a comprar sus componentes por separado (catálogo vigente). */
function comboSavings(product: Product, products: Product[]): number {
  if (!product.combo_items?.length) return 0;
  let separate = 0;
  for (const ci of product.combo_items) {
    const comp = products.find(p => p.id === ci.product_id && p.active);
    if (!comp) return 0;
    const v = ci.variant_id ? comp.variants?.find(x => x.id === ci.variant_id) : undefined;
    separate += unitPriceOf(comp, v) * ci.quantity;
  }
  return Math.max(0, Math.round(separate - product.sale_price));
}

export function PromosBanner() {
  const { catalog, catalogReady, addItem, applyCoupon, showToast, couponCode, openCart } = useCart();
  const [copied, setCopied] = useState<string | null>(null);

  if (!catalogReady) return null;

  const promos = catalog.promotions.filter(isPromoActiveToday).filter(p => {
    if (p.product_id) {
      const prod = catalog.products.find(x => x.id === p.product_id);
      return !!prod && prod.active && prod.is_visible_landing;
    }
    if (p.coupon_code) return !!findCoupon(p.coupon_code);
    return false; // promos sin acción concreta no se muestran: no hay botones decorativos
  });

  if (!promos.length) return null;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      showToast(`Tu código es ${code}`, 'info');
    }
  };

  return (
    <section id="promos" aria-labelledby="promos-title" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(234,88,12,0.12),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="promos-title"
          eyebrow="Promociones vigentes"
          title="Para compartir"
          accent="en la mesa"
          description="Combos armados con productos de la carta y beneficios para pedidos online."
        />

        <div className={cx('mt-12 grid gap-6', promos.length >= 3 ? 'lg:grid-cols-3' : promos.length === 2 ? 'md:grid-cols-2' : '')}>
          {promos.map((promo, i) => {
            const product = promo.product_id ? catalog.products.find(x => x.id === promo.product_id) : undefined;
            const variant = product ? defaultVariant(product) : undefined;
            const available = product ? isSellable(product, variant, catalog.products) : true;
            const price = product ? unitPriceOf(product, variant) : 0;
            const savings = product ? comboSavings(product, catalog.products) : 0;
            const image = promo.image_url || product?.image_url;
            const coupon = promo.coupon_code ? findCoupon(promo.coupon_code) : null;
            const couponApplied = coupon && couponCode === coupon.code;

            return (
              <article
                key={promo.id}
                className={cx(
                  'group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-white/[0.07] p-6 shadow-card sm:p-8',
                  i === 0 && promos.length >= 3 && 'lg:row-span-1',
                )}
              >
                {image && (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className={cx('-z-10 object-cover transition duration-[1200ms] ease-out group-hover:scale-105', !available && 'grayscale-[60%]')}
                  />
                )}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal-950 via-charcoal-950/75 to-charcoal-950/10" />

                <div className="absolute left-6 top-6 flex flex-wrap gap-2 sm:left-8 sm:top-8">
                  {product && savings > 0 && (
                    <span className="rounded-full bg-fire-600 px-3 py-1 text-xs font-semibold text-white">Ahorrás {formatARS(savings)}</span>
                  )}
                  {coupon && (
                    <span className="rounded-full bg-crimson-700 px-3 py-1 text-xs font-semibold text-white">{coupon.percent}% OFF online</span>
                  )}
                </div>

                <h3 className="font-display text-3xl font-medium leading-tight text-bone">{promo.name}</h3>
                {promo.description && <p className="mt-2 text-sm leading-relaxed text-charcoal-300">{promo.description}</p>}

                {product && (
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="font-display text-3xl tabular-nums text-fire-300">{formatARS(price)}</p>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => addItem(product.id, variant?.id, 1)}
                      className="btn-primary"
                      aria-label={available ? `Agregar ${product.name} al pedido` : `${product.name} agotado`}
                    >
                      {available ? (
                        <>
                          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                          Agregar
                        </>
                      ) : (
                        'Agotado'
                      )}
                    </button>
                  </div>
                )}

                {coupon && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copy(coupon.code)}
                      aria-label={`Copiar el código ${coupon.code}`}
                      className="inline-flex items-center gap-2 rounded-full border border-dashed border-fire-400/60 bg-charcoal-950/50 px-4 py-2.5 font-mono text-sm font-semibold tracking-widest text-fire-200 backdrop-blur transition hover:border-fire-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
                    >
                      <Tag className="h-4 w-4" aria-hidden="true" />
                      {coupon.code}
                      {copied === coupon.code ? <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <Copy className="h-4 w-4 opacity-70" aria-hidden="true" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (couponApplied) return openCart();
                        const r = applyCoupon(coupon.code);
                        showToast(r.message, r.ok ? 'success' : 'error', r.ok);
                      }}
                      className="btn-ghost py-2.5"
                    >
                      {couponApplied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                          Aplicado · ver carrito
                        </>
                      ) : (
                        'Aplicar al carrito'
                      )}
                    </button>
                    <span className="sr-only" aria-live="polite">
                      {copied === coupon.code ? 'Código copiado' : ''}
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
