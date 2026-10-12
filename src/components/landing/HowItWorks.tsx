import React from 'react';
import { ClipboardCheck, ShoppingBag, Truck } from 'lucide-react';
import { SectionHeading } from './ui';

const STEPS = [
  {
    icon: ShoppingBag,
    title: 'Armá tu pedido',
    text: 'Elegí de la carta, la porción y la cantidad. Los precios y el stock se actualizan al momento.',
  },
  {
    icon: ClipboardCheck,
    title: 'Confirmá tus datos',
    text: 'Retiro en el local o envío a domicilio, el horario que prefieras y cómo vas a pagar.',
  },
  {
    icon: Truck,
    title: 'Retirá o recibí',
    text: 'Te confirmamos por WhatsApp. Si pagás por transferencia o Mercado Pago, ahí coordinamos el pago.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-pedir" aria-labelledby="como-pedir-title" className="relative border-t border-white/[0.05] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading id="como-pedir-title" eyebrow="Cómo pedir" title="Tres pasos y" accent="a la mesa" align="center" />
        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-3xl border border-white/[0.06] bg-charcoal-900/50 p-8">
              <span className="absolute right-7 top-6 font-display text-6xl italic text-white/[0.06]" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-fire-600/15 text-fire-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-6 font-display text-2xl text-bone">
                <span className="sr-only">Paso {i + 1}: </span>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-400">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
