'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowDown, Clock, MapPin } from 'lucide-react';
import { BUSINESS, BUSINESS_HOURS, formatRanges, whatsappLink } from './business';
import { useOpenStatus } from './hooks';
import { WhatsAppIcon, cx } from './ui';

export function Hero() {
  const status = useOpenStatus();

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-end overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-brasa.jpg"
          alt="Pollos asados a la brasa sobre leña de quebracho en parrilla tradicional argentina"
          fill
          priority
          sizes="100vw"
          className="animate-ken-burns object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/70 to-charcoal-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 via-charcoal-950/40 to-transparent" />
        <div className="absolute -bottom-32 left-1/2 h-72 w-[120%] -translate-x-1/2 animate-ember rounded-[100%] bg-fire-700/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24 lg:pb-28">
        <div className="max-w-3xl">
          {status && (
            <p
              className={cx(
                'inline-flex animate-fade-up items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur',
                status.isOpen ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-white/15 bg-black/30 text-charcoal-200',
              )}
            >
              <span className={cx('h-2 w-2 rounded-full', status.isOpen ? 'animate-pulse bg-emerald-400' : 'bg-charcoal-400')} aria-hidden="true" />
              {status.label}
            </p>
          )}

          <h1
            id="hero-title"
            className="mt-6 animate-fade-up font-display text-[2.9rem] font-medium leading-[0.98] tracking-tight text-bone [animation-delay:120ms] sm:text-7xl lg:text-[5.5rem]"
          >
            Pollos a la brasa
            <br />
            <em className="font-normal italic text-fire-400">estilo argentino</em>,
            <br className="hidden sm:block" /> a pura leña y carbón.
          </h1>

          <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-charcoal-200 [animation-delay:240ms] sm:text-lg">
            Asados despacio sobre brasas de quebracho y anchico, adobados con chimichurri casero, limón y ají molido. Piel dorada crocante y carne jugosa para compartir en Río Cuarto.
          </p>

          <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:360ms] sm:flex-row">
            <a href="#carta" className="btn-primary px-8 py-4 text-base">
              Pedir ahora
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappLink('Hola Los Campeones, quiero hacer un pedido.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-8 py-4 text-base"
            >
              <WhatsAppIcon className="h-5 w-5 text-emerald-400" />
              WhatsApp
            </a>
          </div>

          <dl className="mt-12 grid max-w-xl animate-fade-up grid-cols-1 gap-4 border-t border-white/10 pt-6 text-sm [animation-delay:480ms] sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fire-400" aria-hidden="true" />
              <div>
                <dt className="sr-only">Dirección</dt>
                <dd className="text-charcoal-200">
                  {BUSINESS.address}
                  <span className="block text-charcoal-400">{BUSINESS.city}</span>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-fire-400" aria-hidden="true" />
              <div>
                <dt className="sr-only">Horario</dt>
                <dd className="text-charcoal-200">
                  Todos los días
                  <span className="block text-charcoal-400">{formatRanges(BUSINESS_HOURS[1])}</span>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
