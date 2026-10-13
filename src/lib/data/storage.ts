'use client';

/**
 * Repositorio local (localStorage) de la DEMO. Toda regla de negocio vive en
 * src/lib/domain/* (módulos puros y testeados); este archivo sólo persiste.
 *
 * Al conectar Supabase, cada método se reemplaza por su equivalente en un
 * repositorio Supabase (misma firma) y las validaciones se repiten en el
 * servidor mediante funciones SQL/RLS (ver supabase/migrations).
 */

import {
  Product,
  Category,
  Ingredient,
  Recipe,
  Order,
  OrderStatus,
  PaymentStatus,
  ProductionBatch,
  CashSession,
  CashMovement,
  Customer,
  Supplier,
  Expense,
  Sale,
  SaleItem,
  DeliveryZone,
  Promotion,
  FiscalSettings,
  FiscalDocument,
  InventoryMovement,
  Purchase,
  Business,
} from '@/types/database';

import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_DELIVERY_ZONES,
  INITIAL_PROMOTIONS,
  INITIAL_PRODUCTION_BATCHES,
  INITIAL_CASH_SESSION,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_EXPENSES,
  INITIAL_FISCAL_SETTINGS,
  INITIAL_BUSINESS,
} from './mock-data';

import {
  computeSaleDeltas,
  computeBatchStartDeltas,
  findShortages,
  reverseDeltas,
  describeShortages,
  type StockDelta,
  type StockLine,
} from '@/lib/domain/stock';
import { assertSessionOpen, assertPositiveAmount, computeCashTotals, closingDifference } from '@/lib/domain/cash';
import { canTransition } from '@/lib/domain/orders';

/** Subir este número invalida datos locales de versiones anteriores incompatibles. */
const STORE_VERSION = '6';

const STORAGE_KEYS = {
  VERSION: 'polleria_store_version',
  PRODUCTS: 'polleria_products',
  CATEGORIES: 'polleria_categories',
  INGREDIENTS: 'polleria_ingredients',
  RECIPES: 'polleria_recipes',
  ORDERS: 'polleria_orders',
  BATCHES: 'polleria_batches',
  CASH_SESSION: 'polleria_cash_session',
  CASH_HISTORY: 'polleria_cash_history',
  CASH_MOVEMENTS: 'polleria_cash_movements',
  CUSTOMERS: 'polleria_customers',
  SUPPLIERS: 'polleria_suppliers',
  PURCHASES: 'polleria_purchases',
  EXPENSES: 'polleria_expenses',
  SALES: 'polleria_sales',
  DELIVERY_ZONES: 'polleria_delivery_zones',
  PROMOTIONS: 'polleria_promotions',
  FISCAL_SETTINGS: 'polleria_fiscal_settings',
  FISCAL_DOCS: 'polleria_fiscal_docs',
  INVENTORY_MOVEMENTS: 'polleria_inventory_movements',
  COUNTERS: 'polleria_counters',
  BUSINESS: 'polleria_business',
};

export const STORE_EVENT = 'polleria_store_updated';

const isBrowser = () => typeof window !== 'undefined';

let versionChecked = false;
function ensureVersion() {
  if (!isBrowser() || versionChecked) return;
  if (localStorage.getItem(STORAGE_KEYS.VERSION) === STORE_VERSION) {
    versionChecked = true;
    return;
  }
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('polleria_cart');
  localStorage.setItem(STORAGE_KEYS.VERSION, STORE_VERSION);
  versionChecked = true;
}

function getItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  ensureVersion();
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : structuredClone(fallback);
  } catch (e) {
    console.error(`Error leyendo ${key}:`, e);
    return structuredClone(fallback);
  }
}

let batching = 0;
function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  ensureVersion();
  localStorage.setItem(key, JSON.stringify(value));
  if (batching === 0) window.dispatchEvent(new Event(STORE_EVENT));
}

/**
 * Ejecuta varias escrituras como una unidad: si algo falla, restaura el estado
 * previo de todas las claves (equivalente local a una transacción).
 */
