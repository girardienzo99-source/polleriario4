'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types/database';
import { formatARS } from '@/lib/formatters';
import { useCart } from '@/context/CartContext';
import { activeVariants, defaultVariant, isSellable, maxUnits, MAX_QTY_PER_LINE, unitPriceOf } from './availability';
import { cx } from './ui';

export function ProductCard({ product, products, priority = false }: { product: Product; products: Product[]; priority?: boolean }) {
  const { addItem } = useCart();
  const variants = activeVariants(product);

  const [variantId, setVariantId] = useState<string | undefined>(() => {
    const def = defaultVariant(product);
    if (def && isSellable(product, def, products)) return def.id;
    return variants.find(v => isSellable(product, v, products))?.id ?? def?.id;
  });
  const [qty, setQty] = useState(1);

  const variant = variants.find(v => v.id === variantId) ?? (variants.length ? variants[0] : undefined);
  const max = Math.min(maxUnits(product, variant, products), MAX_QTY_PER_LINE);
  const soldOut = variants.length ? variants.every(v => !isSellable(product, v, products)) : max <= 0;
  const selectionAvailable = max > 0;
  const price = unitPriceOf(product, variant);

  // Si el stock baja, ajustar la cantidad elegida.
  useEffect(() => {
    if (max > 0 && qty > max) setQty(max);
  }, [max, qty]);

  const handleAdd = () => {
    if (addItem(product.id, variant?.id, qty)) setQty(1);
  };

  return (
    <article
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-charcoal-900/60 shadow-card transition duration-500',
        !soldOut && 'hover:-translate-y-1 hover:border-fire-500/25',
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-800">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={cx(
            'object-cover transition duration-[900ms] ease-out group-hover:scale-[1.06]',
            soldOut && 'grayscale-[70%] opacity-60',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 via-transparent to-transparent" />
        {soldOut ? (
          <span className="absolute left-4 top-4 rounded-full bg-charcoal-950/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal-200 backdrop-blur">
            Agotado
          </span>
        ) : (
          product.is_featured && (
            <span className="absolute left-4 top-4 rounded-full bg-fire-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              De la casa
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-[1.35rem] font-medium leading-tight text-bone">{product.name}</h3>
          <p className="shrink-0 font-display text-xl tabular-nums text-fire-300" aria-label={`Precio ${formatARS(price)}`}>
            {formatARS(price)}
          </p>
        </div>
        {product.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-charcoal-400">{product.description}</p>}

        {variants.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={`Opciones de ${product.name}`}>
            {variants.map(v => {
              const ok = isSellable(product, v, products);
              const selected = v.id === variant?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!ok}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  className={cx(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400',
                    selected
                      ? 'border-fire-500 bg-fire-600/15 text-fire-200'
                      : 'border-white/10 text-charcoal-300 hover:border-white/25 hover:text-bone',
                    !ok && 'cursor-not-allowed line-through opacity-40 hover:border-white/10',
                  )}
                >
                  {v.name} · {formatARS(v.final_price)}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center gap-3 pt-5">
          <div className="flex items-center rounded-full border border-white/10 bg-charcoal-950/60">
            <button
              type="button"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={!selectionAvailable || qty <= 1}
              aria-label={`Restar una unidad de ${product.name}`}
              className="grid h-10 w-10 place-items-center rounded-full text-charcoal-300 transition hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums text-bone" aria-live="polite" aria-label={`Cantidad ${qty}`}>
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(q => Math.min(max, q + 1))}
              disabled={!selectionAvailable || qty >= max}
              aria-label={`Sumar una unidad de ${product.name}`}
              className="grid h-10 w-10 place-items-center rounded-full text-charcoal-300 transition hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 disabled:opacity-30"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectionAvailable}
            aria-label={selectionAvailable ? `Agregar ${qty} ${product.name}${variant ? ` (${variant.name})` : ''} al pedido` : `${product.name} agotado`}
            className="btn-primary h-10 flex-1 px-4 py-0 shadow-none"
          >
            {selectionAvailable ? (
              <>
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Agregar
              </>
            ) : (
              'Agotado'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
