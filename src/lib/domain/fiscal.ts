/**
 * Reglas fiscales argentinas (módulo puro).
 *
 * IMPORTANTE: este módulo NO autoriza comprobantes. Un CAE sólo puede venir de una
 * respuesta real del web service WSFEv1 de ARCA. Nada aquí genera ni inventa CAE.
 */
import { toCents, fromCents } from './money.ts';

export type IvaCondition = 'Responsable Inscripto' | 'Monotributo' | 'Exento' | 'Consumidor Final';

export const VOUCHER_LABELS: Record<number, string> = {
  1: 'Factura A',
  6: 'Factura B',
  11: 'Factura C',
};

/** Código de tipo de documento del receptor según ARCA. */
export const DOC_TYPES = { CUIT: 80, DNI: 96, SIN_IDENTIFICAR: 99 } as const;

/** Valida un CUIT/CUIL con su dígito verificador (módulo 11). */
export function validateCuit(raw: string): boolean {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length !== 11) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) return false;
  return check === Number(digits[10]);
}

export function formatCuit(raw: string): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length !== 11) return raw;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/** Tipos de comprobante permitidos según condición del emisor y del receptor. */
export function allowedVoucherTypes(emitter: string, receiver: string): number[] {
  if (emitter === 'Monotributo' || emitter === 'Exento') return [11];
  if (emitter === 'Responsable Inscripto') {
    if (receiver === 'Responsable Inscripto' || receiver === 'Monotributo') return [1];
    return [6];
  }
  return [];
}

export interface VatBreakdown {
  net: number;
  vat: number;
  total: number;
}

/**
 * Discrimina IVA de un total con impuestos incluidos. El neto se calcula en centavos
 * y el IVA es la diferencia, de modo que net + vat === total siempre.
 */
export function vatFromGross(total: number, ratePercent: number): VatBreakdown {
  if (ratePercent < 0) throw new Error('Alícuota inválida');
  const t = toCents(total);
  const net = Math.round(t / (1 + ratePercent / 100));
  return { net: fromCents(net), vat: fromCents(t - net), total: fromCents(t) };
}

/** Agrupa líneas por alícuota y devuelve el desglose consolidado. */
export function vatBreakdownByRate(lines: { gross: number; rate: number }[]): { rate: number; net: number; vat: number }[] {
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.rate, (byRate.get(l.rate) ?? 0) + toCents(l.gross));
  return [...byRate.entries()].map(([rate, grossCents]) => {
    const b = vatFromGross(fromCents(grossCents), rate);
    return { rate, net: b.net, vat: b.vat };
  });
}

export interface QrParams {
  date: string; // AAAA-MM-DD
  cuit: string;
  pointOfSale: number;
  voucherType: number;
  voucherNumber: number;
  total: number;
  docTypeReceiver: number;
  docNumberReceiver: string;
  cae: string;
}

/**
 * URL del QR según RG 4291 (https://www.afip.gob.ar/fe/qr/especificaciones.asp).
 * Exige un CAE de 14 dígitos: si no hay CAE real, no hay QR fiscal.
 */
export function buildArcaQrUrl(p: QrParams): string {
  if (!/^\d{14}$/.test(p.cae)) throw new Error('No se puede generar el QR fiscal sin un CAE válido emitido por ARCA');
  const payload = {
    ver: 1,
    fecha: p.date,
    cuit: Number(p.cuit.replace(/\D/g, '')),
    ptoVta: p.pointOfSale,
    tipoCmp: p.voucherType,
    nroCmp: p.voucherNumber,
    importe: Number(p.total.toFixed(2)),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: p.docTypeReceiver,
    nroDocRec: Number((p.docNumberReceiver || '0').replace(/\D/g, '') || '0'),
    tipoCodAut: 'E',
    codAut: Number(p.cae),
  };
  return `https://www.afip.gob.ar/fe/qr/?p=${btoa(JSON.stringify(payload))}`;
}
