'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ShoppingBag, Clock, Phone, MapPin, Lock, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatARS } from '@/lib/formatters';

export const Header: React.FC = () => {
  const { itemCount, total, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-charcoal-950/90 border-b border-charcoal-800">
      {/* Top micro-bar */}
      <div className="bg-fire-600/15 border-b border-fire-500/20 px-4 py-1.5 text-xs text-charcoal-300">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-fire-400 font-medium">
              <Clock className="w-3.5 h-3.5" /> Martes a Domingos: 11:30 a 14:30 | 20:00 a 23:30 hs
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-fire-500" /> Av. Marcelo T. de Alvear 840, Río Cuarto
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/5493585123456?text=Hola!%20Quiero%20hacer%20un%20pedido%20en%20Poller%C3%ADa%20Los%20Campeones"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Pedidos WhatsApp: +54 9 358 512-3456
            </a>

            <Link
              href="/login"
              className="flex items-center gap-1 text-charcoal-400 hover:text-charcoal-200 transition text-[11px]"
              title="Acceso al Sistema Administrativo"
            >
              <Lock className="w-3 h-3" /> Administración
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fire-500 to-crimson-700 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white uppercase font-sans">
                Pollería <span className="text-fire-500">Los Campeones</span>
              </span>
              <span className="bg-fire-600/30 text-fire-400 border border-fire-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded">
                PRO
              </span>
            </div>
            <p className="text-xs text-charcoal-400 font-medium">Spiedo Criollo & Rotisería • Río Cuarto</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-charcoal-300">
          <a href="#menu" className="hover:text-fire-400 transition">Nuestro Menú</a>
          <a href="#promos" className="hover:text-fire-400 transition">Promociones</a>
          <a href="#combos" className="hover:text-fire-400 transition">Combos Familiares</a>
          <a href="#ubicacion" className="hover:text-fire-400 transition">Horarios & Ubicación</a>
        </nav>

        {/* Action: Cart Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-3 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-glow hover:shadow-glow-lg transition active:scale-95"
            aria-label="Ver carrito de compras"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-fire-700 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <div className="text-white/80 font-normal">Mi Pedido</div>
              <div className="font-black text-sm">{formatARS(total)}</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
