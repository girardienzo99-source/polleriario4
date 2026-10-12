/**
 * Máquina de estados de pedidos (módulo puro).
 */
export type OrderStatus = 'recibido' | 'confirmado' | 'en_preparacion' | 'listo' | 'en_reparto' | 'entregado' | 'cancelado';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  recibido: ['confirmado', 'en_preparacion', 'cancelado'],
  confirmado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'cancelado'],
  listo: ['en_reparto', 'entregado', 'cancelado'],
  en_reparto: ['entregado', 'listo'],
  entregado: [],
  cancelado: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  recibido: 'Recibido',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/** Nivel de demora para la pantalla de cocina. */
export function delayLevel(createdAtIso: string, now: number = Date.now()): 'ok' | 'warn' | 'late' {
  const min = (now - new Date(createdAtIso).getTime()) / 60_000;
  if (min >= 30) return 'late';
  if (min >= 15) return 'warn';
  return 'ok';
}
