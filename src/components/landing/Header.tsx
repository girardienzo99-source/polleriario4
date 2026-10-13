'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, ShoppingBag, X, Lock, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { whatsappLink } from './business';
import { useOpenStatus } from './hooks';
import { WhatsAppIcon, cx } from './ui';

const NAV = [
  { href: '/#carta', label: 'Carta' },
  { href: '/#promos', label: 'Promos' },
  { href: '/#fuego', label: 'Nuestro fuego' },
  { href: '/#como-pedir', label: 'Cómo pedir' },
  { href: '/#ubicacion', label: 'Ubicación' },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const status = useOpenStatus();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bump, setBump] = useState(false);

  const adminHref = isAuthenticated ? '/admin' : '/login';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!itemCount) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 450);
    return () => window.clearTimeout(t);
  }, [itemCount]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-40 transition-all duration-500',
        scrolled || mobileOpen
          ? 'border-b border-white/[0.06] bg-charcoal-950/90 backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent bg-gradient-to-b from-charcoal-950/80 to-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3.5 sm:h-20 sm:gap-4 sm:px-8">
        <a href="/#inicio" className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 sm:gap-3" aria-label="Pollería Los Campeones — inicio">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-fire-500/40 bg-gradient-to-br from-fire-600 to-crimson-800 font-display text-lg italic text-white shadow-glow">
            C
          </span>
          <span className="min-w-0 leading-none">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-fire-400 sm:text-[10px] sm:tracking-[0.32em]">Pollería</span>
            <span className="mt-0.5 block truncate font-display text-lg font-medium tracking-tight text-bone sm:mt-1 sm:text-xl">Los Campeones</span>
          </span>
        </a>

        <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
          {NAV.map(n => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-charcoal-300 transition hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {status && (
            <span
              className={cx(
                'hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium xl:inline-flex',
                status.isOpen ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-charcoal-300',
              )}
            >
              <span className={cx('h-1.5 w-1.5 rounded-full', status.isOpen ? 'animate-pulse bg-emerald-400' : 'bg-charcoal-500')} />
              {status.label}
            </span>
          )}
          <a
            href={whatsappLink('Hola Los Campeones, quiero hacer una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribinos por WhatsApp"
            className="hidden h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-bone transition hover:border-emerald-400/40 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 sm:grid"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
          <Link
            href={adminHref}
            aria-label={isAuthenticated ? 'Ir al panel administrativo' : 'Ingresar al panel administrativo'}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold text-bone transition hover:border-fire-400/50 hover:bg-fire-600/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 sm:px-3.5"
          >
            {isAuthenticated ? (
              <LayoutDashboard className="h-3.5 w-3.5 text-fire-400" aria-hidden="true" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-fire-400" aria-hidden="true" />
            )}
            <span className=" sm:hidden">{isAuthenticated ? 'Panel' : 'Admin'}</span>
            <span className="hidden sm:inline">{isAuthenticated ? 'Panel Admin' : 'Sistema / Admin'}</span>
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={itemCount ? `Abrir carrito, ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}` : 'Abrir carrito, vacío'}
            className="relative inline-flex h-10 items-center gap-1.5 rounded-full bg-fire-600 pl-3 pr-3.5 text-sm font-semibold text-white shadow-glow transition hover:bg-fire-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-300 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-950 sm:gap-2 sm:pl-3.5 sm:pr-4"
          >
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="hidden md:inline">Mi pedido</span>
            <span
              className={cx(
                'grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-[11px] font-bold tabular-nums text-fire-700',
                bump && 'animate-bump',
              )}
              aria-hidden="true"
            >
              {itemCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-bone transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Secciones" className="animate-fade-in max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/[0.06] bg-charcoal-950/95 px-5 pb-6 pt-3 backdrop-blur-xl lg:hidden">
          {status && (
            <p className={cx('mb-2 flex items-center gap-2 py-1.5 text-xs font-medium', status.isOpen ? 'text-emerald-300' : 'text-charcoal-400')}>
              <span className={cx('h-1.5 w-1.5 rounded-full', status.isOpen ? 'bg-emerald-400' : 'bg-charcoal-500')} />
              {status.label}
            </p>
          )}
          <ul className="divide-y divide-white/[0.06]">
            {NAV.map(n => (
              <li key={n.href}>
                <a href={n.href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 font-display text-2xl text-bone">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <Link
              href={adminHref}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-fire-500/40 bg-gradient-to-r from-fire-600/20 to-crimson-700/20 px-4 py-3.5 text-left transition hover:border-fire-400"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fire-600 text-white shadow-glow">
                  <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="block text-sm font-bold text-white">
                    {isAuthenticated ? 'Ir al Panel Administrativo' : 'Sistema Integral / Admin'}
                  </span>
                  <span className="block text-[11px] text-charcoal-300">
                    POS · Cocina · Productos · Stock · Caja · ARCA
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-fire-300" aria-hidden="true" />
            </Link>

            <a
              href={whatsappLink('Hola Los Campeones, quiero hacer una consulta.')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 text-left transition hover:border-emerald-400"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-sm font-bold text-white">Atención por WhatsApp</span>
                  <span className="block text-[11px] text-emerald-200/80">Consultas y pedidos directos</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
