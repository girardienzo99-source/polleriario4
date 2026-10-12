'use client';

import React, { useEffect, useState } from 'react';
import { Bike, Clock, ExternalLink, MapPin } from 'lucide-react';
import { formatARS } from '@/lib/formatters';
import { useCart } from '@/context/CartContext';
import { BUSINESS, BUSINESS_HOURS, DAY_NAMES, WEEK_ORDER, formatRanges, nowInCordoba, whatsappLink } from './business';
import { useOpenStatus } from './hooks';
import { SectionHeading, WhatsAppIcon, cx } from './ui';

export function InfoSection() {
  const { activeZones, catalogReady } = useCart();
  const status = useOpenStatus();
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => setToday(nowInCordoba().day), []);

  return (
    <section id="ubicacion" aria-labelledby="ubicacion-title" className="relative border-t border-white/[0.05] bg-charcoal-900/30 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          id="ubicacion-title"
          eyebrow="Visitanos"
          title="Te esperamos en"
          accent="Alvear 840"
          description="Retirá en el local o pedí con envío a las zonas de Río Cuarto que figuran abajo."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          {/* Mapa */}
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-charcoal-900 lg:col-span-3">
            <iframe
              title={`Mapa: ${BUSINESS.address}, ${BUSINESS.city}`}
              src={BUSINESS.mapsEmbed}
              className="h-[320px] w-full grayscale-[35%] invert-[0.9] hue-rotate-180 sm:h-[420px] lg:h-full lg:min-h-[520px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Dirección y contacto */}
            <div className="rounded-[2rem] border border-white/[0.07] bg-charcoal-900/70 p-7">
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-fire-400" aria-hidden="true" />
                <div>
                  <p className="font-display text-2xl text-bone">{BUSINESS.address}</p>
                  <p className="text-sm text-charcoal-400">{BUSINESS.city}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={BUSINESS.mapsLink} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4 py-2.5">
                  Cómo llegar
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <a href={whatsappLink('Hola Los Campeones, tengo una consulta.')} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4 py-2.5">
                  <WhatsAppIcon className="h-4 w-4 text-emerald-400" />
                  {BUSINESS.whatsappDisplay}
                </a>
              </div>
            </div>

            {/* Horarios */}
            <div className="rounded-[2rem] border border-white/[0.07] bg-charcoal-900/70 p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-3 font-display text-xl text-bone">
                  <Clock className="h-5 w-5 text-fire-400" aria-hidden="true" />
                  Horarios
                </h3>
                {status && (
                  <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', status.isOpen ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-charcoal-400')}>
                    {status.isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
                  </span>
                )}
              </div>
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Horario de atención semanal</caption>
                <tbody>
                  {WEEK_ORDER.map(d => (
                    <tr key={d} className={cx('border-b border-white/[0.05] last:border-0', today === d && 'text-fire-200')}>
                      <th scope="row" className={cx('py-2.5 text-left font-medium', today === d ? 'text-fire-300' : 'text-charcoal-300')}>
                        {DAY_NAMES[d]}
                        {today === d && <span className="ml-2 text-[10px] uppercase tracking-wider text-fire-500">hoy</span>}
                      </th>
                      <td className="py-2.5 text-right tabular-nums text-charcoal-200">{formatRanges(BUSINESS_HOURS[d] ?? [])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Zonas de envío */}
            <div className="rounded-[2rem] border border-white/[0.07] bg-charcoal-900/70 p-7">
              <h3 className="flex items-center gap-3 font-display text-xl text-bone">
                <Bike className="h-5 w-5 text-fire-400" aria-hidden="true" />
                Zonas de envío
              </h3>
              {!catalogReady ? (
                <div className="mt-5 space-y-3" aria-hidden="true">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-charcoal-800" />
                  ))}
                </div>
              ) : activeZones.length === 0 ? (
                <p className="mt-4 text-sm text-charcoal-400">Por el momento sólo trabajamos con retiro en el local.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {activeZones.map(z => (
                    <li key={z.id} className="flex items-start justify-between gap-4 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-bone">{z.name}</p>
                        <p className="text-xs text-charcoal-400">
                          {z.description ? `${z.description} · ` : ''}~{z.estimated_minutes} min
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-lg tabular-nums text-fire-300">{formatARS(z.price)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
