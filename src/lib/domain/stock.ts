/**
 * Reglas de inventario (módulo puro, sin dependencias de React ni de storage).
 *
 * Principio: una venta genera UN conjunto de deltas, calculado una sola vez,
 * que se guarda junto a la venta/pedido. Cancelar = aplicar los deltas inversos.
 * Así es imposible descontar dos veces la misma materia prima.
 */

export type StockMode = 'batch' | 'recipe_on_sale' | 'simple' | 'none';

export interface StockVariant {
  id: string;
  stock_units?: number;
}

export interface ComboComponent {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export interface StockProduct {
  id: string;
  name: string;
  product_type: string;
  stock_mode?: StockMode;
  current_stock: number;
  variants?: StockVariant[];
  combo_items?: ComboComponent[];
}

export interface StockIngredient {
  id: string;
  name: string;
  current_stock: number;
}

export interface StockRecipe {
  product_id: string;
  yield_quantity: number;
  items: { ingredient_id: string; quantity: number; waste_percentage: number }[];
}

export interface StockLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface StockDelta {
  kind: 'product' | 'ingredient';
  id: string;
  delta: number;
}

export interface Shortage {
  kind: 'product' | 'ingredient';
  id: string;
  name: string;
  required: number;
  available: number;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function resolveStockMode(p: StockProduct, recipes: StockRecipe[]): StockMode {
  if (p.stock_mode) return p.stock_mode;
  if (p.product_type === 'combo') return 'none';
  if (p.product_type === 'simple') return 'simple';
  return recipes.some(r => r.product_id === p.id) ? 'recipe_on_sale' : 'none';
}

function variantUnits(p: StockProduct, variantId?: string): number {
  if (!variantId) return 1;
  const v = p.variants?.find(x => x.id === variantId);
  const u = v?.stock_units ?? 1;
  if (!Number.isFinite(u) || u <= 0) throw new Error(`Unidades de stock inválidas en variante de ${p.name}`);
  return u;
}

/** Calcula los deltas de inventario que produce vender `lines`. Los combos se expanden en sus componentes. */
export function computeSaleDeltas(
  lines: StockLine[],
  products: StockProduct[],
  recipes: StockRecipe[],
): StockDelta[] {
  const acc = new Map<string, StockDelta>();
  const push = (kind: StockDelta['kind'], id: string, delta: number) => {
    const key = `${kind}:${id}`;
    const prev = acc.get(key);
    if (prev) prev.delta = round3(prev.delta + delta);
    else acc.set(key, { kind, id, delta: round3(delta) });
  };

  const visit = (line: StockLine, depth: number) => {
    if (depth > 3) throw new Error('Combo anidado demasiado profundo');
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error('Cantidad inválida');
    const p = products.find(x => x.id === line.productId);
    if (!p) throw new Error(`Producto inexistente: ${line.productId}`);

    if (p.product_type === 'combo' && p.combo_items?.length) {
      for (const c of p.combo_items) {
        visit({ productId: c.product_id, variantId: c.variant_id, quantity: c.quantity * line.quantity }, depth + 1);
      }
      return;
    }

    const units = line.quantity * variantUnits(p, line.variantId);
    const mode = resolveStockMode(p, recipes);
    if (mode === 'batch' || mode === 'simple') {
      push('product', p.id, -units);
    } else if (mode === 'recipe_on_sale') {
      const r = recipes.find(x => x.product_id === p.id);
      if (!r) return;
      const yieldQ = r.yield_quantity > 0 ? r.yield_quantity : 1;
      for (const it of r.items) {
        push('ingredient', it.ingredient_id, -(it.quantity * units / yieldQ) * (1 + (it.waste_percentage || 0) / 100));
      }
    }
  };

  for (const l of lines) visit(l, 0);
  return [...acc.values()].filter(d => d.delta !== 0);
}

/** Insumos que consume iniciar una tanda de `units` productos (ej. pollos al spiedo). */
export function computeBatchStartDeltas(productId: string, units: number, recipes: StockRecipe[]): StockDelta[] {
  if (!Number.isFinite(units) || units <= 0) throw new Error('La tanda debe tener al menos 1 unidad');
  const r = recipes.find(x => x.product_id === productId);
  if (!r) throw new Error('El producto de la tanda no tiene receta configurada');
  const yieldQ = r.yield_quantity > 0 ? r.yield_quantity : 1;
  return r.items.map(it => ({
    kind: 'ingredient' as const,
    id: it.ingredient_id,
    delta: round3(-(it.quantity * units / yieldQ) * (1 + (it.waste_percentage || 0) / 100)),
  }));
}

/** Devuelve los faltantes; lista vacía = se puede cumplir. */
export function findShortages(
  deltas: StockDelta[],
  products: StockProduct[],
  ingredients: StockIngredient[],
): Shortage[] {
  const out: Shortage[] = [];
  for (const d of deltas) {
    if (d.delta >= 0) continue;
    const item = d.kind === 'product' ? products.find(p => p.id === d.id) : ingredients.find(i => i.id === d.id);
    if (!item) {
      out.push({ kind: d.kind, id: d.id, name: d.id, required: -d.delta, available: 0 });
      continue;
    }
    if (item.current_stock + d.delta < -1e-9) {
      out.push({ kind: d.kind, id: d.id, name: item.name, required: round3(-d.delta), available: item.current_stock });
    }
  }
  return out;
}

export function reverseDeltas(deltas: StockDelta[]): StockDelta[] {
  return deltas.map(d => ({ ...d, delta: -d.delta }));
}

export function describeShortages(s: Shortage[]): string {
  return s.map(x => `${x.name}: se necesitan ${x.required}, hay ${x.available}`).join(' · ');
}
