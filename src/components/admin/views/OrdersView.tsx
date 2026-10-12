'use client';

import React, { useMemo, useState } from 'react';
import { ClipboardList, Search, Printer, Bike, Store, MessageCircle, Plus, XCircle, Wallet, Trash2, ArrowRight } from 'lucide-react';
import { Order, OrderStatus, OrderChannel, PaymentMethod } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateTimeAR, formatTimeAR, buildWhatsAppLink } from '@/lib/formatters';
import { nextStatuses, STATUS_LABELS, delayLevel } from '@/lib/domain/orders';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';
import { useAuth } from '@/context/AuthContext';
import { canDo } from '@/lib/domain/permissions';
import { PageHeader, Card, Button, Badge, EmptyState, Modal, Field, inputCls, run, useStoreVersion, useNow, toast } from '../ui';

const STATUS_TONE: Record<OrderStatus, 'blue' | 'violet' | 'amber' | 'green' | 'fire' | 'default' | 'red'> = {
  recibido: 'blue', confirmado: 'violet', en_preparacion: 'amber', listo: 'green', en_reparto: 'fire', entregado: 'default', cancelado: 'red',
};
const CHANNEL_LABELS: Record<string, string> = { landing: 'Web', mostrador: 'Mostrador', whatsapp: 'WhatsApp', telefono: 'Teléfono', interno: 'Interno' };
const PAY_LABELS: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', debito: 'Débito', credito: 'Crédito', mercadopago: 'Mercado Pago', mixto: 'Mixto' };

