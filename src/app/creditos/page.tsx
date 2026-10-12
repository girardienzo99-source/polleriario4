import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import credits from '@/lib/data/image-credits.json';

export const metadata = {
  title: 'Créditos de fotografías | Pollería Los Campeones',
  description: 'Atribución y licencias Creative Commons de las fotografías reales utilizadas en el catálogo.',
};

interface CreditItem {
  file: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  source: string;
}

export default function CreditosPage() {
  const items = credits as CreditItem[];

  return (
    <main className="min-h-screen bg-charcoal-950 text-charcoal-100">
      <header className="border-b border-white/[0.06] bg-charcoal-900/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-bone transition hover:border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a la carta
          </Link>
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fire-400">Transparencia</span>
            <p className="font-display text-lg text-bone">Pollería Los Campeones</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-fire-400">Atribución de autoría</span>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-bone sm:text-4xl">
            Créditos de fotografías
          </h1>
          <p className="mt-4 text-base leading-relaxed text-charcoal-300">
            En Pollería Los Campeones utilizamos fotografías reales y auténticas de platos gastronómicos.
            En cumplimiento con las licencias Creative Commons (CC BY / CC BY-SA) y términos de Dominio Público,
            detallamos a continuación el autor, título, tipo de licencia y enlace a la fuente original en Wikimedia Commons.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.file}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-charcoal-900/60 transition hover:border-white/15"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-charcoal-800">
                <Image
                  src={item.file}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-base font-semibold leading-snug text-bone" title={item.title}>
                  {item.title}
                </h2>

                <dl className="mt-4 flex-1 space-y-2 text-xs">
                  <div>
                    <dt className="text-charcoal-500">Autor</dt>
                    <dd className="font-medium text-charcoal-200">{item.author}</dd>
                  </div>

                  <div>
                    <dt className="text-charcoal-500">Licencia</dt>
                    <dd className="font-medium text-fire-400">
                      {item.licenseUrl ? (
                        <a
                          href={item.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-fire-300"
                        >
                          {item.license}
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span>{item.license}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-charcoal-200 transition hover:border-white/20 hover:bg-white/10 hover:text-bone"
                  >
                    Ver en Wikimedia Commons
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
