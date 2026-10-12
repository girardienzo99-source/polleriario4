'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Flame, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ChefHat, 
  DollarSign, 
  Bike, 
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/database';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@polleria.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completá todos los campos.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      login(email);
      setIsLoading(false);
      router.push('/admin');
    }, 400);
  };

  const handleQuickLogin = (quickEmail: string, role: UserRole) => {
    setEmail(quickEmail);
    login(quickEmail, role);
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-fire-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Return to landing */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-charcoal-400 hover:text-white bg-charcoal-900 border border-charcoal-800 px-3.5 py-2 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Tienda
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fire-500 to-crimson-600 flex items-center justify-center text-white mx-auto shadow-glow">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Acceso al Sistema Administrativo
          </h2>
          <p className="text-xs text-charcoal-400">
            POLLERÍA PRO — Plataforma de Gestión Gastronómica
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">
                Correo Electrónico o Usuario
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@polleria.com"
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-charcoal-300">Contraseña</label>
                <button
                  type="button"
                  onClick={() => alert('Para reestablecer tu contraseña, contactá al Administrador en admin@polleria.com')}
                  className="text-[11px] text-fire-400 hover:underline"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black py-3 rounded-xl shadow-glow text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="mt-6 pt-6 border-t border-charcoal-800">
            <span className="text-[11px] text-charcoal-400 font-bold uppercase tracking-wider block mb-3 text-center">
              Acceso Rápido Demostrativo por Rol:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@polleria.com', 'admin')}
                className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500 text-left transition flex items-center gap-2 group"
              >
                <ShieldCheck className="w-4 h-4 text-fire-500 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-fire-400">Admin</div>
                  <div className="text-[10px] text-charcoal-400">Total</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('encargado@polleria.com', 'encargado')}
                className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500 text-left transition flex items-center gap-2 group"
              >
                <UserCheck className="w-4 h-4 text-amberGold-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-fire-400">Encargada</div>
                  <div className="text-[10px] text-charcoal-400">Stock & Pedidos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cajero@polleria.com', 'cajero')}
                className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500 text-left transition flex items-center gap-2 group"
              >
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-fire-400">Cajero POS</div>
                  <div className="text-[10px] text-charcoal-400">Ventas & Caja</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cocina@polleria.com', 'cocinero')}
                className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500 text-left transition flex items-center gap-2 group"
              >
                <ChefHat className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[11px] truncate group-hover:text-fire-400">Cocina KDS</div>
                  <div className="text-[10px] text-charcoal-400">Spiedo & Horno</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('repartidor@polleria.com', 'repartidor')}
                className="col-span-2 p-2 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500 text-left transition flex items-center justify-center gap-2 group"
              >
                <Bike className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-bold text-white text-[11px] group-hover:text-fire-400">
                  Repartidor (Entregas y delivery)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-charcoal-500">
          Pollería Los Campeones • Río Cuarto Web
        </p>
      </div>
    </div>
  );
}
