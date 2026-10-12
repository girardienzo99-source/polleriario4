'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { AlertCircle, ArrowLeft, Banknote, CheckCircle2, CreditCard, Landmark, Loader2, Smartphone, Store, Truck, Wallet, X } from 'lucide-react';
import type { Order } from '@/types/database';
import type { CheckoutFormValues } from '@/types/cart';
import { formatARS } from '@/lib/formatters';
import { useCart } from '@/context/CartContext';
import { ASAP, BUSINESS, getOpenStatus, getTimeSlots, whatsappLink } from './business';
import { useOverlay } from './hooks';
import { WhatsAppIcon, cx } from './ui';

type PayMethod = CheckoutFormValues['paymentMethod'];

const PAYMENT_OPTIONS: { value: PayMethod; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote, hint: 'Pagás al retirar o al recibir. Si necesitás cambio, avisanos en observaciones.' },
  { value: 'transferencia', label: 'Transferencia', icon: Landmark, hint: 'Te enviamos alias y CBU por WhatsApp al confirmar. No se cobra nada en esta web.' },
  { value: 'mercadopago', label: 'Mercado Pago', icon: Smartphone, hint: 'Te mandamos el link o alias de Mercado Pago por WhatsApp. No se cobra nada en esta web.' },
  { value: 'debito', label: 'Débito', icon: CreditCard, hint: 'Con posnet al retirar en el local o al recibir el pedido.' },
  { value: 'credito', label: 'Crédito', icon: Wallet, hint: 'Con posnet al retirar en el local o al recibir el pedido.' },
];

const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(PAYMENT_OPTIONS.map(o => [o.value, o.label]));

const schema = z
  .object({
    customerName: z.string().trim().min(2, 'Ingresá tu nombre y apellido').max(80, 'Máximo 80 caracteres'),
    customerPhone: z
      .string()
      .trim()
      .refine(v => {
        const d = v.replace(/\D/g, '');
        return d.length >= 8 && d.length <= 15;
      }, 'Ingresá un teléfono válido con característica (ej. 358 512-3456)'),
    deliveryType: z.enum(['retiro', 'delivery']),
    deliveryZoneId: z.string().optional(),
    customerAddress: z.string().trim().max(160, 'Máximo 160 caracteres').optional(),
    addressReferences: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
    requestedTime: z.string().min(1, 'Elegí un horario'),
    paymentMethod: z.enum(['efectivo', 'transferencia', 'mercadopago', 'debito', 'credito'], { errorMap: () => ({ message: 'Elegí un medio de pago' }) }),
    orderNotes: z.string().trim().max(300, 'Máximo 300 caracteres').optional(),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryType !== 'delivery') return;
    if (!v.customerAddress || v.customerAddress.length < 5) ctx.addIssue({ code: 'custom', path: ['customerAddress'], message: 'Ingresá calle y número' });
    if (!v.addressReferences || v.addressReferences.length < 3)
      ctx.addIssue({ code: 'custom', path: ['addressReferences'], message: 'Agregá una referencia (entre calles, timbre, color de casa…)' });
    if (!v.deliveryZoneId) ctx.addIssue({ code: 'custom', path: ['deliveryZoneId'], message: 'Elegí tu zona de envío' });
  });

type Errors = Partial<Record<keyof CheckoutFormValues, string>>;

const CUSTOMER_KEY = 'polleria_checkout_customer';

interface Draft {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  addressReferences: string;
  requestedTime: string;
  paymentMethod: PayMethod | '';
  orderNotes: string;
}

const EMPTY_DRAFT: Draft = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  addressReferences: '',
  requestedTime: ASAP,
  paymentMethod: '',
  orderNotes: '',
};

