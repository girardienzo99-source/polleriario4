'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Lock, Mail, Eye, EyeOff, ArrowLeft, Info, Loader2, ArrowRight } from 'lucide-react';
import { useAuth, DEMO_USERS, DEMO_PASSWORD } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/domain/permissions';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady, mode, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace('/admin');
  }, [isReady, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo iniciar sesión.');
      return;
    }
    router.replace('/admin');
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setNotice(null);
    setIsLoading(true);
    const res = await login(demoEmail, DEMO_PASSWORD);
    setIsLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo iniciar sesión.');
      return;
    }
    router.replace('/admin');
  };

  const handleReset = async () => {
    setError(null);
    const r = await requestPasswordReset(email);
    if (r.ok) setNotice(r.message);
    else setError(r.message);
  };

  return (
    <div className="min-h-screen bg-charcoal-950 grid lg:grid-cols-2">
      {/* Imagen lateral en escritorio */}
      <div className="relative hidden lg:block">
        <Image src="/images/parrilla-fuego.jpg" alt="Pollos asados a la parrilla con leña" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/40 to-charcoal-950/10" />
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <p className="text-fire-400 text-xs font-bold uppercase tracking-[0.25em] mb-3">Pollería PRO</p>
          <h1 className="text-4xl font-black text-white leading-tight max-w-md">
            Toda la operación de tu pollería, en un solo lugar.
          </h1>
          <p className="text-charcoal-300 text-sm mt-3 max-w-md">Punto de venta, cocina, productos, stock, precios, caja y facturación ARCA.</p>
        </div>
      </div>

      {/* Formulario optimizado para teléfono, tablet y escritorio */}
      <div className="relative flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mb-6 flex items-center justify-between lg:mb-0">
          <Link href="/" className="lg:absolute lg:top-6 lg:left-6 inline-flex items-center gap-2 rounded-full border border-charcoal-800 bg-charcoal-900/80 px-3.5 py-2 text-xs font-bold text-charcoal-300 hover:text-white hover:border-charcoal-700 transition">
            <ArrowLeft className="w-4 h-4" /> Volver a la tienda
          </Link>
          <span className="lg:hidden text-[11px] font-bold uppercase tracking-wider text-fire-400">Pollería PRO</span>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fire-500 to-crimson-600 flex items-center justify-center text-white shadow-glow shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Ingresar al sistema</h2>
              <p className="text-xs text-charcoal-400">Panel administrativo e integral (móvil, tablet y PC)</p>
            </div>
          </div>

          {error && <div role="alert" className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl font-semibold">{error}</div>}
          {notice && <div role="status" className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-semibold">{notice}</div>}

          {mode === 'demo' && (
            <div className="mb-6 rounded-2xl border border-fire-500/30 bg-charcoal-900/90 p-4 shadow-lg">
              <div className="flex items-start gap-2 text-fire-300 text-xs font-bold mb-1.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-fire-400" />
                Acceso rápido 1-toque (Modo Demo)
              </div>
              <p className="text-[11px] text-charcoal-300 mb-3 leading-relaxed">
                Tocá cualquier perfil para entrar directo desde tu teléfono o tablet (contraseña: <code className="text-white bg-charcoal-800 px-1.5 py-0.5 rounded">{DEMO_PASSWORD}</code>):
              </p>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_USERS.map(u => (
                  <button
                    key={u.email}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleQuickDemoLogin(u.email)}
                    className="group flex items-center justify-between text-left text-xs px-3.5 py-3 rounded-xl bg-charcoal-950 border border-charcoal-800 hover:border-fire-500 active:scale-[0.99] transition"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block font-bold text-white group-hover:text-fire-300 transition">{ROLE_LABELS[u.role]}</span>
                      <span className="block text-[11px] text-charcoal-400 truncate">{u.email}</span>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-fire-600/20 border border-fire-500/30 group-hover:bg-fire-600 px-2.5 py-1.5 text-[11px] font-bold text-fire-300 group-hover:text-white transition">
                      Entrar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-charcoal-300 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
                <input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@polleria.com"
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl pl-10 pr-3.5 py-3 text-base sm:text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 focus:ring-2 focus:ring-fire-500/20 transition" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="text-xs font-bold text-charcoal-300">Contraseña</label>
                <button type="button" onClick={handleReset} className="text-[11px] text-fire-400 hover:underline">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl pl-10 pr-10 py-3 text-base sm:text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 focus:ring-2 focus:ring-fire-500/20 transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-white p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black py-3.5 rounded-xl shadow-glow text-xs uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-60">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Verificando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-charcoal-500">Pollería PRO · Desarrollado por Río Cuarto Web</p>
        </div>
      </div>
    </div>
  );
}
