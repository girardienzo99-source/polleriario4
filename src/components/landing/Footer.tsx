'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, MapPin, Phone, MessageCircle, Clock, Lock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="ubicacion" className="bg-charcoal-950 border-t border-charcoal-800 text-charcoal-300">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fire-500 to-crimson-600 flex items-center justify-center text-white shadow-glow">
                <Flame className="w-6 h-6" />
              </div>
              <span className="font-black text-lg text-white uppercase tracking-tight">
                Pollería <span className="text-fire-500">Los Campeones</span>
              </span>
            </div>
            <p className="text-xs text-charcoal-400 leading-relaxed font-normal">
              Especialistas en pollo al spiedo a la leña, rotisería gourmet y comidas preparadas artesanales con materia prima de primera calidad en Río Cuarto.
            </p>
            <div className="text-xs text-charcoal-400">
              <span className="text-white font-semibold">CUIT:</span> 30-71589412-9<br />
              <span className="text-white font-semibold">Habilitación:</span> Municipal N° 4492/20
            </div>
          </div>

          {/* Col 2: Horarios */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-fire-500" /> Horarios de Atención
            </h4>
            <ul className="text-xs space-y-2 text-charcoal-300">
              <li>
                <strong className="text-white">Martes a Sábados:</strong><br />
                Almuerzo: 11:30 a 14:30 hs<br />
                Cena: 20:00 a 23:30 hs
              </li>
              <li>
                <strong className="text-white">Domingos:</strong><br />
                Mediodía especial: 11:00 a 15:00 hs<br />
                Noche: 20:00 a 23:00 hs
              </li>
              <li className="text-charcoal-400 pt-1">
                Lunes cerrado por descanso de personal.
              </li>
            </ul>
          </div>

          {/* Col 3: Ubicación y Contacto */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-fire-500" /> Dónde Estamos
            </h4>
            <p className="text-xs text-charcoal-300">
              Av. Marcelo T. de Alvear 840<br />
              Río Cuarto, Córdoba, Argentina (CP 5800)
            </p>
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-fire-400" />
                <span className="text-white font-semibold">+54 358 464-8899</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <a
                  href="https://wa.me/5493585123456"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  WhatsApp: +54 9 358 512-3456
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Enlaces y Administración */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Información y Accesos
            </h4>
            <ul className="text-xs space-y-2">
              <li>
                <a href="#menu" className="hover:text-white transition">Menú completo</a>
              </li>
              <li>
                <a href="#promos" className="hover:text-white transition">Promociones familiares</a>
              </li>
              <li>
                <span className="text-charcoal-400">Zonas de reparto: Banda Norte, Centro, Alberdi, Quintas</span>
              </li>
              <li className="pt-2 border-t border-charcoal-800">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-charcoal-400 hover:text-fire-400 font-semibold transition"
                >
                  <Lock className="w-3.5 h-3.5" /> Acceso Administrativo (Login)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & dev credits */}
        <div className="mt-12 pt-6 border-t border-charcoal-800 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-400 gap-3">
          <div>
            © {new Date().getFullYear()} Pollería Los Campeones. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-1">
            Desarrollado profesionalmente por <strong className="text-white hover:text-fire-400 transition cursor-pointer">Río Cuarto Web</strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
