'use client';

import React from 'react';
import { Flame, Sparkles, Clock, ShieldCheck, Bike, ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-24 bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-charcoal-950 border-b border-charcoal-800">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-fire-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-crimson-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fire-500/10 border border-fire-500/30 text-fire-400 text-xs sm:text-sm font-semibold tracking-wide">
              <Flame className="w-4 h-4 text-fire-500 animate-bounce" />
              Sabor Tradicional Río Cuarto • 100% Fresco de Granja
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              El auténtico <span className="text-transparent bg-clip-text bg-gradient-to-r from-fire-400 via-fire-500 to-crimson-500">pollo al spiedo</span> y a la leña de la ciudad.
            </h1>

            <p className="text-base sm:text-lg text-charcoal-300 max-w-2xl font-normal leading-relaxed">
              Dorado a fuego lento con receta criolla tradicional, marinado 12 horas con finas hierbas y limón. Acompañado de papas fritas caseras peladas en el día, crocantes por fuera y tiernas por dentro.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#menu"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-extrabold text-base px-8 py-4 rounded-xl shadow-glow transition active:scale-95 group"
              >
                Hacer Pedido Online
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </a>

              <a
                href="#combos"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-charcoal-800/80 hover:bg-charcoal-700/80 text-charcoal-100 font-bold text-base px-6 py-4 rounded-xl border border-charcoal-700 transition"
              >
                <Sparkles className="w-5 h-5 text-amberGold-400" />
                Ver Combos Familiares
              </a>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-charcoal-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-fire-500/10 border border-fire-500/20 flex items-center justify-center text-fire-400 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Fuego Lento</div>
                  <div className="text-[11px] text-charcoal-400">Spiedo tradicional</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amberGold-500/10 border border-amberGold-500/20 flex items-center justify-center text-amberGold-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">100% Granja</div>
                  <div className="text-[11px] text-charcoal-400">Sin congelados</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Delivery Propio</div>
                  <div className="text-[11px] text-charcoal-400">Llega bien caliente</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Puntualidad</div>
                  <div className="text-[11px] text-charcoal-400">Promesa de horario</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative badge */}
              <div className="absolute -top-4 -right-4 z-20 bg-fire-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-fire-400/30 flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                EL N°1 DE RÍO CUARTO
              </div>

              {/* Main Card Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-charcoal-700/80 shadow-2xl bg-charcoal-900 group">
                <img
                  src="https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1000&q=85"
                  alt="Pollo al Spiedo Tradicional Los Campeones"
                  className="w-full h-[380px] sm:h-[420px] object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-transparent" />

                {/* Floating summary in image */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl backdrop-blur-md bg-charcoal-900/90 border border-charcoal-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-fire-400 uppercase tracking-wider">Especialidad de la Casa</div>
                      <div className="text-lg font-bold text-white">Pollo al Spiedo + Fritas Grandes</div>
                      <div className="text-xs text-charcoal-300">Incluye chimichurri y limón</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-charcoal-400 line-through">$ 21.000</div>
                      <div className="text-xl font-black text-emerald-400">$ 19.900</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