function transaction<T>(fn: () => T): T {
  if (!isBrowser()) return fn();
  const snapshot = Object.values(STORAGE_KEYS).map(k => [k, localStorage.getItem(k)] as const);
  batching++;
  try {
    const result = fn();
    batching--;
    if (batching === 0) window.dispatchEvent(new Event(STORE_EVENT));
    return result;
  } catch (e) {
    for (const [k, v] of snapshot) {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
    batching--;
    throw e;
  }
}

function currentUserName(): string {
  if (!isBrowser()) return 'sistema';
  try {
    const u = JSON.parse(localStorage.getItem('polleria_auth_user') || 'null');
    return u?.full_name || 'Cliente web';
  } catch {
    return 'sistema';
  }
}

function nextNumber(counter: string, start: number): number {
  const counters = getItem<Record<string, number>>(STORAGE_KEYS.COUNTERS, {});
  const n = (counters[counter] ?? start) + 1;
  counters[counter] = n;
  setItem(STORAGE_KEYS.COUNTERS, counters);
  return n;
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function upsert<T extends { id: string }>(key: string, list: T[], item: T, prepend = true): void {
  const idx = list.findIndex(x => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else if (prepend) list.unshift(item);
  else list.push(item);
  setItem(key, list);
}

export const PolleriaStore = {
  // ---------------------------------------------------------------- mantenimiento
  /** Restaura el catálogo y los pedidos de demostración. */
  resetToDemo(): void {
    if (!isBrowser()) return;
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.setItem(STORAGE_KEYS.VERSION, STORE_VERSION);
    versionChecked = true;
    window.dispatchEvent(new Event(STORE_EVENT));
  },

  /** Conserva catálogo, recetas, insumos y configuración; borra toda la operación. */
  clearOperationalData(): void {
    transaction(() => {
      setItem(STORAGE_KEYS.ORDERS, []);
      setItem(STORAGE_KEYS.SALES, []);
      setItem(STORAGE_KEYS.BATCHES, []);
      setItem(STORAGE_KEYS.CASH_MOVEMENTS, []);
      setItem(STORAGE_KEYS.CASH_HISTORY, []);
      setItem(STORAGE_KEYS.CASH_SESSION, INITIAL_CASH_SESSION);
      setItem(STORAGE_KEYS.EXPENSES, []);
      setItem(STORAGE_KEYS.FISCAL_DOCS, []);
      setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
      setItem(STORAGE_KEYS.PURCHASES, []);
    });
  },

  // ---------------------------------------------------------------- catálogo
  getCategories(): Category[] {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategory(category: Category): void {
    if (!category.name.trim()) throw new Error('La categoría necesita un nombre');
    upsert(STORAGE_KEYS.CATEGORIES, this.getCategories(), category, false);
  },

  getProducts(): Product[] {
    const items = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return items.map(p => {
      if (p.id === 'prod-combo-campeon' && p.image_url === '/images/combo-campeon.jpg') {
        return { ...p, image_url: '/images/combo-brasa.jpg' };
      }
      if (p.id === 'prod-combo-familiar' && p.image_url === '/images/combo-familiar.jpg') {
        return { ...p, image_url: '/images/parrillada-completa.jpg' };
      }
      return p;
    });
  },
  saveProduct(product: Product): void {
    if (!product.name.trim()) throw new Error('El producto necesita un nombre');
    if (!Number.isFinite(product.sale_price) || product.sale_price < 0) throw new Error('Precio de venta inválido');
    if (!Number.isFinite(product.cost_price) || product.cost_price < 0) throw new Error('Costo inválido');
    const list = this.getProducts();
    if (product.sku && list.some(p => p.id !== product.id && p.active && p.sku === product.sku)) {
      throw new Error(`El SKU ${product.sku} ya está en uso`);
    }
    upsert(STORAGE_KEYS.PRODUCTS, list, product);
  },
  /** Guarda varios productos en una sola escritura atómica (ej. aumento masivo de precios). */
  saveProductsBulk(products: Product[]): void {
    transaction(() => {
      setItem(STORAGE_KEYS.PRODUCTS, products);
    });
  },
  /** Baja lógica: el producto se conserva para el historial de ventas. */
  deleteProduct(productId: string): void {
    setItem(STORAGE_KEYS.PRODUCTS, this.getProducts().map(p => (p.id === productId ? { ...p, active: false, is_visible_landing: false } : p)));
  },

  // ---------------------------------------------------------------- inventario
  getIngredients(): Ingredient[] {
    return getItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS);
  },
  saveIngredient(ingredient: Ingredient): void {
    if (!ingredient.name.trim()) throw new Error('El insumo necesita un nombre');
    upsert(STORAGE_KEYS.INGREDIENTS, this.getIngredients(), ingredient);
  },

  getInventoryMovements(): InventoryMovement[] {
    return getItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  },

  /**
   * Aplica deltas de stock de forma atómica y deja trazabilidad (motivo, usuario, fecha, referencia).
   * Rechaza cualquier movimiento que deje stock negativo.
   */
  applyStockDeltas(deltas: StockDelta[], reason: string, reference?: string): void {
    if (!reason.trim()) throw new Error('Todo movimiento de stock requiere un motivo');
    if (deltas.length === 0) return;
    const products = this.getProducts();
    const ingredients = this.getIngredients();
    const shortages = findShortages(deltas, products, ingredients);
    if (shortages.length) throw new Error(`Stock insuficiente — ${describeShortages(shortages)}`);

    const movements = this.getInventoryMovements();
    const user = currentUserName();
    const now = new Date().toISOString();
    for (const d of deltas) {
      const list: (Product | Ingredient)[] = d.kind === 'product' ? products : ingredients;
      const item = list.find(x => x.id === d.id);
      if (!item) throw new Error(`Ítem de stock inexistente: ${d.id}`);
      item.current_stock = Math.round((item.current_stock + d.delta) * 1000) / 1000;
      movements.unshift({
        id: uid('mov'), item_kind: d.kind, item_id: d.id, item_name: item.name, delta: d.delta,
        stock_after: item.current_stock, reason, reference, user_name: user, created_at: now,
      });
    }
    setItem(STORAGE_KEYS.PRODUCTS, products);
    setItem(STORAGE_KEYS.INGREDIENTS, ingredients);
    setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements.slice(0, 5000));
  },

  adjustIngredientStock(ingredientId: string, deltaQuantity: number, reason: string, reference?: string): void {
    if (!Number.isFinite(deltaQuantity) || deltaQuantity === 0) throw new Error('La cantidad debe ser distinta de cero');
    transaction(() => this.applyStockDeltas([{ kind: 'ingredient', id: ingredientId, delta: deltaQuantity }], reason, reference));
  },

  adjustProductStock(productId: string, deltaQuantity: number, reason: string, reference?: string): void {
    if (!Number.isFinite(deltaQuantity) || deltaQuantity === 0) throw new Error('La cantidad debe ser distinta de cero');
    transaction(() => this.applyStockDeltas([{ kind: 'product', id: productId, delta: deltaQuantity }], reason, reference));
  },

  /** Verifica disponibilidad sin modificar nada (para avisar antes de confirmar). */
  checkAvailability(lines: StockLine[]): string | null {
    const deltas = computeSaleDeltas(lines, this.getProducts(), this.getRecipes());
    const s = findShortages(deltas, this.getProducts(), this.getIngredients());
    return s.length ? describeShortages(s) : null;
  },

  // ---------------------------------------------------------------- recetas
  getRecipes(): Recipe[] {
    return getItem<Recipe[]>(STORAGE_KEYS.RECIPES, INITIAL_RECIPES);
  },
  saveRecipe(recipe: Recipe): void {
    if (recipe.items.some(i => !(i.quantity > 0))) throw new Error('Las cantidades de la receta deben ser mayores a cero');
    upsert(STORAGE_KEYS.RECIPES, this.getRecipes(), recipe, false);
  },

  // ---------------------------------------------------------------- compras
  getPurchases(): Purchase[] {
    return getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  },
  /** Registra una compra recibida: suma stock, actualiza costo y (si se paga en efectivo) impacta caja. */
  receivePurchase(p: Omit<Purchase, 'id' | 'created_at' | 'status' | 'total'> & { pay_cash?: boolean }): Purchase {
    if (!p.items.length) throw new Error('La compra no tiene ítems');
    return transaction(() => {
      const purchase: Purchase = {
        ...p,
        id: uid('pur'),
        status: 'recibida',
        received_at: new Date().toISOString(),
        total: Math.round(p.items.reduce((a, i) => a + i.quantity * i.unit_cost, 0) * 100) / 100,
        created_at: new Date().toISOString(),
      };
      const ref = `Compra ${purchase.invoice_number || purchase.id}`;
      this.applyStockDeltas(purchase.items.map(i => ({ kind: 'ingredient' as const, id: i.ingredient_id, delta: i.quantity })), 'Compra a proveedor', ref);
      const ingredients = this.getIngredients().map(ing => {
        const it = purchase.items.find(i => i.ingredient_id === ing.id);
        return it ? { ...ing, cost_price: it.unit_cost } : ing;
      });
      setItem(STORAGE_KEYS.INGREDIENTS, ingredients);
      const list = this.getPurchases();
      list.unshift(purchase);
      setItem(STORAGE_KEYS.PURCHASES, list);
      if (p.pay_cash) {
        this.recordCashMovement({ movement_type: 'gasto', amount: purchase.total, payment_method: 'efectivo', concept: `${ref} — ${purchase.supplier_name ?? ''}` });
      }
      return purchase;
    });
  },

  // ---------------------------------------------------------------- pedidos
  getOrders(): Order[] {
    return getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  /**
   * Crea un pedido. Los precios se toman SIEMPRE del catálogo vigente (no del carrito),
   * se verifica stock y se reservan las unidades en la misma operación.
   */
  createOrder(order: Order, opts: { discountPercent?: number } = {}): Order {
    if (!order.items.length) throw new Error('El pedido no tiene productos');
    if (!order.customer_name.trim() || !order.customer_phone.trim()) throw new Error('Nombre y teléfono son obligatorios');
    if (order.delivery_type === 'delivery' && !order.customer_address?.trim()) throw new Error('La dirección es obligatoria para envíos');

    return transaction(() => {
      const products = this.getProducts();
      const items = order.items.map(it => {
        const p = products.find(x => x.id === it.product_id && x.active);
        if (!p) throw new Error(`"${it.product_name}" ya no está disponible`);
        if (!p.is_available) throw new Error(`"${p.name}" no está disponible en este momento`);
        const v = it.variant_id ? p.variants?.find(x => x.id === it.variant_id && x.active) : undefined;
        if (it.variant_id && !v) throw new Error(`La variante de "${p.name}" ya no está disponible`);
        const unit = v ? v.final_price : p.sale_price;
        return { ...it, unit_price: unit, subtotal: Math.round(unit * it.quantity * 100) / 100, product_name: v ? `${p.name} (${v.name})` : p.name };
      });
      const subtotal = items.reduce((a, i) => a + i.subtotal, 0);
      const pct = Math.min(Math.max(opts.discountPercent ?? 0, 0), 50);
      const discount = Math.round(subtotal * pct) / 100;
      let delivery_fee = 0;
      let delivery_zone_name: string | undefined;
      if (order.delivery_type === 'delivery') {
        const zone = this.getDeliveryZones().find(z => z.id === order.delivery_zone_id && z.active);
        if (!zone) throw new Error('Seleccioná una zona de envío válida');
        delivery_fee = zone.price;
        delivery_zone_name = zone.name;
      }

      const id = uid('ord');
      const number = nextNumber('order', 1000 + this.getOrders().length);
      const deltas = computeSaleDeltas(items.map(i => ({ productId: i.product_id!, variantId: i.variant_id, quantity: i.quantity })), products, this.getRecipes());
      this.applyStockDeltas(deltas, 'Reserva por pedido', `#POL-${number}`);

      const created: Order = {
        ...order,
        id,
        order_number: `#POL-${number}`,
        items: items.map(i => ({ ...i, order_id: id })),
        subtotal,
        discount,
        delivery_fee,
        delivery_zone_name,
        total: Math.round((subtotal - discount + delivery_fee) * 100) / 100,
        stock_deltas: deltas,
        created_by: currentUserName(),
        created_at: new Date().toISOString(),
      };
      const list = this.getOrders();
      list.unshift(created);
      setItem(STORAGE_KEYS.ORDERS, list);
      return created;
    });
  },

  updateOrderStatus(orderId: string, newStatus: OrderStatus, reason?: string): void {
    transaction(() => {
      const list = this.getOrders();
      const ord = list.find(o => o.id === orderId);
      if (!ord) throw new Error('Pedido inexistente');
      if (!canTransition(ord.status, newStatus)) throw new Error(`No se puede pasar de "${ord.status}" a "${newStatus}"`);
      if (newStatus === 'cancelado') {
        if (!reason?.trim()) throw new Error('Indicá el motivo de la cancelación');
        if (ord.stock_deltas?.length) {
          this.applyStockDeltas(reverseDeltas(ord.stock_deltas), 'Reversión por cancelación', ord.order_number);
        }
        if (ord.payment_status === 'pagado') {
          this.recordCashMovement({ movement_type: 'devolucion', amount: ord.total, payment_method: ord.payment_method, concept: `Devolución ${ord.order_number}` });
          ord.payment_status = 'rechazado';
        }
        ord.stock_deltas = [];
        ord.cancel_reason = reason;
      }
      ord.status = newStatus;
      ord.updated_at = new Date().toISOString();
      setItem(STORAGE_KEYS.ORDERS, list);
    });
  },

  /** Cobrar un pedido: exige caja abierta, genera la venta y el movimiento de caja. No vuelve a tocar stock. */
  updateOrderPayment(orderId: string, paymentStatus: PaymentStatus): void {
    transaction(() => {
      const list = this.getOrders();
      const ord = list.find(o => o.id === orderId);
      if (!ord) throw new Error('Pedido inexistente');
      if (ord.status === 'cancelado') throw new Error('El pedido está cancelado');
      if (paymentStatus === 'pagado' && ord.payment_status !== 'pagado') {
        const products = this.getProducts();
        const sale = this.recordSaleInternal({
          id: '', business_id: ord.business_id, sale_number: '', order_id: ord.id,
          customer_id: ord.customer_id, customer_name: ord.customer_name, channel: ord.channel,
          subtotal: ord.subtotal, discount: ord.discount, tax_amount: 0, total: ord.total,
          payment_method: ord.payment_method, fiscal_status: 'no_fiscal',
          items: [
            ...ord.items.map<SaleItem>(i => ({
              id: uid('si'), sale_id: '', product_id: i.product_id, variant_id: i.variant_id, description: i.product_name,
              quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal,
              cost_price: costOf(products, i.product_id, i.variant_id),
            })),
            ...(ord.delivery_fee > 0 ? [{ id: uid('si'), sale_id: '', description: 'Envío a domicilio', quantity: 1, unit_price: ord.delivery_fee, subtotal: ord.delivery_fee, cost_price: 0 }] : []),
          ],
          created_at: '',
        }, { skipStock: true });
        ord.sale_id = sale.id;
      }
      ord.payment_status = paymentStatus;
      ord.updated_at = new Date().toISOString();
      setItem(STORAGE_KEYS.ORDERS, list);
    });
  },

  // ---------------------------------------------------------------- producción
  getBatches(): ProductionBatch[] {
    return getItem<ProductionBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_PRODUCTION_BATCHES);
  },
  /** Inicia una tanda: descuenta los insumos de la receta UNA vez (pollo crudo, adobo, etc.). */
  startBatch(input: { product_id?: string; raw_quantity: number; minutes: number; operator_name: string; notes?: string }): ProductionBatch {
    return transaction(() => {
      const productId = input.product_id || 'prod-spiedo-entero';
      const n = nextNumber('batch', this.getBatches().length);
      const batch: ProductionBatch = {
        id: uid('batch'),
        branch_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        batch_number: `TANDA-${String(n).padStart(3, '0')}`,
        product_id: productId,
        start_time: new Date().toISOString(),
        estimated_end_time: new Date(Date.now() + input.minutes * 60_000).toISOString(),
        raw_chicken_quantity: input.raw_quantity,
        cooked_quantity: 0, sold_quantity: 0, leftover_quantity: 0, waste_quantity: 0,
        status: 'en_horno',
        operator_name: input.operator_name || currentUserName(),
        notes: input.notes,
        created_at: new Date().toISOString(),
      };
      this.applyStockDeltas(computeBatchStartDeltas(productId, input.raw_quantity, this.getRecipes()), 'Inicio de tanda de producción', batch.batch_number);
      const list = this.getBatches();
      list.unshift(batch);
      setItem(STORAGE_KEYS.BATCHES, list);
      return batch;
    });
  },
  /** Cierra la tanda: suma stock TERMINADO; la diferencia con lo crudo queda como desperdicio. */
  markBatchReady(batchId: string, cookedQuantity: number): void {
    transaction(() => {
      const list = this.getBatches();
      const b = list.find(x => x.id === batchId);
      if (!b) throw new Error('Tanda inexistente');
      if (b.status !== 'en_horno') throw new Error('La tanda ya fue cerrada');
      if (!Number.isInteger(cookedQuantity) || cookedQuantity < 0 || cookedQuantity > b.raw_chicken_quantity) {
        throw new Error(`Cantidad cocinada inválida (0 a ${b.raw_chicken_quantity})`);
      }
      b.status = 'listo';
      b.cooked_quantity = cookedQuantity;
      b.waste_quantity = b.raw_chicken_quantity - cookedQuantity;
      b.leftover_quantity = cookedQuantity;
      b.actual_end_time = new Date().toISOString();
      setItem(STORAGE_KEYS.BATCHES, list);
      if (cookedQuantity > 0) {
        this.applyStockDeltas([{ kind: 'product', id: b.product_id || 'prod-spiedo-entero', delta: cookedQuantity }], 'Producción terminada', b.batch_number);
      }
    });
  },
  cancelBatch(batchId: string, reason: string): void {
    if (!reason.trim()) throw new Error('Indicá el motivo');
    const list = this.getBatches();
    const b = list.find(x => x.id === batchId);
    if (!b || b.status !== 'en_horno') throw new Error('Sólo se pueden cancelar tandas en horno');
    b.status = 'cancelado';
    b.waste_quantity = b.raw_chicken_quantity;
    b.notes = `${b.notes ? b.notes + ' · ' : ''}Cancelada: ${reason}`;
    setItem(STORAGE_KEYS.BATCHES, list);
  },

  // ---------------------------------------------------------------- caja
  getCashSession(): CashSession {
    const s = getItem<CashSession>(STORAGE_KEYS.CASH_SESSION, INITIAL_CASH_SESSION);
    if (s.status !== 'abierta') return s;
    const t = computeCashTotals(s.initial_cash, this.getCashMovements().filter(m => m.cash_session_id === s.id));
    return { ...s, expected_cash: t.expectedCash, total_sales_cash: t.salesCash, total_sales_digital: t.salesDigital, total_expenses: t.expenses, total_withdrawals: t.withdrawals };
  },
  getCashHistory(): CashSession[] {
    return getItem<CashSession[]>(STORAGE_KEYS.CASH_HISTORY, []);
  },
  isCashOpen(): boolean {
    return this.getCashSession().status === 'abierta';
  },
  openCashSession(userName: string, initialCash: number): CashSession {
    if (this.isCashOpen()) throw new Error('Ya hay una caja abierta');
    if (!Number.isFinite(initialCash) || initialCash < 0) throw new Error('El fondo inicial no puede ser negativo');
    const session: CashSession = {
      id: uid('session'), cash_register_id: 'reg-01', user_name: userName,
      opened_at: new Date().toISOString(), initial_cash: initialCash, expected_cash: initialCash,
      total_sales_cash: 0, total_sales_digital: 0, total_expenses: 0, total_withdrawals: 0, status: 'abierta',
    };
    setItem(STORAGE_KEYS.CASH_SESSION, session);
    return session;
  },
  closeCashSession(actualCash: number, notes?: string): CashSession {
    const current = this.getCashSession();
    assertSessionOpen(current);
    const closed: CashSession = {
      ...current,
      closed_at: new Date().toISOString(),
      actual_cash: actualCash,
      difference: closingDifference(current.expected_cash, actualCash),
      status: 'cerrada',
      notes: notes || current.notes,
    };
    transaction(() => {
      setItem(STORAGE_KEYS.CASH_SESSION, closed);
      const hist = this.getCashHistory();
      hist.unshift(closed);
      setItem(STORAGE_KEYS.CASH_HISTORY, hist);
    });
    return closed;
  },
  recordCashMovement(movement: Omit<CashMovement, 'id' | 'created_at' | 'cash_session_id'>): CashMovement {
    const session = this.getCashSession();
    assertSessionOpen(session);
    assertPositiveAmount(movement.amount);
    if (!movement.concept.trim()) throw new Error('El movimiento necesita un concepto');
    const m: CashMovement = { ...movement, cash_session_id: session.id, user_id: currentUserName(), id: uid('cmov'), created_at: new Date().toISOString() };
    const list = this.getCashMovements();
    list.unshift(m);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, list);
    return m;
  },
  getCashMovements(): CashMovement[] {
    return getItem<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
  },

  // ---------------------------------------------------------------- ventas
  getSales(): Sale[] {
    return getItem<Sale[]>(STORAGE_KEYS.SALES, []);
  },
  /** Venta de mostrador: caja abierta + stock suficiente, todo o nada. */
  recordSale(sale: Sale): Sale {
    return transaction(() => this.recordSaleInternal(sale, { skipStock: false }));
  },
  recordSaleInternal(sale: Sale, opts: { skipStock: boolean }): Sale {
    assertSessionOpen(this.getCashSession());
    if (!sale.items.length) throw new Error('La venta no tiene ítems');
    const number = nextNumber('sale', 1000 + this.getSales().length);
    const newSale: Sale = {
      ...sale,
      id: uid('sale'),
      sale_number: `#VTA-${number}`,
      cash_session_id: this.getCashSession().id,
      user_name: currentUserName(),
      created_at: new Date().toISOString(),
    };
    if (!opts.skipStock) {
      const lines = sale.items.filter(i => i.product_id).map(i => ({ productId: i.product_id!, variantId: i.variant_id, quantity: i.quantity }));
      const deltas = computeSaleDeltas(lines, this.getProducts(), this.getRecipes());
      this.applyStockDeltas(deltas, 'Venta', newSale.sale_number);
      newSale.stock_deltas = deltas;
    }
    const list = this.getSales();
    list.unshift(newSale);
    setItem(STORAGE_KEYS.SALES, list);
    this.recordCashMovement({ movement_type: 'venta', amount: newSale.total, payment_method: newSale.payment_method, concept: `Venta ${newSale.sale_number}` });
    if (newSale.customer_id) {
      const customers = this.getCustomers();
      const c = customers.find(x => x.id === newSale.customer_id);
      if (c) {
        c.total_orders += 1;
        c.total_spent = Math.round((c.total_spent + newSale.total) * 100) / 100;
        setItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }
    return newSale;
  },
  updateSale(sale: Sale): void {
    upsert(STORAGE_KEYS.SALES, this.getSales(), sale);
  },

  /**
   * Genera una comanda para Cocina a partir de una venta presencial (POS).
   * No vuelve a descontar stock porque la venta ya lo hizo.
   */
  createKitchenTicketFromSale(sale: Sale, notes?: string): Order {
    return transaction(() => {
      const id = uid('ord');
      const order: Order = {
        id,
        business_id: sale.business_id,
        order_number: sale.sale_number,
        customer_id: sale.customer_id,
        customer_name: sale.customer_name || 'Venta Mostrador',
        customer_phone: 'Mostrador',
        channel: 'mostrador',
        delivery_type: 'retiro',
        delivery_fee: 0,
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total,
        status: 'recibido',
        payment_method: sale.payment_method,
        payment_status: 'pagado',
        sale_id: sale.id,
        notes: notes?.trim() || 'Comanda de mostrador',
        items: sale.items.map(si => ({
          id: uid('oi'),
          order_id: id,
          product_id: si.product_id,
          variant_id: si.variant_id,
          product_name: si.description,
          quantity: si.quantity,
          unit_price: si.unit_price,
          subtotal: si.subtotal,
        })),
        created_at: sale.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const list = this.getOrders();
      list.unshift(order);
      setItem(STORAGE_KEYS.ORDERS, list);
      return order;
    });
  },

  // ---------------------------------------------------------------- clientes
  getCustomers(): Customer[] {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomer(customer: Customer): Customer {
    if (!customer.full_name.trim()) throw new Error('El cliente necesita un nombre');
    const list = this.getCustomers();
    const digits = customer.phone.replace(/\D/g, '');
    if (digits && list.some(c => c.id !== customer.id && c.phone.replace(/\D/g, '') === digits)) {
      throw new Error('Ya existe un cliente con ese teléfono');
    }
    const saved = { ...customer, id: customer.id || uid('cust') };
    upsert(STORAGE_KEYS.CUSTOMERS, list, saved);
    return saved;
  },

  // ---------------------------------------------------------------- proveedores
  getSuppliers(): Supplier[] {
    return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },
  saveSupplier(supplier: Supplier): void {
    if (!supplier.name.trim()) throw new Error('El proveedor necesita un nombre');
    upsert(STORAGE_KEYS.SUPPLIERS, this.getSuppliers(), { ...supplier, id: supplier.id || uid('sup') });
  },

  // ---------------------------------------------------------------- gastos
  getExpenses(): Expense[] {
    return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },
  /** Un gasto en efectivo sale de la caja: exige caja abierta. Otros medios sólo se registran. */
  saveExpense(expense: Expense): void {
    assertPositiveAmount(expense.amount);
    if (!expense.concept.trim()) throw new Error('El gasto necesita un concepto');
    transaction(() => {
      const isCash = expense.payment_method === 'efectivo';
      const open = this.isCashOpen();
      if (isCash && !open) throw new Error('Para registrar un gasto en efectivo, abrí la caja primero');
      const newExp: Expense = { ...expense, id: expense.id || uid('exp'), cash_session_id: isCash ? this.getCashSession().id : undefined, created_at: new Date().toISOString() };
      const list = this.getExpenses();
      list.unshift(newExp);
      setItem(STORAGE_KEYS.EXPENSES, list);
      if (isCash) {
        this.recordCashMovement({ movement_type: 'gasto', amount: newExp.amount, payment_method: 'efectivo', concept: `Gasto: ${newExp.concept}` });
      }
    });
  },

  // ---------------------------------------------------------------- envíos
  getDeliveryZones(): DeliveryZone[] {
    return getItem<DeliveryZone[]>(STORAGE_KEYS.DELIVERY_ZONES, INITIAL_DELIVERY_ZONES);
  },
  saveDeliveryZone(zone: DeliveryZone): void {
    if (!zone.name.trim()) throw new Error('La zona necesita un nombre');
    if (!(zone.price >= 0)) throw new Error('Tarifa inválida');
    upsert(STORAGE_KEYS.DELIVERY_ZONES, this.getDeliveryZones(), zone, false);
  },

  // ---------------------------------------------------------------- promociones
  getPromotions(): Promotion[] {
    const items = getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
    return items.map(p => {
      if (p.id === 'promo-1' && p.image_url === '/images/combo-campeon.jpg') {
        return { ...p, image_url: '/images/combo-brasa.jpg' };
      }
      if (p.id === 'promo-2' && p.image_url === '/images/combo-familiar.jpg') {
        return { ...p, image_url: '/images/parrillada-completa.jpg' };
      }
      return p;
    });
  },
  savePromotion(promo: Promotion): void {
    if (!promo.name.trim()) throw new Error('La promoción necesita un nombre');
    upsert(STORAGE_KEYS.PROMOTIONS, this.getPromotions(), promo);
  },

  // ---------------------------------------------------------------- fiscal
  getFiscalSettings(): FiscalSettings {
    return getItem<FiscalSettings>(STORAGE_KEYS.FISCAL_SETTINGS, INITIAL_FISCAL_SETTINGS);
  },
  saveFiscalSettings(settings: FiscalSettings): void {
    setItem(STORAGE_KEYS.FISCAL_SETTINGS, settings);
  },
  getFiscalDocuments(): FiscalDocument[] {
    return getItem<FiscalDocument[]>(STORAGE_KEYS.FISCAL_DOCS, []);
  },
  saveFiscalDocument(doc: FiscalDocument): void {
    if (doc.afip_status === 'autorizado' && !/^\d{14}$/.test(doc.cae || '')) {
      throw new Error('Un comprobante autorizado requiere un CAE real de ARCA');
    }
    const list = this.getFiscalDocuments();
    list.unshift(doc);
    setItem(STORAGE_KEYS.FISCAL_DOCS, list);
  },
  nextSimulationNumber(): number {
    return nextNumber('fiscal_sim', 0);
  },

  // ---------------------------------------------------------------- empresa
  getBusiness(): Business {
    return getItem<Business>(STORAGE_KEYS.BUSINESS, INITIAL_BUSINESS);
  },
  saveBusiness(business: Business): void {
    if (!business.name.trim()) throw new Error('La razón social es obligatoria');
    setItem(STORAGE_KEYS.BUSINESS, business);
  },
};

function costOf(products: Product[], productId?: string, variantId?: string): number {
  const p = products.find(x => x.id === productId);
  if (!p) return 0;
  if (!variantId || !p.sale_price) return p.cost_price;
  const v = p.variants?.find(x => x.id === variantId);
  return v ? Math.round(p.cost_price * (v.stock_units ?? v.final_price / p.sale_price) * 100) / 100 : p.cost_price;
}

export { costOf };
