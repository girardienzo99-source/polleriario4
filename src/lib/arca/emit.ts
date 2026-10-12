'use client';

import { FiscalDocument, Sale } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { ARCAClient } from './client';
import { allowedVoucherTypes, vatBreakdownByRate, DOC_TYPES, validateCuit } from '@/lib/domain/fiscal';
import type { ThermalReceiptProps } from '@/components/common/ThermalReceipt';

export interface FiscalReceiver {
  name: string;
  ivaCondition: 'Consumidor Final' | 'Responsable Inscripto' | 'Monotributo' | 'Exento';
  docType: number; // 80 CUIT, 96 DNI, 99 sin identificar
  docNumber: string;
}

export const FINAL_CONSUMER: FiscalReceiver = { name: 'Consumidor Final', ivaCondition: 'Consumidor Final', docType: DOC_TYPES.SIN_IDENTIFICAR, docNumber: '0' };

const LETTER: Record<number, 'A' | 'B' | 'C'> = { 1: 'A', 6: 'B', 11: 'C' };

/**
 * Genera el comprobante de una venta. Hoy SIEMPRE resulta en una simulación
 * (afip_status 'simulado', sin CAE) porque la integración WSAA/WSFEv1 requiere
 * certificados del contribuyente que aún no fueron cargados.
 */
export async function emitFiscalForSale(sale: Sale, receiver: FiscalReceiver): Promise<{ doc: FiscalDocument; fiscalData: NonNullable<ThermalReceiptProps['fiscalData']> }> {
  const settings = PolleriaStore.getFiscalSettings();
  if (PolleriaStore.getFiscalDocuments().some(d => d.sale_id === sale.id && d.afip_status !== 'rechazado')) {
    throw new Error(`La venta ${sale.sale_number} ya tiene un comprobante generado`);
  }
  if (receiver.docType === DOC_TYPES.CUIT && !validateCuit(receiver.docNumber)) throw new Error('El CUIT del receptor no es válido');
  const types = allowedVoucherTypes(settings.iva_condition, receiver.ivaCondition);
  if (!types.length) throw new Error('No hay un tipo de comprobante válido para esta combinación de condiciones de IVA');
  const voucherType = types[0];

  const products = PolleriaStore.getProducts();
  const lines = sale.items.map(i => ({ gross: i.subtotal, rate: products.find(p => p.id === i.product_id)?.vat_rate ?? 21 }));
  // Prorratear el descuento proporcionalmente
  const gross = lines.reduce((a, l) => a + l.gross, 0);
  const factor = gross > 0 ? sale.total / gross : 1;
  const breakdown = vatBreakdownByRate(lines.map(l => ({ gross: Math.round(l.gross * factor * 100) / 100, rate: l.rate })));
  const net = Math.round(breakdown.reduce((a, b) => a + b.net, 0) * 100) / 100;
  const vat = Math.round((sale.total - net) * 100) / 100;

  const simNumber = PolleriaStore.nextSimulationNumber();
  const res = await ARCAClient.authorizeInvoice(settings, {
    business_id: settings.business_id, sale_id: sale.id, voucher_type: voucherType, point_of_sale: settings.point_of_sale,
    receiver_doc_type: receiver.docType, receiver_doc_number: receiver.docNumber, receiver_name: receiver.name,
    receiver_iva_condition: receiver.ivaCondition, net_amount: net, vat_amount: vat, exempt_amount: 0, total_amount: sale.total,
    items: sale.items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal })),
  }, simNumber);
  if (!res.success) throw new Error(res.error || 'No se pudo generar el comprobante');

  const doc: FiscalDocument = {
    id: `fdoc-${Date.now().toString(36)}`,
    business_id: settings.business_id,
    sale_id: sale.id,
    voucher_type: voucherType,
    point_of_sale: settings.point_of_sale,
    voucher_number: res.voucher_number ?? simNumber,
    doc_type_receiver: receiver.docType,
    doc_number_receiver: receiver.docNumber,
    receiver_name: receiver.name,
    receiver_iva_condition: receiver.ivaCondition,
    net_amount: net,
    vat_amount: vat,
    exempt_amount: 0,
    total_amount: sale.total,
    cae: res.is_simulation ? undefined : res.cae,
    cae_expiration: res.is_simulation ? undefined : res.cae_expiration,
    qr_url: res.is_simulation ? undefined : res.qr_url,
    afip_status: res.is_simulation ? 'simulado' : 'autorizado',
    afip_response: { observations: res.observations },
    created_at: new Date().toISOString(),
  };
  PolleriaStore.saveFiscalDocument(doc);
  PolleriaStore.updateSale({ ...sale, fiscal_status: res.is_simulation ? 'simulado' : 'autorizado', fiscal_doc_id: doc.id, tax_amount: vat });

  return {
    doc,
    fiscalData: {
      voucherLetter: LETTER[voucherType],
      pointOfSale: doc.point_of_sale,
      voucherNumber: doc.voucher_number,
      cae: doc.cae,
      caeExpiration: doc.cae_expiration,
      qrDataUrl: res.qr_data_url,
      isSimulation: res.is_simulation,
      receiverName: receiver.name,
      receiverDoc: receiver.docType === DOC_TYPES.SIN_IDENTIFICAR ? 'Sin identificar' : receiver.docNumber,
      receiverIvaCondition: receiver.ivaCondition,
      netAmount: net,
      vatAmount: vat,
    },
  };
}

export function receiverFromCustomer(c?: { full_name: string; iva_condition?: string; doc_type?: string; doc_number?: string }): FiscalReceiver {
  if (!c) return FINAL_CONSUMER;
  const cond = (['Responsable Inscripto', 'Monotributo', 'Exento'].includes(c.iva_condition || '') ? c.iva_condition : 'Consumidor Final') as FiscalReceiver['ivaCondition'];
  const docType = c.doc_type === 'CUIT' ? DOC_TYPES.CUIT : c.doc_number ? DOC_TYPES.DNI : DOC_TYPES.SIN_IDENTIFICAR;
  return { name: c.full_name, ivaCondition: cond, docType, docNumber: (c.doc_number || '0').replace(/\D/g, '') || '0' };
}
