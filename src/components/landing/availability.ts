import type { Product, ProductVariant } from '@/types/database';

/** Precio vigente (pesos) de un producto o de su variante. */
export function unitPriceOf(product: Product, variant?: ProductVariant): number {
  return variant ? variant.final_price : product.sale_price;
}

export function activeVariants(product: Product): ProductVariant[] {
  return (product.variants ?? []).filter(v => v.active);
}

export function defaultVariant(product: Product): ProductVariant | undefined {
  const vs = activeVariants(product);
  return vs.find(v => v.is_default) ?? vs[0];
}

const tracksStock = (p: Product) => p.stock_mode === 'batch' || p.stock_mode === 'simple';

/**
 * Máximo de unidades vendibles según stock terminado. Infinity si no controla stock.
 * Para combos se calcula a partir de sus componentes con stock propio.
 */
export function maxUnits(product: Product, variant: ProductVariant | undefined, products: Product[]): number {
  if (!product.active || !product.is_available) return 0;
  let max = Infinity;
  if (tracksStock(product)) {
    const units = variant?.stock_units ?? 1;
    max = Math.min(max, Math.floor((product.current_stock + 1e-9) / units));
  }
  for (const ci of product.combo_items ?? []) {
    const comp = products.find(p => p.id === ci.product_id);
    if (!comp || !comp.active || !comp.is_available) return 0;
    if (!tracksStock(comp)) continue;
    const cv = ci.variant_id ? comp.variants?.find(v => v.id === ci.variant_id) : undefined;
    const need = ci.quantity * (cv?.stock_units ?? 1);
    if (need > 0) max = Math.min(max, Math.floor((comp.current_stock + 1e-9) / need));
  }
  return Math.max(0, max);
}

export function isSellable(product: Product, variant: ProductVariant | undefined, products: Product[]): boolean {
  return maxUnits(product, variant, products) > 0;
}

/** Un producto está agotado si ninguna de sus variantes (o él mismo) puede venderse. */
export function isSoldOut(product: Product, products: Product[]): boolean {
  const vs = activeVariants(product);
  if (vs.length) return vs.every(v => !isSellable(product, v, products));
  return !isSellable(product, undefined, products);
}

/** Productos visibles en la landing. */
export function isListed(product: Product): boolean {
  return product.active && product.is_visible_landing;
}

/** Tope por línea para evitar pedidos accidentales enormes. */
export const MAX_QTY_PER_LINE = 30;
