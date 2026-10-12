'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { isListed } from './availability';
import { ProductCard } from './ProductCard';
import { SectionHeading } from './ui';

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-charcoal-900/60" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-charcoal-800" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-charcoal-800" />
        <div className="h-3 w-full animate-pulse rounded bg-charcoal-800/70" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-charcoal-800/70" />
        <div className="h-10 w-full animate-pulse rounded-full bg-charcoal-800" />
      </div>
    </div>
  );
}

export function FeaturedSection() {
  const { catalog, catalogReady } = useCart();
  const featured = catalog.products.filter(p => isListed(p) && p.is_featured && p.product_type !== 'combo').slice(0, 3);

  if (catalogReady && featured.length === 0) return null;

  return (
    <section id="destacados" aria-labelledby="destacados-title" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="destacados-title"
            eyebrow="Los imperdibles"
            title="Lo que más sale"
            accent="del fuego"
            description="Una selección de nuestra carta para empezar. Elegí la porción y sumalo a tu pedido."
          />
          <a href="#carta" className="btn-ghost self-start md:self-auto">
            Ver la carta completa
          </a>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogReady
            ? featured.map(p => <ProductCard key={p.id} product={p} products={catalog.products} />)
            : Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </section>
  );
}
