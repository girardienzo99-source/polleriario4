'use client';

import React, { useMemo, useState } from 'react';
import { FileText, AlertTriangle, Printer, ShieldAlert, Settings2, CheckCircle2, Circle } from 'lucide-react';
import { FiscalSettings, Sale } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateTimeAR, formatCUIT } from '@/lib/formatters';
import { validateCuit, VOUCHER_LABELS } from '@/lib/domain/fiscal';
import { emitFiscalForSale, receiverFromCustomer, FiscalReceiver, FINAL_CONSUMER } from '@/lib/arca/emit';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';
import { PageHeader, Card, Button, Badge, EmptyState, Modal, Field, inputCls, toast, run, useStoreVersion, Table } from '../ui';

export const ArcaFiscalView: React.FC<{ onPrintTicket: (props: ThermalReceiptProps) => void }> = ({ onPrintTicket }) => {
  const v = useStoreVersion();
  const [emitting, setEmitting] = useState<Sale | null>(null);
  const [receiver, setReceiver] = useState<FiscalReceiver>(FINAL_CONSUMER);
  const [editing, setEditing] = useState<FiscalSettings | null>(null);
  const [busy, setBusy] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { settings, docs, pendingSales, customers } = useMemo(() => {
    const docs = PolleriaStore.getFiscalDocuments();
    return {
      settings: PolleriaStore.getFiscalSettings(),
      docs,
      pendingSales: PolleriaStore.getSales().filter(s => s.fiscal_status === 'no_fiscal').slice(0, 50),
      customers: PolleriaStore.getCustomers(),
    };
  }, [v]);

  const cuitOk = validateCuit(settings.cuit);
  const checklist = [
    { ok: cuitOk, label: 'CUIT del emisor válido' },
    { ok: settings.point_of_sale > 0, label: 'Punto de venta configurado (debe estar dado de alta en ARCA como "Web Services")' },
    { ok: false, label: 'Certificado X.509 de homologación generado y asociado al servicio wsfe' },
    { ok: false, label: 'Backend WSAA (firma del TRA) + WSFEv1 (FECAESolicitar) desplegado en el servidor' },
    { ok: false, label: 'Prueba de emisión en homologación con CAE real' },
  ];

  const startEmit = (s: Sale) => {
    setEmitting(s);
    setReceiver(receiverFromCustomer(customers.find(c => c.id === s.customer_id)));
  };

  const emit = async () => {
    if (!emitting) return;
    setBusy(true);
    try {
      const { fiscalData } = await emitFiscalForSale(emitting, receiver);
      onPrintTicket({
        type: 'fiscal', businessName: settings.legal_name, businessAddress: settings.fiscal_address, businessCuit: formatCUIT(settings.cuit),
        orderNumber: emitting.sale_number, date: emitting.created_at, customerName: receiver.name, paymentMethod: emitting.payment_method,
        items: emitting.items.map(i => ({ name: i.description, quantity: i.quantity, unitPrice: i.unit_price, subtotal: i.subtotal })),
        subtotal: emitting.subtotal, discount: emitting.discount, total: emitting.total, fiscalData,
      });
      toast('Comprobante de SIMULACIÓN generado (sin CAE, sin validez fiscal)', 'info');
      setEmitting(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={FileText} title="Facturación electrónica ARCA"
        subtitle="Generación de comprobantes A, B y C a partir de ventas registradas."
        actions={<Button onClick={() => setEditing({ ...settings })}><Settings2 className="w-4 h-4" /> Datos fiscales</Button>} />

      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 flex gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
        <div className="text-sm">
          <p className="font-black text-amber-200">Simulador local — NO FISCAL</p>
          <p className="text-amber-100/80 text-xs mt-1 leading-relaxed">
            Este sistema todavía <b>no está conectado a ARCA</b>. Los comprobantes que se generan acá son borradores internos:
            no tienen CAE, no tienen QR fiscal y no son válidos como factura. Para emitir facturas reales hay que completar la lista de abajo.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Estado de la integración" className="lg:col-span-1">
          <ul className="space-y-2.5 text-xs">
            {checklist.map(c => (
              <li key={c.label} className="flex gap-2">
                {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Circle className="w-4 h-4 text-charcoal-600 shrink-0" />}
                <span className={c.ok ? 'text-charcoal-200' : 'text-charcoal-400'}>{c.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-charcoal-800 text-xs space-y-1.5">
            <p className="flex justify-between"><span className="text-charcoal-400">Razón social</span><span className="text-white text-right">{settings.legal_name}</span></p>
            <p className="flex justify-between"><span className="text-charcoal-400">CUIT</span><span className={cuitOk ? 'text-white' : 'text-red-300'}>{formatCUIT(settings.cuit)}</span></p>
            <p className="flex justify-between"><span className="text-charcoal-400">Condición IVA</span><span className="text-white">{settings.iva_condition}</span></p>
            <p className="flex justify-between"><span className="text-charcoal-400">Punto de venta</span><span className="text-white">{String(settings.point_of_sale).padStart(4, '0')}</span></p>
            <p className="flex justify-between"><span className="text-charcoal-400">Ambiente objetivo</span><span className="text-white capitalize">{settings.environment}</span></p>
          </div>
        </Card>

        <Card title={`Ventas sin comprobante (${pendingSales.length})`} className="lg:col-span-2">
          <Table head={['Venta', 'Fecha', 'Cliente', 'Total', '']} empty={<EmptyState title="No hay ventas pendientes de comprobante" text="Las ventas cobradas en el POS o al cobrar pedidos aparecen acá." />}>
            {pendingSales.map(s => (
              <tr key={s.id} className="text-charcoal-200">
                <td className="px-5 py-2.5 font-bold text-white">{s.sale_number}</td>
                <td className="px-5 py-2.5 whitespace-nowrap">{formatDateTimeAR(s.created_at)}</td>
                <td className="px-5 py-2.5">{s.customer_name ?? 'Consumidor final'}</td>
                <td className="px-5 py-2.5 tabular-nums">{formatARS(s.total)}</td>
                <td className="px-5 py-2.5 text-right"><Button onClick={() => startEmit(s)}><FileText className="w-3.5 h-3.5" /> Generar</Button></td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Card title={`Comprobantes generados (${docs.length})`}>
        <Table head={['Fecha', 'Tipo', 'Número', 'Receptor', 'Neto', 'IVA', 'Total', 'Estado', 'CAE']} empty={<EmptyState title="Todavía no se generaron comprobantes" />}>
          {docs.map(d => (
            <tr key={d.id} className="text-charcoal-200">
              <td className="px-5 py-2.5 whitespace-nowrap">{formatDateTimeAR(d.created_at)}</td>
              <td className="px-5 py-2.5">{VOUCHER_LABELS[d.voucher_type]}</td>
              <td className="px-5 py-2.5 tabular-nums">{d.afip_status === 'simulado' ? 'SIM-' : ''}{String(d.point_of_sale).padStart(4, '0')}-{String(d.voucher_number).padStart(8, '0')}</td>
              <td className="px-5 py-2.5">{d.receiver_name}</td>
              <td className="px-5 py-2.5 tabular-nums">{formatARS(d.net_amount, true)}</td>
              <td className="px-5 py-2.5 tabular-nums">{formatARS(d.vat_amount, true)}</td>
              <td className="px-5 py-2.5 tabular-nums font-bold text-white">{formatARS(d.total_amount, true)}</td>
              <td className="px-5 py-2.5"><Badge tone={d.afip_status === 'autorizado' ? 'green' : d.afip_status === 'simulado' ? 'amber' : 'red'}>{d.afip_status === 'simulado' ? 'Simulado · no fiscal' : d.afip_status}</Badge></td>
              <td className="px-5 py-2.5 text-charcoal-400">{d.cae ?? '—'}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!emitting} onClose={() => setEmitting(null)} title={`Comprobante para ${emitting?.sale_number ?? ''}`}
        footer={<>
          <Button variant="ghost" onClick={() => setEmitting(null)}>Cancelar</Button>
          <Button variant="primary" disabled={busy} onClick={emit}><Printer className="w-4 h-4" /> Generar simulación</Button>
        </>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Condición IVA del receptor">
            <select value={receiver.ivaCondition} onChange={e => setReceiver({ ...receiver, ivaCondition: e.target.value as FiscalReceiver['ivaCondition'], docType: e.target.value === 'Consumidor Final' ? receiver.docType : 80 })} className={inputCls}>
              {['Consumidor Final', 'Responsable Inscripto', 'Monotributo', 'Exento'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tipo de documento">
            <select value={receiver.docType} onChange={e => setReceiver({ ...receiver, docType: Number(e.target.value) })} className={inputCls}>
              <option value={99}>Sin identificar</option><option value={96}>DNI</option><option value={80}>CUIT</option>
            </select>
          </Field>
          <Field label="Nombre / razón social"><input value={receiver.name} onChange={e => setReceiver({ ...receiver, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Número de documento" error={receiver.docType === 80 && receiver.docNumber && !validateCuit(receiver.docNumber) ? 'CUIT inválido' : undefined}>
            <input value={receiver.docNumber} disabled={receiver.docType === 99} onChange={e => setReceiver({ ...receiver, docNumber: e.target.value.replace(/\D/g, '') })} className={inputCls} />
          </Field>
        </div>
        <div className="mt-4 rounded-xl bg-charcoal-950 border border-charcoal-800 p-3 text-xs flex items-start gap-2 text-charcoal-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          El tipo (A/B/C) se determina automáticamente según la condición de IVA del emisor y del receptor. Se generará un borrador SIN CAE.
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Datos fiscales del emisor"
        footer={<>
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="primary" disabled={!editing || !validateCuit(editing.cuit)} onClick={() => { if (editing && run(() => PolleriaStore.saveFiscalSettings({ ...editing, cuit: editing.cuit.replace(/\D/g, '') }), 'Datos fiscales guardados')) setEditing(null); }}>Guardar</Button>
        </>}>
        {editing && <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Razón social"><input value={editing.legal_name} onChange={e => setEditing({ ...editing, legal_name: e.target.value })} className={inputCls} /></Field>
          <Field label="CUIT" error={!validateCuit(editing.cuit) ? 'CUIT inválido (dígito verificador)' : undefined}><input value={editing.cuit} onChange={e => setEditing({ ...editing, cuit: e.target.value })} className={inputCls} /></Field>
          <Field label="Condición frente al IVA"><select value={editing.iva_condition} onChange={e => setEditing({ ...editing, iva_condition: e.target.value })} className={inputCls}>
            {['Responsable Inscripto', 'Monotributo', 'Exento'].map(c => <option key={c}>{c}</option>)}
          </select></Field>
          <Field label="Punto de venta"><input type="number" min={1} value={editing.point_of_sale} onChange={e => setEditing({ ...editing, point_of_sale: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} /></Field>
          <Field label="Domicilio fiscal"><input value={editing.fiscal_address} onChange={e => setEditing({ ...editing, fiscal_address: e.target.value })} className={inputCls} /></Field>
          <Field label="Inicio de actividades"><input type="date" value={editing.start_activity_date} onChange={e => setEditing({ ...editing, start_activity_date: e.target.value })} className={inputCls} /></Field>
        </div>}
        <p className="text-[11px] text-charcoal-500 mt-4">Los certificados nunca deben guardarse en el navegador: se cargan como variables de entorno del servidor cuando se implemente el backend WSAA/WSFEv1.</p>
      </Modal>
    </div>
  );
};
