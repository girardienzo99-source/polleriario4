import React from 'react';
import Link from 'next/link';
import { BUSINESS, BUSINESS_HOURS, formatRanges, whatsappLink } from './business';
import { WhatsAppIcon } from './ui';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/[0.06] bg-charcoal-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire-600/50 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-fire-400">Pollería</p>
            <p className="mt-1 font-display text-4xl text-bone">Los Campeones</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal-400">
              Pollo al spiedo, horno y parrilla con leña. Cocina casera para retirar o con envío en Río Cuarto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappLink('Hola Los Campeones, quiero hacer un pedido.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost px-5 py-2.5"
              >
                <WhatsAppIcon className="h-4 w-4 text-emerald-400" />
                Pedí por WhatsApp
              </a>
              <Link
                href="/login"
                className="btn-ghost border-fire-500/30 bg-fire-600/10 px-5 py-2.5 text-fire-200 hover:border-fire-400 hover:bg-fire-600/20"
              >
                Panel Administrativo
              </Link>
            </div>
          </div>

          <nav aria-label="Secciones del sitio" className="md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Explorá</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ['/#carta', 'Carta'],
                ['/#promos', 'Promociones'],
                ['/#fuego', 'Nuestro fuego'],
                ['/#como-pedir', 'Cómo pedir'],
                ['/#ubicacion', 'Ubicación y envíos'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-charcoal-300 transition hover:text-bone">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-500">Encontranos</p>
            <address className="mt-4 space-y-2.5 text-sm not-italic text-charcoal-300">
              <p>
                {BUSINESS.address}
                <br />
                {BUSINESS.city}
              </p>
              <p>Todos los días · {formatRanges(BUSINESS_HOURS[1])}</p>
              <p>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="transition hover:text-bone">
                  WhatsApp {BUSINESS.whatsappDisplay}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.06] pt-8 text-xs text-charcoal-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {BUSINESS.name}. Precios en pesos argentinos, sujetos a disponibilidad.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/creditos" className="transition hover:text-charcoal-200">
              Créditos de fotografías
            </Link>
            <Link href="/login" className="transition hover:text-charcoal-200">
              Administración
            </Link>
            <span>
              Desarrollado por <span className="font-medium text-charcoal-300">Río Cuarto Web</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
