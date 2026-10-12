'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, Trash2, Plus, Minus, Printer, FileText, Store, Lock, X } from 'lucide-react';
import { Product, ProductVariant, PaymentMethod } from '@/types/database';
import { PolleriaStore, costOf } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';
import { computeCartTotals, MAX_DISCOUNT_PERCENT } from '@/lib/domain/pricing';
import { emitFiscalForSale, receiverFromCustomer } from '@/lib/arca/emit';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';
import { useAuth } from '@/context/AuthContext';
import { canAccess } from '@/lib/domain/permissions';
import { Button, Badge, EmptyState, inputCls, Modal, toast, useStoreVersion } from '../ui';

interface PosLine {
  key: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
  { id: 'mercadopago', label: 'Mercado Pago' },
  { id: 'transferencia', label: 'Transferencia' },
];

function stockInfo(p: Product): { tracked: boolean; available: number } {
  const tracked = p.stock_mode === 'batch' || p.stock_mode === 'simple';
  return { tracked, available: p.current_stock };
}

export const PosView: React.FC<{ onPrintTicket: (props: ThermalReceiptProps) => void }> = ({ onPrintTicket }) => {
  const v = useStoreVersion();
  const { role } = useAuth();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<PosLine[]>([]);
  const [customerId, setCustomerId] = useState('final');
  const [payment, setPayment] = useState<PaymentMethod>('efectivo');
  const [tendered, setTendered] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [variantFor, setVariantFor] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const { products, categories, customers, cash } = useMemo(() => ({
    products: PolleriaStore.getProducts().filter(p => p.active),
    categories: PolleriaStore.getCategories().filter(c => c.active),
    customers: PolleriaStore.getCustomers(),
    cash: PolleriaStore.getCashSession(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [v]);

  const resolved = lines.map(l => {
    const p = products.find(x => x.id === l.productId);
    const variant = p?.variants?.find(x => x.id === l.variantId);
    const unit = variant ? variant.final_price : p?.sale_price ?? 0;
    return { ...l, product: p, variant, unit, name: p ? (variant ? `${p.name} (${variant.name})` : p.name) : '—' };
  }).filter(l => l.product);

  const totals = computeCartTotals(resolved.map(l => ({ unitPrice: l.unit, quantity: l.quantity })), { discountPercent: discountPct });
  const subtotal = totals.subtotal / 100;
  const discount = totals.discount / 100;
  const total = totals.total / 100;
  const tenderedNum = Number(tendered.replace(',', '.')) || 0;
  const change = payment === 'efectivo' && tenderedNum >= total ? tenderedNum - total : 0;
  const cashOpen = cash.status === 'abierta';

  const add = (p: Product, variant?: ProductVariant) => {
    if (p.variants?.length && !variant) {
      setVariantFor(p);
      return;
    }
    const key = variant ? `${p.id}:${variant.id}` : p.id;
    const next = lines.some(l => l.key === key) ? lines.map(l => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)) : [...lines, { key, productId: p.id, variantId: variant?.id, quantity: 1 }];
    const warn = PolleriaStore.checkAvailability(next.map(l => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })));
    if (warn) toast(`Sin stock suficiente — ${warn}`, 'error');
    else setLines(next);
    setVariantFor(null);
  };

  const setQty = (key: string, q: number) => setLines(prev => (q <= 0 ? prev.filter(l => l.key !== key) : prev.map(l => (l.key === key ? { ...l, quantity: q } : l))));

  const reset = () => {
    setLines([]);
    setDiscountPct(0);
    setTendered('');
    setCustomerId('final');
  };

  const checkout = async (withInvoice: boolean) => {
    if (!resolved.length || busy) return;
    if (payment === 'efectivo' && tendered && tenderedNum < total) {
      toast('El monto recibido es menor al total', 'error');
      return;
    }
    setBusy(true);
    try {
      const customer = customers.find(c => c.id === customerId);
      const sale = PolleriaStore.recordSale({
        id: '', business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', sale_number: '', channel: 'mostrador',
        customer_id: customer?.id, customer_name: customer?.full_name ?? 'Consumidor Final',
        subtotal, discount, tax_amount: 0, total, payment_method: payment, fiscal_status: 'no_fiscal',
        items: resolved.map(l => ({
          id: `si-${l.key}`, sale_id: '', product_id: l.productId, variant_id: l.variantId, description: l.name,
          quantity: l.quantity, unit_price: l.unit, subtotal: Math.round(l.unit * l.quantity * 100) / 100,
          cost_price: costOf(products, l.productId, l.variantId),
        })),
        created_at: '',
      });

      let fiscalData: ThermalReceiptProps['fiscalData'];
      if (withInvoice) {
        try {
          fiscalData = (await emitFiscalForSale(sale, receiverFromCustomer(customer))).fiscalData;
        } catch (e) {
          toast(`Venta registrada, pero el comprobante no se generó: ${e instanceof Error ? e.message : ''}`, 'error');
        }
      }

      onPrintTicket({
        type: fiscalData ? 'fiscal' : 'commercial',
        orderNumber: sale.sale_number,
        date: sale.created_at,
        customerName: sale.customer_name,
        paymentMethod: PAYMENTS.find(p => p.id === payment)?.label ?? payment,
        items: sale.items.map(i => ({ name: i.description, quantity: i.quantity, unitPrice: i.unit_price, subtotal: i.subtotal })),
        subtotal, discount, total, fiscalData,
      });
      toast(`Venta ${sale.sale_number} registrada${change > 0 ? ` · Vuelto ${formatARS(change)}` : ''}`);
      reset();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo registrar la venta', 'error');
    } finally {
      setBusy(false);
    }
  };

  const visible = products.filter(p => {
    if (category !== 'all' && p.category_id !== category) return false;
    const q = search.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q);
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:h-[calc(100vh-8rem)]">
      {/* Catálogo */}
      <div className="xl:col-span-7 flex flex-col gap-4 min-h-0">
        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-900/70 p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU o código de barras"
              className={`${inputCls} pl-9 py-2.5`}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const exact = products.find(p => p.barcode && p.barcode === search.trim());
                  if (exact) { add(exact); setSearch(''); }
                }
              }} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[{ id: 'all', name: 'Todo' }, ...categories].map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${category === c.id ? 'bg-fire-600 text-white' : 'bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {visible.length === 0 ? (
            <EmptyState title="No hay productos que coincidan" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-3">
              {visible.map(p => {
                const s = stockInfo(p);
                const out = !p.is_available || (s.tracked && s.available <= 0);
                return (
                  <button key={p.id} disabled={out} onClick={() => add(p)}
                    className="group text-left rounded-2xl border border-charcoal-800 bg-charcoal-900 hover:border-fire-500/60 overflow-hidden transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                    <div className="relative aspect-[4/3] bg-charcoal-950">
                      <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {out ? <Badge tone="red">Agotado</Badge> : s.tracked && s.available <= p.min_stock ? <Badge tone="amber">Quedan {s.available}</Badge> : null}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-white line-clamp-2 min-h-[2rem]">{p.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-black text-fire-400">{formatARS(p.sale_price)}</span>
                        {p.variants?.length ? <span className="text-[10px] text-charcoal-400">{p.variants.length} opciones</span> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ticket */}
      <div className="xl:col-span-5 flex flex-col rounded-2xl border border-charcoal-800 bg-charcoal-900/70 min-h-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-800">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2"><Store className="w-4 h-4 text-fire-400" /> Venta de mostrador</h2>
            <p className="text-[11px] text-charcoal-400">{cashOpen ? `Caja abierta por ${cash.user_name}` : 'Caja cerrada'}</p>
          </div>
          {resolved.length > 0 && <Button variant="ghost" onClick={reset}><Trash2 className="w-3.5 h-3.5" /> Vaciar</Button>}
        </div>

        {!cashOpen && (
          <div className="m-4 mb-0 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-200">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Para cobrar, primero abrí la caja{canAccess(role, 'cash') ? ' desde el módulo Caja' : ' (pedile a un encargado)'}.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 px-5 pt-4">
          <label className="block">
            <span className="block text-[10px] font-bold text-charcoal-400 mb-1">Cliente</span>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputCls}>
              <option value="final">Consumidor final</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold text-charcoal-400 mb-1">Descuento %</span>
            <input type="number" min={0} max={MAX_DISCOUNT_PERCENT} value={discountPct || ''} placeholder="0"
              onChange={e => setDiscountPct(Math.min(MAX_DISCOUNT_PERCENT, Math.max(0, Number(e.target.value) || 0)))} className={inputCls} />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[180px] px-5 py-3 space-y-2">
          {resolved.length === 0 ? (
            <EmptyState title="Ticket vacío" text="Tocá un producto para agregarlo. Con lector de código de barras: escaneá y Enter." />
          ) : resolved.map(l => (
            <div key={l.key} className="flex items-center gap-3 rounded-xl bg-charcoal-950 border border-charcoal-800 p-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{l.name}</p>
                <p className="text-[10px] text-charcoal-400">{formatARS(l.unit)} c/u</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button aria-label="Restar" onClick={() => setQty(l.key, l.quantity - 1)} className="w-7 h-7 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center text-xs font-black text-white tabular-nums">{l.quantity}</span>
                <button aria-label="Sumar" onClick={() => add(l.product!, l.variant)} className="w-7 h-7 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
              </div>
              <span className="w-20 text-right text-xs font-black text-white tabular-nums">{formatARS(l.unit * l.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-charcoal-800 px-5 py-4 space-y-3">
          <div className="grid grid-cols-5 gap-1">
            {PAYMENTS.map(p => (
              <button key={p.id} onClick={() => setPayment(p.id)}
                className={`rounded-lg py-2 text-[10px] font-bold transition ${payment === p.id ? 'bg-fire-600 text-white' : 'bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700'}`}>{p.label}</button>
            ))}
          </div>
          {payment === 'efectivo' && (
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="decimal" value={tendered} onChange={e => setTendered(e.target.value)} placeholder="Paga con $" className={inputCls} />
              <div className="rounded-xl bg-charcoal-950 border border-charcoal-800 px-3 py-2 text-xs"><span className="text-charcoal-400">Vuelto </span><span className="font-black text-emerald-400">{formatARS(change)}</span></div>
            </div>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-charcoal-400"><span>Subtotal</span><span className="text-white tabular-nums">{formatARS(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-charcoal-400"><span>Descuento {discountPct}%</span><span className="text-red-300 tabular-nums">−{formatARS(discount)}</span></div>}
            <div className="flex justify-between items-baseline pt-1"><span className="font-bold text-white">Total</span><span className="text-2xl font-black text-fire-400 tabular-nums">{formatARS(total)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" className="py-3" disabled={!resolved.length || !cashOpen || busy} onClick={() => checkout(false)}><Printer className="w-4 h-4" /> Cobrar</Button>
            <Button className="py-3" disabled={!resolved.length || !cashOpen || busy} onClick={() => checkout(true)} title="Genera un comprobante de simulación (sin CAE) hasta conectar ARCA"><FileText className="w-4 h-4" /> Cobrar + comprobante</Button>
          </div>
          <p className="text-[10px] text-charcoal-500 text-center">Los comprobantes son simulaciones sin validez fiscal hasta conectar ARCA.</p>
        </div>
      </div>

      <Modal open={!!variantFor} onClose={() => setVariantFor(null)} title={variantFor ? `Elegí la opción — ${variantFor.name}` : ''} size="sm">
        <div className="space-y-2">
          {variantFor?.variants?.filter(x => x.active).map(x => (
            <button key={x.id} onClick={() => add(variantFor, x)} className="w-full flex items-center justify-between rounded-xl border border-charcoal-700 hover:border-fire-500 bg-charcoal-950 px-4 py-3 text-sm transition">
              <span className="font-bold text-white">{x.name}</span>
              <span className="font-black text-fire-400">{formatARS(x.final_price)}</span>
            </button>
          ))}
          <button onClick={() => setVariantFor(null)} className="w-full text-xs text-charcoal-400 py-2 flex items-center justify-center gap-1"><X className="w-3 h-3" /> Cancelar</button>
        </div>
      </Modal>
    </div>
  );
};
