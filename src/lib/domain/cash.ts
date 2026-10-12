/**
 * Reglas de caja (módulo puro). Todos los importes se calculan en centavos
 * para evitar errores de punto flotante y se devuelven en pesos.
 */
import { toCents, fromCents } from './money.ts';

export type CashMovementType = 'ingreso_manual' | 'retiro' | 'gasto' | 'venta' | 'devolucion';

export interface CashMovementLike {
  movement_type: CashMovementType;
  amount: number;
  payment_method: string;
}

export interface CashTotals {
  salesCash: number;
  salesDigital: number;
  expenses: number;
  withdrawals: number;
  manualIn: number;
  refunds: number;
  expectedCash: number;
}

export function assertSessionOpen(session: { status: string } | null | undefined): void {
  if (!session || session.status !== 'abierta') {
    throw new Error('La caja está cerrada. Abrí una sesión de caja para registrar cobros, gastos o retiros.');
  }
}

export function assertPositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('El importe debe ser mayor a cero');
}

/** Recalcula los totales de la sesión a partir de sus movimientos (fuente única de verdad). */
export function computeCashTotals(initialCash: number, movements: CashMovementLike[]): CashTotals {
  let salesCash = 0, salesDigital = 0, expenses = 0, withdrawals = 0, manualIn = 0, refunds = 0;
  let cash = toCents(initialCash);
  for (const m of movements) {
    const c = toCents(m.amount);
    const isCash = m.payment_method === 'efectivo';
    switch (m.movement_type) {
      case 'venta':
        if (isCash) { salesCash += c; cash += c; } else salesDigital += c;
        break;
      case 'ingreso_manual':
        manualIn += c; cash += c;
        break;
      case 'retiro':
        withdrawals += c; cash -= c;
        break;
      case 'gasto':
        expenses += c; if (isCash) cash -= c;
        break;
      case 'devolucion':
        refunds += c; if (isCash) cash -= c;
        break;
    }
  }
  return {
    salesCash: fromCents(salesCash),
    salesDigital: fromCents(salesDigital),
    expenses: fromCents(expenses),
    withdrawals: fromCents(withdrawals),
    manualIn: fromCents(manualIn),
    refunds: fromCents(refunds),
    expectedCash: fromCents(cash),
  };
}

/** Diferencia de arqueo: positivo = sobrante, negativo = faltante. */
export function closingDifference(expectedCash: number, countedCash: number): number {
  if (!Number.isFinite(countedCash) || countedCash < 0) throw new Error('El efectivo contado no puede ser negativo');
  return fromCents(toCents(countedCash) - toCents(expectedCash));
}
