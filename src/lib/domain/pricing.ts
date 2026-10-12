import { type Cents, toCents, mulCents, sumCents } from './money.ts';

export interface PricedLine {
  unitPrice: number; // pesos
  quantity: number;
}

export interface Coupon {
  code: string;
  percent: number;
  active: boolean;
}

/** Tope duro: ninguna combinación de descuentos supera este porcentaje. */
export const MAX_DISCOUNT_PERCENT = 50;

export const DEFAULT_COUPONS: Coupon[] = [
  { code: 'CAMPEON10', percent: 10, active: true },
  { code: 'RIOCUARTO', percent: 15, active: true },
];

export function findCoupon(code: string, coupons: Coupon[] = DEFAULT_COUPONS): Coupon | null {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  return coupons.find(c => c.active && c.code === clean) ?? null;
}

export interface CartTotals {
  subtotal: Cents;
  discount: Cents;
  deliveryFee: Cents;
  total: Cents;
}

export function computeCartTotals(
  lines: PricedLine[],
  opts: { discountPercent?: number; deliveryFee?: number } = {},
): CartTotals {
  for (const l of lines) {
    if (!Number.isFinite(l.quantity) || l.quantity <= 0) throw new Error('Cantidad inválida');
    if (!Number.isFinite(l.unitPrice) || l.unitPrice < 0) throw new Error('Precio inválido');
  }
  const subtotal = sumCents(lines.map(l => mulCents(toCents(l.unitPrice), l.quantity)));
  const pct = Math.min(Math.max(opts.discountPercent ?? 0, 0), MAX_DISCOUNT_PERCENT);
  const discount = Math.min(mulCents(subtotal, pct / 100), subtotal);
  const deliveryFee = toCents(Math.max(opts.deliveryFee ?? 0, 0));
  return { subtotal, discount, deliveryFee, total: subtotal - discount + deliveryFee };
}

export function roundToStep(pesos: number, step: number): number {
  if (step <= 0) throw new Error('El paso de redondeo debe ser positivo');
  return Math.round(pesos / step) * step;
}

export function applyIncrease(pesos: number, percent: number, step = 1): number {
  if (!Number.isFinite(percent) || percent <= -100 || percent > 300) {
    throw new Error('Porcentaje de ajuste fuera de rango (-100 < % ≤ 300)');
  }
  const result = roundToStep(pesos * (1 + percent / 100), step);
  if (result < 0) throw new Error('El precio resultante no puede ser negativo');
  return result;
}

export function marginPercent(sale: number, cost: number): number {
  if (sale <= 0) return 0;
  return Math.round(((sale - cost) / sale) * 1000) / 10;
}