export const OrdersView: React.FC<{ onPrintTicket: (props: ThermalReceiptProps) => void }> = ({ onPrintTicket }) => {
  const v = useStoreVersion();
  const now = useNow(30_000);
  const { role } = useAuth();
  const isDriver = role === 'repartidor';
  const [status, setStatus] = useState<string>(isDriver ? 'reparto' : 'activos');
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [creating, setCreating] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const orders = useMemo(() => PolleriaStore.getOrders(), [v]);

  const visible = orders.filter(o => {
    if (isDriver && o.delivery_type !== 'delivery') return false;
    if (status === 'activos' && ['entregado', 'cancelado'].includes(o.status)) return false;
    if (status === 'reparto' && !['listo', 'en_reparto'].includes(o.status)) return false;
    if (!['all', 'activos', 'reparto'].includes(status) && o.status !== status) return false;
    if (channel !== 'all' && o.channel !== channel) return false;
    const q = search.trim().toLowerCase();
    return !q || o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q);
  });

  const allowedNext = (o: Order): OrderStatus[] => {
    const n = nextStatuses(o.status).filter(s => s !== 'cancelado');
    if (isDriver) return n.filter(s => s === 'en_reparto' || s === 'entregado');
    return n.filter(s => !(s === 'en_reparto' && o.delivery_type !== 'delivery'));
  };

  const print = (o: Order, type: 'kitchen' | 'commercial') => onPrintTicket({
    type, orderNumber: o.order_number, date: o.created_at, customerName: o.customer_name, customerPhone: o.customer_phone,
    deliveryType: o.delivery_type, deliveryAddress: o.customer_address, paymentMethod: PAY_LABELS[o.payment_method], notes: o.notes,
    items: o.items.map(i => ({ name: i.product_name, quantity: i.quantity, unitPrice: i.unit_price, subtotal: i.subtotal, notes: i.notes })),
    subtotal: o.subtotal, deliveryFee: o.delivery_fee, discount: o.discount, total: o.total,
  });

  return (
    <div className="space-y-5">
      <PageHeader icon={ClipboardList} title={isDriver ? 'Mis entregas' : 'Pedidos'}
        subtitle={isDriver ? 'Pedidos con envío listos para salir o en camino.' : 'Web, mostrador, teléfono y WhatsApp. Los pedidos nuevos de la tienda aparecen al instante.'}
        actions={!isDriver ? <Button variant="primary" onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Nuevo pedido</Button> : undefined} />

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Número, cliente o teléfono" className={`${inputCls} pl-9 py-2.5`} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className={`${inputCls} sm:col-span-3`}>
          {isDriver ? <option value="reparto">Para entregar</option> : <option value="activos">Activos</option>}
          <option value="all">Todos</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={channel} onChange={e => setChannel(e.target.value)} className={`${inputCls} sm:col-span-3`}>
          <option value="all">Todos los canales</option>
          {Object.entries(CHANNEL_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="No hay pedidos con estos filtros" /></Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map(o => {
            const delay = ['entregado', 'cancelado'].includes(o.status) ? 'ok' : delayLevel(o.created_at, now);
            const mins = Math.floor((now - new Date(o.created_at).getTime()) / 60000);
            return (
              <article key={o.id} className={`rounded-2xl border bg-charcoal-900/70 p-4 flex flex-col gap-3 ${delay === 'late' ? 'border-red-500/50' : delay === 'warn' ? 'border-amber-500/40' : 'border-charcoal-800'}`}>
                <header className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black text-white">{o.order_number}</span>
                  <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  <Badge>{CHANNEL_LABELS[o.channel] ?? o.channel}</Badge>
                  <Badge tone={o.delivery_type === 'delivery' ? 'blue' : 'default'}>{o.delivery_type === 'delivery' ? <><Bike className="w-3 h-3" /> Envío</> : <><Store className="w-3 h-3" /> Retiro</>}</Badge>
                  <span className={`ml-auto text-[11px] font-semibold tabular-nums ${delay === 'late' ? 'text-red-400' : delay === 'warn' ? 'text-amber-400' : 'text-charcoal-400'}`}>
                    {formatTimeAR(o.created_at)} · hace {mins} min
                  </span>
                </header>

                <div className="text-xs">
                  <p className="text-white font-bold">{o.customer_name} <span className="text-charcoal-400 font-normal">· {o.customer_phone}</span></p>
                  {o.customer_address && <p className="text-charcoal-400 mt-0.5">{o.customer_address}{o.delivery_zone_name ? ` — ${o.delivery_zone_name}` : ''}</p>}
                  {o.requested_time && <p className="text-charcoal-400 mt-0.5">Horario pedido: <span className="text-white">{o.requested_time}</span></p>}
                </div>

                <ul className="rounded-xl bg-charcoal-950 border border-charcoal-800 p-3 space-y-1 text-xs">
                  {o.items.map(i => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span className="text-charcoal-200"><b className="text-fire-400">{i.quantity}×</b> {i.product_name}{i.notes ? <span className="text-amber-300"> — {i.notes}</span> : null}</span>
                      <span className="text-charcoal-400 tabular-nums">{formatARS(i.subtotal)}</span>
                    </li>
                  ))}
                  {o.delivery_fee > 0 && <li className="flex justify-between text-charcoal-400 pt-1 border-t border-charcoal-800"><span>Envío</span><span>{formatARS(o.delivery_fee)}</span></li>}
                  {o.discount > 0 && <li className="flex justify-between text-charcoal-400"><span>Descuento</span><span>−{formatARS(o.discount)}</span></li>}
                </ul>
                {o.notes && <p className="text-[11px] text-amber-200 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">{o.notes}</p>}
                {o.cancel_reason && <p className="text-[11px] text-red-300">Cancelado: {o.cancel_reason}</p>}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-400">{PAY_LABELS[o.payment_method]} · <span className={o.payment_status === 'pagado' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>{o.payment_status === 'pagado' ? 'Cobrado' : o.payment_status === 'rechazado' ? 'Devuelto' : 'Pendiente de cobro'}</span></span>
                  <span className="text-lg font-black text-white tabular-nums">{formatARS(o.total)}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-charcoal-800">
                  {allowedNext(o).map(s => (
                    <Button key={s} variant={s === 'entregado' || s === 'listo' ? 'success' : 'primary'} onClick={() => run(() => PolleriaStore.updateOrderStatus(o.id, s), `${o.order_number}: ${STATUS_LABELS[s]}`)}>
                      <ArrowRight className="w-3.5 h-3.5" /> {STATUS_LABELS[s]}
                    </Button>
                  ))}
                  {!isDriver && o.payment_status !== 'pagado' && o.status !== 'cancelado' && (
                    <Button onClick={() => run(() => PolleriaStore.updateOrderPayment(o.id, 'pagado'), `Cobro registrado en caja: ${formatARS(o.total)}`)}>
                      <Wallet className="w-3.5 h-3.5" /> Cobrar
                    </Button>
                  )}
                  {!isDriver && <Button variant="ghost" onClick={() => print(o, 'kitchen')}><Printer className="w-3.5 h-3.5" /> Comanda</Button>}
                  {!isDriver && <Button variant="ghost" onClick={() => print(o, 'commercial')}><Printer className="w-3.5 h-3.5" /> Ticket</Button>}
                  <a href={buildWhatsAppLink(o.customer_phone, `Hola ${o.customer_name.split(' ')[0]}, te escribimos de Pollería Los Campeones por tu pedido ${o.order_number}.`)} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  {canDo(role, 'cancel_order') && nextStatuses(o.status).includes('cancelado') && (
                    <Button variant="ghost" className="text-red-300 ml-auto" onClick={() => { setCancelling(o); setReason(''); }}><XCircle className="w-3.5 h-3.5" /> Cancelar</Button>
                  )}
                </div>
                <p className="text-[10px] text-charcoal-500">Creado {formatDateTimeAR(o.created_at)}{o.created_by ? ` por ${o.created_by}` : ''}</p>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title={`Cancelar ${cancelling?.order_number ?? ''}`} size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setCancelling(null)}>Volver</Button>
          <Button variant="danger" disabled={!reason.trim()} onClick={() => { if (cancelling && run(() => PolleriaStore.updateOrderStatus(cancelling.id, 'cancelado', reason), 'Pedido cancelado')) setCancelling(null); }}>Confirmar cancelación</Button>
        </>}>
        <p className="text-xs text-charcoal-300 mb-3">El stock reservado vuelve al inventario. Si el pedido estaba cobrado, se registra la devolución en caja (requiere caja abierta).</p>
        <Field label="Motivo (obligatorio)"><textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className={inputCls} placeholder="Ej.: el cliente desistió" /></Field>
      </Modal>

      {creating && <NewOrderModal onClose={() => setCreating(false)} />}
    </div>
  );
};

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const products = PolleriaStore.getProducts().filter(p => p.active && p.is_available);
  const zones = PolleriaStore.getDeliveryZones().filter(z => z.active);
  const [channel, setChannel] = useState<OrderChannel>('telefono');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'retiro' | 'delivery'>('retiro');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState(zones[0]?.id ?? '');
  const [pay, setPay] = useState<PaymentMethod>('efectivo');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ key: string; productId: string; variantId?: string; quantity: number }[]>([]);
  const [pick, setPick] = useState('');

  const options = products.flatMap(p => (p.variants?.length ? p.variants.filter(x => x.active).map(x => ({ value: `${p.id}|${x.id}`, label: `${p.name} — ${x.name}`, price: x.final_price })) : [{ value: p.id, label: p.name, price: p.sale_price }]));
  const priced = items.map(i => {
    const o = options.find(x => x.value === i.key);
    return { ...i, label: o?.label ?? '', price: o?.price ?? 0 };
  });
  const subtotal = priced.reduce((a, i) => a + i.price * i.quantity, 0);
  const fee = type === 'delivery' ? zones.find(z => z.id === zone)?.price ?? 0 : 0;

  const addPick = () => {
    if (!pick) return;
    const [productId, variantId] = pick.split('|');
    setItems(prev => (prev.some(i => i.key === pick) ? prev.map(i => (i.key === pick ? { ...i, quantity: i.quantity + 1 } : i)) : [...prev, { key: pick, productId, variantId, quantity: 1 }]));
    setPick('');
  };

  const submit = () => {
    try {
      const o = PolleriaStore.createOrder({
        id: '', business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', order_number: '', channel,
        customer_name: name, customer_phone: phone, customer_address: type === 'delivery' ? address : undefined,
        delivery_type: type, delivery_zone_id: type === 'delivery' ? zone : undefined, delivery_fee: 0,
        status: 'recibido', payment_status: 'pendiente', payment_method: pay, subtotal: 0, discount: 0, total: 0,
        requested_time: time || undefined, notes: notes || undefined,
        items: priced.map(i => ({ id: `it-${i.key}`, order_id: '', product_id: i.productId, variant_id: i.variantId, product_name: i.label, quantity: i.quantity, unit_price: i.price, subtotal: i.price * i.quantity })),
        created_at: '',
      });
      toast(`Pedido ${o.order_number} creado y enviado a cocina`);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo crear el pedido', 'error');
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo pedido" size="lg"
      footer={<>
        <span className="mr-auto text-sm font-black text-white">Total {formatARS(subtotal + fee)}</span>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={!items.length || !name.trim() || !phone.trim()} onClick={submit}>Crear pedido</Button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Canal"><select value={channel} onChange={e => setChannel(e.target.value as OrderChannel)} className={inputCls}>
          <option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="mostrador">Mostrador</option><option value="interno">Interno</option>
        </select></Field>
        <Field label="Medio de pago"><select value={pay} onChange={e => setPay(e.target.value as PaymentMethod)} className={inputCls}>
          {Object.entries(PAY_LABELS).filter(([k]) => k !== 'mixto').map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select></Field>
        <Field label="Nombre del cliente"><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></Field>
        <Field label="Teléfono"><input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} inputMode="tel" /></Field>
        <Field label="Tipo de entrega"><div className="grid grid-cols-2 gap-1">
          {(['retiro', 'delivery'] as const).map(t => <button key={t} type="button" onClick={() => setType(t)} className={`rounded-xl py-2 text-xs font-bold ${type === t ? 'bg-fire-600 text-white' : 'bg-charcoal-800 text-charcoal-300'}`}>{t === 'retiro' ? 'Retiro en local' : 'Envío'}</button>)}
        </div></Field>
        <Field label="Horario solicitado (opcional)"><input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} /></Field>
        {type === 'delivery' && <>
          <Field label="Dirección"><input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} /></Field>
          <Field label="Zona"><select value={zone} onChange={e => setZone(e.target.value)} className={inputCls}>{zones.map(z => <option key={z.id} value={z.id}>{z.name} — {formatARS(z.price)}</option>)}</select></Field>
        </>}
      </div>

      <div className="mt-4 flex gap-2">
        <select value={pick} onChange={e => setPick(e.target.value)} className={inputCls}>
          <option value="">Agregar producto…</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label} — {formatARS(o.price)}</option>)}
        </select>
        <Button onClick={addPick} disabled={!pick}><Plus className="w-4 h-4" /></Button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {priced.map(i => (
          <li key={i.key} className="flex items-center gap-2 text-xs rounded-lg bg-charcoal-950 border border-charcoal-800 px-3 py-2">
            <span className="flex-1 text-white">{i.label}</span>
            <input type="number" min={1} value={i.quantity} onChange={e => setItems(prev => prev.map(x => (x.key === i.key ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x)))} className="w-14 bg-charcoal-900 border border-charcoal-700 rounded-lg px-2 py-1 text-white" />
            <span className="w-20 text-right tabular-nums">{formatARS(i.price * i.quantity)}</span>
            <button aria-label="Quitar" onClick={() => setItems(prev => prev.filter(x => x.key !== i.key))} className="text-charcoal-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </li>
        ))}
      </ul>
      <Field label="Observaciones"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} mt-3`} /></Field>
      <p className="text-[10px] text-charcoal-500 mt-2">Al crear el pedido se reserva el stock. Los precios se toman del catálogo vigente.</p>
    </Modal>
  );
}