function buildWhatsAppMessage(order: Order, form: CheckoutFormValues): string {
  const lines = [
    `*Pedido ${order.order_number}* — ${BUSINESS.name}`,
    '',
    `Cliente: ${order.customer_name} (${order.customer_phone})`,
    order.delivery_type === 'delivery'
      ? `Envío a: ${order.customer_address}${order.delivery_zone_name ? ` — ${order.delivery_zone_name}` : ''}`
      : `Retiro en el local (${BUSINESS.address})`,
    ...(order.delivery_type === 'delivery' && form.addressReferences ? [`Referencias: ${form.addressReferences}`] : []),
    `Horario: ${order.requested_time ?? ASAP}`,
    `Pago: ${PAYMENT_LABEL[order.payment_method] ?? order.payment_method}`,
    '',
    ...order.items.map(i => `• ${i.quantity} × ${i.product_name} — ${formatARS(i.subtotal)}`),
    '',
    `Subtotal: ${formatARS(order.subtotal)}`,
    ...(order.discount > 0 ? [`Descuento: −${formatARS(order.discount)}`] : []),
    ...(order.delivery_type === 'delivery' ? [`Envío: ${formatARS(order.delivery_fee)}`] : []),
    `*Total: ${formatARS(order.total)}*`,
    ...(form.orderNotes ? ['', `Observaciones: ${form.orderNotes}`] : []),
  ];
  return lines.join('\n');
}

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    openCart,
    lines,
    totals,
    discountPercent,
    couponCode,
    deliveryType,
    setDeliveryType,
    zoneId,
    setZoneId,
    activeZones,
    submitOrder,
    hasUnavailable,
  } = useCart();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ order: Order; form: CheckoutFormValues } | null>(null);

  const handleClose = () => {
    closeCheckout();
    if (result) setResult(null);
  };
  const panelRef = useOverlay<HTMLDivElement>(isCheckoutOpen, handleClose);

  // Recuperar datos del cliente de pedidos anteriores en este dispositivo.
  useEffect(() => {
    if (!isCheckoutOpen) return;
    setSubmitError('');
    setErrors({});
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
      if (saved) setDraft(d => ({ ...d, ...saved, requestedTime: ASAP, orderNotes: '' }));
    } catch {
      /* sin datos guardados */
    }
  }, [isCheckoutOpen]);

  const slots = useMemo(() => (isCheckoutOpen ? getTimeSlots() : []), [isCheckoutOpen]);
  const openStatus = useMemo(() => (isCheckoutOpen ? getOpenStatus() : null), [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft(d => ({ ...d, [key]: value }));
    if (errors[key as keyof Errors]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const selectedZone = activeZones.find(z => z.id === zoneId);
  const payment = PAYMENT_OPTIONS.find(o => o.value === draft.paymentMethod);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const parsed = schema.safeParse({
      ...draft,
      deliveryType,
      deliveryZoneId: deliveryType === 'delivery' ? zoneId || undefined : undefined,
      paymentMethod: draft.paymentMethod || undefined,
    });
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Errors;
        if (k && !errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) document.getElementById(`co-${first}`)?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const form = parsed.data as CheckoutFormValues;
      const order = submitOrder(form);
      try {
        localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({
            customerName: form.customerName,
            customerPhone: form.customerPhone,
            customerAddress: form.customerAddress ?? '',
            addressReferences: form.addressReferences ?? '',
            paymentMethod: form.paymentMethod,
          }),
        );
      } catch {
        /* almacenamiento lleno o bloqueado: no es crítico */
      }
      setResult({ order, form });
      setDraft(d => ({ ...d, orderNotes: '', requestedTime: ASAP }));
      import('canvas-confetti')
        .then(m => m.default({ particleCount: 110, spread: 75, origin: { y: 0.35 }, colors: ['#ea580c', '#f97316', '#b91c1c', '#f5efe6'] }))
        .catch(() => undefined);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos registrar el pedido. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`co-${k}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-crimson-300">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Errors) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `co-${k}-error` : undefined });

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        className="relative flex max-h-[100dvh] w-full max-w-5xl animate-scale-in flex-col overflow-hidden bg-charcoal-950 shadow-2xl focus:outline-none sm:max-h-[92vh] sm:rounded-[2rem] sm:border sm:border-white/[0.08]"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            {!result && (
              <button
                type="button"
                onClick={openCart}
                aria-label="Volver al carrito"
                className="grid h-9 w-9 place-items-center rounded-full text-charcoal-400 transition hover:bg-white/5 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <h2 id="checkout-title" className="font-display text-2xl text-bone">
              {result ? 'Pedido recibido' : 'Finalizar pedido'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-charcoal-300 transition hover:bg-white/5 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {result ? (
          <SuccessView order={result.order} form={result.form} onClose={handleClose} />
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center px-8 py-20 text-center">
            <p className="font-display text-2xl text-bone">Tu carrito está vacío</p>
            <p className="mt-2 text-sm text-charcoal-400">Agregá productos de la carta para hacer tu pedido.</p>
            <button type="button" onClick={handleClose} className="btn-primary mt-8">
              Ver la carta
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr_380px] lg:overflow-hidden">
            {/* Formulario */}
            <div className="space-y-9 px-5 py-7 sm:px-8 lg:overflow-y-auto">
              {/* Datos */}
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-fire-400">1 · Tus datos</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="co-customerName" className="mb-1.5 block text-sm text-charcoal-300">
                      Nombre y apellido
                    </label>
                    <input
                      id="co-customerName"
                      value={draft.customerName}
                      onChange={e => set('customerName', e.target.value)}
                      autoComplete="name"
                      className={cx('field', errors.customerName && 'field-error')}
                      {...aria('customerName')}
                    />
                    {err('customerName')}
                  </div>
                  <div>
                    <label htmlFor="co-customerPhone" className="mb-1.5 block text-sm text-charcoal-300">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="co-customerPhone"
                      type="tel"
                      inputMode="tel"
                      value={draft.customerPhone}
                      onChange={e => set('customerPhone', e.target.value)}
                      placeholder="358 512-3456"
                      autoComplete="tel"
                      className={cx('field', errors.customerPhone && 'field-error')}
                      {...aria('customerPhone')}
                    />
                    {err('customerPhone')}
                  </div>
                </div>
              </fieldset>

              {/* Entrega */}
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-fire-400">2 · Entrega</legend>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { v: 'retiro' as const, label: 'Retiro en el local', sub: BUSINESS.address, icon: Store },
                    { v: 'delivery' as const, label: 'Envío a domicilio', sub: activeZones.length ? 'Según zona' : 'No disponible', icon: Truck },
                  ].map(o => {
                    const disabled = o.v === 'delivery' && activeZones.length === 0;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        aria-pressed={deliveryType === o.v}
                        disabled={disabled}
                        onClick={() => setDeliveryType(o.v)}
                        className={cx(
                          'flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400 disabled:cursor-not-allowed disabled:opacity-40',
                          deliveryType === o.v ? 'border-fire-500 bg-fire-600/10' : 'border-white/10 hover:border-white/25',
                        )}
                      >
                        <o.icon className={cx('h-5 w-5', deliveryType === o.v ? 'text-fire-400' : 'text-charcoal-400')} aria-hidden="true" />
                        <span className="mt-1 text-sm font-semibold text-bone">{o.label}</span>
                        <span className="text-xs text-charcoal-400">{o.sub}</span>
                      </button>
                    );
                  })}
                </div>

                {deliveryType === 'delivery' && (
                  <div className="mt-4 grid animate-fade-in gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="co-deliveryZoneId" className="mb-1.5 block text-sm text-charcoal-300">
                        Zona de envío
                      </label>
                      <select
                        id="co-deliveryZoneId"
                        value={zoneId}
                        onChange={e => {
                          setZoneId(e.target.value);
                          setErrors(x => ({ ...x, deliveryZoneId: undefined }));
                        }}
                        className={cx('field', errors.deliveryZoneId && 'field-error')}
                        {...aria('deliveryZoneId')}
                      >
                        {activeZones.map(z => (
                          <option key={z.id} value={z.id}>
                            {z.name} — {formatARS(z.price)} · ~{z.estimated_minutes} min
                          </option>
                        ))}
                      </select>
                      {selectedZone?.description && <p className="mt-1.5 text-xs text-charcoal-500">{selectedZone.description}</p>}
                      {err('deliveryZoneId')}
                    </div>
                    <div>
                      <label htmlFor="co-customerAddress" className="mb-1.5 block text-sm text-charcoal-300">
                        Dirección
                      </label>
                      <input
                        id="co-customerAddress"
                        value={draft.customerAddress}
                        onChange={e => set('customerAddress', e.target.value)}
                        placeholder="Calle y número, depto."
                        autoComplete="street-address"
                        className={cx('field', errors.customerAddress && 'field-error')}
                        {...aria('customerAddress')}
                      />
                      {err('customerAddress')}
                    </div>
                    <div>
                      <label htmlFor="co-addressReferences" className="mb-1.5 block text-sm text-charcoal-300">
                        Referencias
                      </label>
                      <input
                        id="co-addressReferences"
                        value={draft.addressReferences}
                        onChange={e => set('addressReferences', e.target.value)}
                        placeholder="Entre calles, timbre, color de casa…"
                        className={cx('field', errors.addressReferences && 'field-error')}
                        {...aria('addressReferences')}
                      />
                      {err('addressReferences')}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label htmlFor="co-requestedTime" className="mb-1.5 block text-sm text-charcoal-300">
                    Fecha y horario
                  </label>
                  <select
                    id="co-requestedTime"
                    value={draft.requestedTime}
                    onChange={e => set('requestedTime', e.target.value)}
                    className={cx('field', errors.requestedTime && 'field-error')}
                    {...aria('requestedTime')}
                  >
                    <option value={ASAP}>{ASAP}</option>
                    {slots.map(s => (
                      <option key={s} value={s}>
                        {s} hs
                      </option>
                    ))}
                  </select>
                  {openStatus && !openStatus.isOpen && draft.requestedTime === ASAP && (
                    <p className="mt-1.5 text-xs text-amberGold-300">
                      Ahora estamos cerrados ({openStatus.label.replace('Cerrado · ', '')}). Lo preparamos apenas abramos, o elegí un horario.
                    </p>
                  )}
                  {err('requestedTime')}
                </div>
              </fieldset>

              {/* Pago */}
              <fieldset>
                <legend id="co-paymentMethod-legend" className="text-xs font-semibold uppercase tracking-[0.2em] text-fire-400">
                  3 · Medio de pago
                </legend>
                <div
                  id="co-paymentMethod"
                  tabIndex={-1}
                  role="radiogroup"
                  aria-labelledby="co-paymentMethod-legend"
                  {...aria('paymentMethod')}
                  className="mt-4 grid grid-cols-2 gap-2.5 focus:outline-none sm:grid-cols-3"
                >
                  {PAYMENT_OPTIONS.map(o => {
                    const selected = draft.paymentMethod === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => set('paymentMethod', o.value)}
                        className={cx(
                          'flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-400',
                          selected ? 'border-fire-500 bg-fire-600/10 text-bone' : 'border-white/10 text-charcoal-300 hover:border-white/25',
                        )}
                      >
                        <o.icon className={cx('h-4 w-4 shrink-0', selected ? 'text-fire-400' : 'text-charcoal-500')} aria-hidden="true" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {payment && <p className="mt-3 rounded-xl bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-charcoal-300">{payment.hint}</p>}
                {err('paymentMethod')}
              </fieldset>

              {/* Observaciones */}
              <div>
                <label htmlFor="co-orderNotes" className="text-xs font-semibold uppercase tracking-[0.2em] text-fire-400">
                  4 · Observaciones <span className="font-normal normal-case tracking-normal text-charcoal-500">(opcional)</span>
                </label>
                <textarea
                  id="co-orderNotes"
                  value={draft.orderNotes}
                  onChange={e => set('orderNotes', e.target.value)}
                  rows={3}
                  placeholder="Ej.: sin sal, cortado en presas, pago con $20.000…"
                  className={cx('field mt-3 resize-none', errors.orderNotes && 'field-error')}
                  {...aria('orderNotes')}
                />
                {err('orderNotes')}
              </div>
            </div>

            {/* Resumen */}
            <aside className="border-t border-white/[0.06] bg-charcoal-900/50 px-5 py-7 sm:px-8 lg:flex lg:flex-col lg:overflow-y-auto lg:border-l lg:border-t-0">
              <h3 className="font-display text-xl text-bone">Resumen</h3>
              <ul className="mt-5 space-y-3">
                {lines.map(l => (
                  <li key={l.key} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-charcoal-800">
                      <Image src={l.product.image_url} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-bone">
                        {l.quantity} × {l.displayName}
                      </p>
                      {l.variant && <p className="text-xs text-charcoal-500">{l.variant.name}</p>}
                    </div>
                    <p className="text-sm tabular-nums text-charcoal-200">{formatARS(l.subtotal)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 space-y-2 border-t border-white/[0.06] pt-4 text-sm">
                <div className="flex justify-between text-charcoal-300">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatARS(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <dt>
                      Cupón {couponCode} ({discountPercent}%)
                    </dt>
                    <dd className="tabular-nums">−{formatARS(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-charcoal-300">
                  <dt>{deliveryType === 'delivery' ? 'Envío' : 'Retiro en el local'}</dt>
                  <dd className="tabular-nums">{deliveryType === 'delivery' ? formatARS(totals.deliveryFee) : 'Sin cargo'}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/[0.06] pt-3">
                  <dt className="font-medium text-bone">Total</dt>
                  <dd className="font-display text-3xl tabular-nums text-bone">{formatARS(totals.total)}</dd>
                </div>
              </dl>

              <div className="mt-auto pt-6">
                {submitError && (
                  <div role="alert" className="mb-4 flex gap-2.5 rounded-xl border border-crimson-500/40 bg-crimson-950/40 px-4 py-3 text-sm text-crimson-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}
                {hasUnavailable && (
                  <p role="alert" className="mb-4 text-xs text-crimson-300">
                    Hay productos sin stock suficiente. Volvé al carrito para ajustarlos.
                  </p>
                )}
                <button type="submit" disabled={submitting || hasUnavailable} className="btn-primary w-full py-4 text-base">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Enviando…
                    </>
                  ) : (
                    `Confirmar pedido · ${formatARS(totals.total)}`
                  )}
                </button>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-charcoal-500">
                  No se realiza ningún cobro en esta web. El pago se coordina al confirmar el pedido.
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

function SuccessView({ order, form, onClose }: { order: Order; form: CheckoutFormValues; onClose: () => void }) {
  const wa = whatsappLink(buildWhatsAppMessage(order, form));
  return (
    <div className="overflow-y-auto px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-charcoal-400">Número de pedido</p>
        <p className="mt-1 font-display text-5xl text-bone" aria-live="polite">
          {order.order_number}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-charcoal-300">
          ¡Gracias, {order.customer_name.split(' ')[0]}! Registramos tu pedido. Envianos el resumen por WhatsApp para que lo confirmemos más rápido
          {order.payment_method === 'transferencia' || order.payment_method === 'mercadopago' ? ' y te pasemos los datos de pago' : ''}.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-white/[0.07] bg-charcoal-900/60 p-5 text-sm">
        <ul className="space-y-2">
          {order.items.map(i => (
            <li key={i.id} className="flex justify-between gap-3 text-charcoal-200">
              <span>
                {i.quantity} × {i.product_name}
              </span>
              <span className="tabular-nums">{formatARS(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4 text-charcoal-400">
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-300">
              <dt>Descuento</dt>
              <dd className="tabular-nums">−{formatARS(order.discount)}</dd>
            </div>
          )}
          {order.delivery_type === 'delivery' && (
            <div className="flex justify-between">
              <dt>Envío ({order.delivery_zone_name})</dt>
              <dd className="tabular-nums">{formatARS(order.delivery_fee)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Entrega</dt>
            <dd>{order.delivery_type === 'delivery' ? order.customer_address : 'Retiro en el local'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Horario</dt>
            <dd>{order.requested_time}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Pago</dt>
            <dd>{PAYMENT_LABEL[order.payment_method] ?? order.payment_method}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-medium text-bone">Total</dt>
            <dd className="font-display text-2xl tabular-nums text-bone">{formatARS(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          data-autofocus
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-950"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Enviar por WhatsApp
        </a>
        <button type="button" onClick={onClose} className="btn-ghost flex-1 py-4">
          Volver a la carta
        </button>
      </div>
    </div>
  );
}
