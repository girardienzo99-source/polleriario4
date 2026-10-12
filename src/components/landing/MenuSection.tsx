'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Category, Product } from '@/types/database';
import { useCart } from '@/context/CartContext';
import { isListed } from './availability';
import { ProductCard } from './ProductCard';
import { CardSkeleton } from './FeaturedSection';
import { SectionHeading, cx } from './ui';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

interface Group {
  category: Pick<Category, 'id' | 'name' | 'description'>;
  products: Product[];
}

export function MenuSection() {
  const { catalog, catalogReady } = useCart();
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>('');
  const tabsRef = useRef<HTMLDivElement>(null);

  const groups = useMemo<Group[]>(() => {
    const q = normalize(query.trim());
    const listed = catalog.products.filter(isListed).filter(p => !q || normalize(`${p.name} ${p.description ?? ''}`).includes(q));
    const cats = catalog.categories.filter(c => c.active).sort((a, b) => a.display_order - b.display_order);
    const out: Group[] = cats
      .map(c => ({ category: c, products: listed.filter(p => p.category_id === c.id) }))
      .filter(g => g.products.length > 0);
    const orphan = listed.filter(p => !cats.some(c => c.id === p.category_id));
    if (orphan.length) out.push({ category: { id: 'otros', name: 'Otros', description: undefined }, products: orphan });
    return out;
  }, [catalog.products, catalog.categories, query]);

  // Scroll-spy: resalta la categoría visible.
  useEffect(() => {
    if (!groups.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id.replace('cat-', ''));
      },
      { rootMargin: '-180px 0px -55% 0px', threshold: 0 },
    );
    groups.forEach(g => {
      const el = document.getElementById(`cat-${g.category.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [groups]);

  // Mantener visible la pestaña activa dentro del scroll horizontal.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${activeId}"]`);
    if (tab && tabsRef.current) {
      const c = tabsRef.current;
      const left = tab.offsetLeft - c.clientWidth / 2 + tab.clientWidth / 2;
      c.scrollTo({ left, behavior: 'smooth' });
    }
  }, [activeId]);

  const goTo = (id: string) => {
    setActiveId(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const total = groups.reduce((a, g) => a + g.products.length, 0);

  return (
    <section id="carta" aria-labelledby="carta-title" className="relative border-t border-white/[0.05] bg-charcoal-950 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 grain opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            id="carta-title"
            eyebrow="La carta"
            title="Todo lo que sale"
            accent="de nuestra cocina"
            description="Precios actualizados al momento. Si algo se agota, lo vas a ver marcado."
          />
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="menu-search" className="sr-only">
              Buscar en la carta
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-500" aria-hidden="true" />
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar: spiedo, milanesa, papas…"
              className="field rounded-full pl-11 pr-11"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-charcoal-400 hover:bg-white/5 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de categorías (sticky bajo el header) */}
      <div className="sticky top-16 z-30 mt-12 border-y border-white/[0.06] bg-charcoal-950/85 backdrop-blur-xl sm:top-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <nav ref={tabsRef} className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto py-3" aria-label="Categorías de la carta">
            {catalogReady
              ? groups.map(g => {
                  const active = activeId === g.category.id;
                  return (
                    <button
                      key={g.category.id}
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      data-cat={g.category.id}
                      onClick={() => goTo(g.category.id)}
                      className={cx(
                        'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400',
                        active ? 'bg-bone text-charcoal-950' : 'text-charcoal-300 hover:bg-white/5 hover:text-bone',
                      )}
                    >
                      {g.category.name}
                      <span className={cx('ml-2 text-xs tabular-nums', active ? 'text-charcoal-500' : 'text-charcoal-600')}>{g.products.length}</span>
                    </button>
                  );
                })
              : Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-charcoal-800" />)}
          </nav>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {query && catalogReady && (
          <p className="mt-8 text-sm text-charcoal-400" role="status">
            {total === 0 ? 'Sin resultados' : `${total} ${total === 1 ? 'resultado' : 'resultados'}`} para “{query}”
          </p>
        )}

        {!catalogReady && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {catalogReady && total === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
            <p className="font-display text-2xl text-bone">No encontramos ese plato.</p>
            <p className="mt-2 text-sm text-charcoal-400">Probá con otra palabra o mirá la carta completa.</p>
            {query && (
              <button type="button" onClick={() => setQuery('')} className="btn-ghost mt-6">
                Ver toda la carta
              </button>
            )}
          </div>
        )}

        {catalogReady &&
          groups.map(g => (
            <section key={g.category.id} id={`cat-${g.category.id}`} className="scroll-mt-40 pt-14 sm:scroll-mt-44" aria-labelledby={`cat-title-${g.category.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.06] pb-4">
                <h3 id={`cat-title-${g.category.id}`} className="font-display text-3xl font-medium text-bone">{g.category.name}</h3>
                {g.category.description && <p className="text-sm text-charcoal-400">{g.category.description}</p>}
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.products.map(p => (
                  <ProductCard key={p.id} product={p} products={catalog.products} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </section>
  );
}
