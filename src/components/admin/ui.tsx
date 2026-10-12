'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, Inbox, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { STORE_EVENT } from '@/lib/data/storage';

/** Re-renderiza cuando cambia el almacenamiento (misma pestaña u otra pestaña). */
export function useStoreVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV(x => x + 1);
    window.addEventListener(STORE_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(STORE_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  return v;
}

/** Lee un valor del store y lo mantiene actualizado (sólo en cliente). */
export function useStoreValue<T>(read: () => T, fallback: T): T {
  const v = useStoreVersion();
  const [val, setVal] = useState<T>(fallback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setVal(read()), [v]);
  return val;
}

/** Re-render periódico (tiempos transcurridos, reloj). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// ------------------------------------------------------------------ toasts
type Toast = { id: number; kind: 'ok' | 'error' | 'info'; text: string };
const TOAST_EVENT = 'polleria_toast';

export function toast(text: string, kind: Toast['kind'] = 'ok') {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { text, kind } }));
}

/** Ejecuta una acción del store mostrando el error de negocio si falla. */
export function run(fn: () => void, okMessage?: string): boolean {
  try {
    fn();
    if (okMessage) toast(okMessage, 'ok');
    return true;
  } catch (e) {
    toast(e instanceof Error ? e.message : 'Ocurrió un error', 'error');
    return false;
  }
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<Toast, 'id'>;
      const id = Date.now() + Math.random();
      setItems(prev => [...prev, { id, ...d }]);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), d.kind === 'error' ? 6000 : 3500);
    };
    window.addEventListener(TOAST_EVENT, on);
    return () => window.removeEventListener(TOAST_EVENT, on);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" aria-live="polite">
      {items.map(t => {
        const Icon = t.kind === 'error' ? AlertTriangle : t.kind === 'ok' ? CheckCircle2 : Info;
        const cls = t.kind === 'error' ? 'border-red-500/40 text-red-200' : t.kind === 'ok' ? 'border-emerald-500/40 text-emerald-200' : 'border-sky-500/40 text-sky-200';
        return (
          <div key={t.id} className={`flex items-start gap-2.5 rounded-xl border bg-charcoal-900/95 backdrop-blur px-4 py-3 text-xs font-semibold shadow-2xl animate-[fadeIn_.2s_ease-out] ${cls}`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ layout
export function PageHeader({ title, subtitle, actions, icon: Icon }: { title: string; subtitle?: string; actions?: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-fire-500/10 border border-fire-500/20 flex items-center justify-center text-fire-400 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-charcoal-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '', title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-charcoal-800 bg-charcoal-900/70 ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-charcoal-800/70">
          {title && <h2 className="text-sm font-bold text-white">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ElementType; tone?: 'default' | 'fire' | 'green' | 'red' | 'amber' | 'blue' }) {
  const tones: Record<string, string> = {
    default: 'text-charcoal-300 bg-charcoal-800',
    fire: 'text-fire-400 bg-fire-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    red: 'text-red-400 bg-red-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-sky-400 bg-sky-500/10',
  };
  return (
    <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/70 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">{label}</span>
        {Icon && <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon className="w-4 h-4" /></span>}
      </div>
      <div className="text-2xl font-black text-white tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-charcoal-400 mt-1">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, text, icon: Icon = Inbox, action }: { title: string; text?: string; icon?: React.ElementType; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="w-12 h-12 rounded-2xl bg-charcoal-800 flex items-center justify-center text-charcoal-400 mb-3"><Icon className="w-6 h-6" /></div>
      <p className="text-sm font-bold text-white">{title}</p>
      {text && <p className="text-xs text-charcoal-400 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export function Button({ variant = 'secondary', className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white shadow-glow',
    secondary: 'bg-charcoal-800 hover:bg-charcoal-700 text-white border border-charcoal-700',
    ghost: 'text-charcoal-300 hover:text-white hover:bg-charcoal-800',
    danger: 'bg-red-600/90 hover:bg-red-600 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  };
  return (
    <button {...props} className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${v[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'fire' | 'green' | 'red' | 'amber' | 'blue' | 'violet' }) {
  const t: Record<string, string> = {
    default: 'bg-charcoal-800 text-charcoal-300 border-charcoal-700',
    fire: 'bg-fire-500/10 text-fire-300 border-fire-500/30',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    red: 'bg-red-500/10 text-red-300 border-red-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  };
  return <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t[tone]}`}>{children}</span>;
}

export function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-charcoal-300 mb-1">{label}</span>
      {children}
      {error ? <span className="block text-[11px] text-red-400 mt-1">{error}</span> : hint ? <span className="block text-[11px] text-charcoal-500 mt-1">{hint}</span> : null}
    </label>
  );
}

export const inputCls = 'w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 focus:ring-2 focus:ring-fire-500/20 transition';

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const onKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onKey]);
  if (!open) return null;
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${w} max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-charcoal-800 bg-charcoal-900 shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-800">
          <h3 className="text-sm font-black text-white">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-charcoal-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: React.ReactNode }) {
  const hasRows = React.Children.count(children) > 0;
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-charcoal-800">
            {head.map((h, i) => <th key={i} className="px-5 py-2.5 font-bold whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-charcoal-800/70">{children}</tbody>
      </table>
      {!hasRows && empty}
    </div>
  );
}
