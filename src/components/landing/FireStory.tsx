import React from 'react';
import Image from 'next/image';
import { ChefHat, Flame, Timer } from 'lucide-react';

const VALUES = [
  {
    icon: Timer,
    title: 'Marinado 12 horas',
    text: 'Cada pollo descansa toda la noche en adobo criollo con ajo, limón y pimentón antes de ir al fuego.',
  },
  {
    icon: Flame,
    title: 'Leña de quebracho',
    text: 'Brasa firme y pareja que dora la piel despacio y le da ese aroma ahumado que no se consigue con gas.',
  },
  {
    icon: ChefHat,
    title: 'Recetas caseras',
    text: 'Papas peladas en el día, empanadas de masa propia y salsas hechas en nuestra cocina.',
  },
];

export function FireStory() {
  return (
    <section id="fuego" aria-labelledby="fuego-title" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(127,29,29,0.25),transparent_60%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-card sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="/images/parrilla-fuego.jpg"
              alt="Pollos asados dorándose sobre brasas de leña"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 font-display text-2xl italic leading-snug text-bone sm:text-3xl">
              El secreto es no apurar el fuego.
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-full bg-fire-600/30 blur-3xl" />
        </div>

        <div>
          <p className="eyebrow">Nuestro fuego</p>
          <h2 id="fuego-title" className="mt-4 font-display text-4xl font-medium leading-[1.05] tracking-tight text-bone sm:text-5xl">
            Tiempo, brasa y <em className="font-normal italic text-fire-400">paciencia</em>.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-charcoal-300 sm:text-lg">
            En Los Campeones cocinamos como manda el auténtico asado argentino: sin apuros ni atajos. El pollo se dora
            lentamente sobre brasas de leña de quebracho y anchico, el adobo criollo penetra la carne y la piel queda crocante
            mientras mantiene todo su jugo natural.
          </p>

          <ul className="mt-10 space-y-6">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-fire-500/25 bg-gradient-to-br from-fire-600/20 to-crimson-900/20 text-fire-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-xl text-bone">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
