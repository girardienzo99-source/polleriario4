/**
 * Matriz de permisos por rol. La UI la usa para filtrar menús y bloquear vistas,
 * y la misma matriz está reflejada en las políticas RLS de Supabase
 * (supabase/migrations/2026101202_rls_real.sql). En esta demo local la
 * validación es del lado del cliente; con Supabase conectado, la RLS es la que manda.
 */
export type Role = 'admin' | 'encargado' | 'cajero' | 'cocinero' | 'repartidor';

export type ModuleId =
  | 'pos'
  | 'kitchen'
  | 'products'
  | 'stock'
  | 'prices'
  | 'cash'
  | 'arca'
  | 'settings';

export const ALL_MODULES: ModuleId[] = [
  'pos',
  'kitchen',
  'products',
  'stock',
  'prices',
  'cash',
  'arca',
  'settings',
];

const ALL = ALL_MODULES;

export const ROLE_MODULES: Record<Role, ModuleId[]> = {
  admin: ALL,
  encargado: ['pos', 'kitchen', 'products', 'stock', 'prices', 'cash'],
  cajero: ['pos', 'cash'],
  cocinero: ['kitchen', 'stock'],
  repartidor: ['pos'],
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  cajero: 'Cajero',
  cocinero: 'Cocinero',
  repartidor: 'Repartidor',
};

export function canAccess(role: Role | null | undefined, module: ModuleId): boolean {
  if (!role) return false;
  return ROLE_MODULES[role]?.includes(module) ?? false;
}

export function defaultModule(role: Role): ModuleId {
  return ROLE_MODULES[role][0];
}

/** Acciones sensibles (más finas que el acceso a un módulo). */
export type Action = 'cancel_order' | 'edit_prices' | 'adjust_stock' | 'close_cash' | 'emit_invoice' | 'reset_data';

const ACTIONS: Record<Action, Role[]> = {
  cancel_order: ['admin', 'encargado', 'cajero'],
  edit_prices: ['admin', 'encargado'],
  adjust_stock: ['admin', 'encargado'],
  close_cash: ['admin', 'encargado', 'cajero'],
  emit_invoice: ['admin', 'encargado', 'cajero'],
  reset_data: ['admin'],
};

export function canDo(role: Role | null | undefined, action: Action): boolean {
  return !!role && ACTIONS[action].includes(role);
}
