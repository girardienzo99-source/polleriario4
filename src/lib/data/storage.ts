'use client';

import { 
  Product, 
  Category, 
  Ingredient, 
  Recipe, 
  Order, 
  OrderStatus,
  ProductionBatch, 
  CashSession, 
  CashMovement,
  Customer, 
  Supplier, 
  Expense, 
  Sale, 
  DeliveryZone,
  Promotion,
  FiscalSettings,
  FiscalDocument
} from '@/types/database';

import { 
  INITIAL_BUSINESS,
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
  INITIAL_FISCAL_SETTINGS
} from './mock-data';

const STORAGE_KEYS = {
  PRODUCTS: 'polleria_products',
  CATEGORIES: 'polleria_categories',
  INGREDIENTS: 'polleria_ingredients',
  RECIPES: 'polleria_recipes',
  ORDERS: 'polleria_orders',
  BATCHES: 'polleria_batches',
  CASH_SESSION: 'polleria_cash_session',
  CASH_MOVEMENTS: 'polleria_cash_movements',
  CUSTOMERS: 'polleria_customers',
  SUPPLIERS: 'polleria_suppliers',
  EXPENSES: 'polleria_expenses',
  SALES: 'polleria_sales',
  DELIVERY_ZONES: 'polleria_delivery_zones',
  PROMOTIONS: 'polleria_promotions',
  FISCAL_SETTINGS: 'polleria_fiscal_settings',
  FISCAL_DOCS: 'polleria_fiscal_docs',
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('polleria_store_updated'));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const PolleriaStore = {
  // Reset all to demo initial state
  resetToDemo(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INGREDIENTS);
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.CASH_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.DELIVERY_ZONES);
    localStorage.removeItem(STORAGE_KEYS.PROMOTIONS);
    localStorage.removeItem(STORAGE_KEYS.FISCAL_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.FISCAL_DOCS);
    window.dispatchEvent(new Event('polleria_store_updated'));
  },

  // Categories
  getCategories(): Category[] {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategory(category: Category): void {
    const list = this.getCategories();
    const index = list.findIndex(c => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push(category);
    }
    setItem(STORAGE_KEYS.CATEGORIES, list);
  },

  // Products
  getProducts(): Product[] {
    return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  saveProduct(product: Product): void {
    const list = this.getProducts();
    const index = list.findIndex(p => p.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.unshift(product);
    }
    setItem(STORAGE_KEYS.PRODUCTS, list);
  },
  deleteProduct(productId: string): void {
    const list = this.getProducts().map(p => {
      if (p.id === productId) {
        return { ...p, active: false };
      }
      return p;
    });
    setItem(STORAGE_KEYS.PRODUCTS, list);
  },

  // Ingredients & Stock
  getIngredients(): Ingredient[] {
    return getItem<Ingredient[]>(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS);
  },
  saveIngredient(ingredient: Ingredient): void {
    const list = this.getIngredients();
    const index = list.findIndex(i => i.id === ingredient.id);
    if (index >= 0) {
      list[index] = ingredient;
    } else {
      list.unshift(ingredient);
    }
    setItem(STORAGE_KEYS.INGREDIENTS, list);
  },
  adjustIngredientStock(ingredientId: string, deltaQuantity: number, reason: string): void {
    const list = this.getIngredients().map(ing => {
      if (ing.id === ingredientId) {
        const newStock = Math.max(0, ing.current_stock + deltaQuantity);
        return { ...ing, current_stock: Number(newStock.toFixed(3)) };
      }
      return ing;
    });
    setItem(STORAGE_KEYS.INGREDIENTS, list);
  },

  // Recipes
  getRecipes(): Recipe[] {
    return getItem<Recipe[]>(STORAGE_KEYS.RECIPES, INITIAL_RECIPES);
  },
  saveRecipe(recipe: Recipe): void {
    const list = this.getRecipes();
    const index = list.findIndex(r => r.id === recipe.id);
    if (index >= 0) {
      list[index] = recipe;
    } else {
      list.push(recipe);
    }
    setItem(STORAGE_KEYS.RECIPES, list);
  },

  // Orders
  getOrders(): Order[] {
    return getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  createOrder(order: Order): Order {
    const list = this.getOrders();
    const newOrder = {
      ...order,
      id: order.id || `ord-${Date.now()}`,
      order_number: order.order_number || `#POL-${1000 + list.length + 1}`,
      created_at: order.created_at || new Date().toISOString(),
    };
    list.unshift(newOrder);
    setItem(STORAGE_KEYS.ORDERS, list);

    // Consume stock or reserve if applicable
    newOrder.items.forEach(item => {
      if (item.product_id) {
        this.consumeRecipeForProduct(item.product_id, item.quantity);
      }
    });

    return newOrder;
  },
  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    const list = this.getOrders().map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status: newStatus, updated_at: new Date().toISOString() };
      }
      return ord;
    });
    setItem(STORAGE_KEYS.ORDERS, list);
  },
  updateOrderPayment(orderId: string, paymentStatus: 'pagado' | 'parcial' | 'rechazado' | 'pendiente'): void {
    const list = this.getOrders().map(ord => {
      if (ord.id === orderId) {
        return { ...ord, payment_status: paymentStatus, updated_at: new Date().toISOString() };
      }
      return ord;
    });
    setItem(STORAGE_KEYS.ORDERS, list);
  },

  // Automatic recipe consumption for cooked product
  consumeRecipeForProduct(productId: string, quantity: number): void {
    const recipes = this.getRecipes();
    const recipe = recipes.find(r => r.product_id === productId);
    if (!recipe) return;

    recipe.items.forEach(item => {
      const consumedQty = item.quantity * quantity * (1 + (item.waste_percentage || 0) / 100);
      this.adjustIngredientStock(item.ingredient_id, -consumedQty, `Consumo receta: ${recipe.name}`);
    });
  },

  // Production Batches (Tandas de spiedo)
  getBatches(): ProductionBatch[] {
    return getItem<ProductionBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_PRODUCTION_BATCHES);
  },
  saveBatch(batch: ProductionBatch): void {
    const list = this.getBatches();
    const index = list.findIndex(b => b.id === batch.id);
    if (index >= 0) {
      list[index] = batch;
    } else {
      list.unshift(batch);
      // Descontar pollos crudos del inventario de insumos
      this.adjustIngredientStock('ing-pollo-crudo', -batch.raw_chicken_quantity, `Tanda iniciada: ${batch.batch_number}`);
    }
    setItem(STORAGE_KEYS.BATCHES, list);
  },
  markBatchReady(batchId: string, cookedQuantity: number, wasteQuantity: number = 0): void {
    const list = this.getBatches().map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          status: 'listo' as const,
          cooked_quantity: cookedQuantity,
          waste_quantity: wasteQuantity,
          leftover_quantity: cookedQuantity - b.sold_quantity,
          actual_end_time: new Date().toISOString(),
        };
      }
      return b;
    });
    setItem(STORAGE_KEYS.BATCHES, list);

    // Incrementar stock terminado de pollo al spiedo
    const products = this.getProducts().map(p => {
      if (p.id === 'prod-spiedo-entero') {
        return { ...p, current_stock: p.current_stock + cookedQuantity };
      }
      return p;
    });
    setItem(STORAGE_KEYS.PRODUCTS, products);
  },

  // Cash Session & Movements
  getCashSession(): CashSession {
    return getItem<CashSession>(STORAGE_KEYS.CASH_SESSION, INITIAL_CASH_SESSION);
  },
  saveCashSession(session: CashSession): void {
    setItem(STORAGE_KEYS.CASH_SESSION, session);
  },
  openCashSession(userName: string, initialCash: number): CashSession {
    const session: CashSession = {
      id: `session-${Date.now()}`,
      cash_register_id: 'reg-01',
      user_name: userName,
      opened_at: new Date().toISOString(),
      initial_cash: initialCash,
      expected_cash: initialCash,
      total_sales_cash: 0,
      total_sales_digital: 0,
      total_expenses: 0,
      total_withdrawals: 0,
      status: 'abierta',
      notes: 'Sesión de caja abierta.',
    };
    this.saveCashSession(session);
    return session;
  },
  closeCashSession(actualCash: number, notes?: string): CashSession {
    const current = this.getCashSession();
    const difference = actualCash - current.expected_cash;
    const closed: CashSession = {
      ...current,
      closed_at: new Date().toISOString(),
      actual_cash: actualCash,
      difference: difference,
      status: 'cerrada',
      notes: notes || current.notes,
    };
    this.saveCashSession(closed);
    return closed;
  },
  recordCashMovement(movement: Omit<CashMovement, 'id' | 'created_at'>): void {
    const movements = getItem<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
    const newMovement: CashMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    movements.unshift(newMovement);
    setItem(STORAGE_KEYS.CASH_MOVEMENTS, movements);

    // Update current cash session expected totals
    const session = this.getCashSession();
    if (session.status === 'abierta') {
      if (movement.movement_type === 'venta' && movement.payment_method === 'efectivo') {
        session.total_sales_cash += movement.amount;
        session.expected_cash += movement.amount;
      } else if (movement.movement_type === 'venta') {
        session.total_sales_digital += movement.amount;
      } else if (movement.movement_type === 'ingreso_manual') {
        session.expected_cash += movement.amount;
      } else if (movement.movement_type === 'retiro') {
        session.total_withdrawals += movement.amount;
        session.expected_cash -= movement.amount;
      } else if (movement.movement_type === 'gasto') {
        session.total_expenses += movement.amount;
        if (movement.payment_method === 'efectivo') {
          session.expected_cash -= movement.amount;
        }
      }
      this.saveCashSession(session);
    }
  },
  getCashMovements(): CashMovement[] {
    return getItem<CashMovement[]>(STORAGE_KEYS.CASH_MOVEMENTS, []);
  },

  // Sales & POS
  getSales(): Sale[] {
    return getItem<Sale[]>(STORAGE_KEYS.SALES, []);
  },
  recordSale(sale: Sale): Sale {
    const list = this.getSales();
    const newSale = {
      ...sale,
      id: sale.id || `sale-${Date.now()}`,
      sale_number: sale.sale_number || `#VTA-${1000 + list.length + 1}`,
      created_at: sale.created_at || new Date().toISOString(),
    };
    list.unshift(newSale);
    setItem(STORAGE_KEYS.SALES, list);

    // Impact cash session
    this.recordCashMovement({
      cash_session_id: newSale.cash_session_id || this.getCashSession().id,
      movement_type: 'venta',
      amount: newSale.total,
      payment_method: newSale.payment_method,
      concept: `Venta POS ${newSale.sale_number}`,
    });

    return newSale;
  },

  // Customers
  getCustomers(): Customer[] {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomer(customer: Customer): Customer {
    const list = this.getCustomers();
    const index = list.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      list[index] = customer;
      setItem(STORAGE_KEYS.CUSTOMERS, list);
      return customer;
    } else {
      const newCust = { ...customer, id: customer.id || `cust-${Date.now()}` };
      list.unshift(newCust);
      setItem(STORAGE_KEYS.CUSTOMERS, list);
      return newCust;
    }
  },

  // Suppliers & Purchases
  getSuppliers(): Supplier[] {
    return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },
  saveSupplier(supplier: Supplier): void {
    const list = this.getSuppliers();
    const index = list.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      list[index] = supplier;
    } else {
      list.unshift(supplier);
    }
    setItem(STORAGE_KEYS.SUPPLIERS, list);
  },

  // Expenses
  getExpenses(): Expense[] {
    return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },
  saveExpense(expense: Expense): void {
    const list = this.getExpenses();
    const newExp = { ...expense, id: expense.id || `exp-${Date.now()}` };
    list.unshift(newExp);
    setItem(STORAGE_KEYS.EXPENSES, list);

    this.recordCashMovement({
      cash_session_id: this.getCashSession().id,
      movement_type: 'gasto',
      amount: newExp.amount,
      payment_method: newExp.payment_method,
      concept: `Gasto: ${newExp.concept}`,
    });
  },

  // Delivery Zones
  getDeliveryZones(): DeliveryZone[] {
    return getItem<DeliveryZone[]>(STORAGE_KEYS.DELIVERY_ZONES, INITIAL_DELIVERY_ZONES);
  },
  saveDeliveryZone(zone: DeliveryZone): void {
    const list = this.getDeliveryZones();
    const idx = list.findIndex(z => z.id === zone.id);
    if (idx >= 0) {
      list[idx] = zone;
    } else {
      list.push(zone);
    }
    setItem(STORAGE_KEYS.DELIVERY_ZONES, list);
  },

  // Promotions
  getPromotions(): Promotion[] {
    return getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, INITIAL_PROMOTIONS);
  },
  savePromotion(promo: Promotion): void {
    const list = this.getPromotions();
    const idx = list.findIndex(p => p.id === promo.id);
    if (idx >= 0) {
      list[idx] = promo;
    } else {
      list.unshift(promo);
    }
    setItem(STORAGE_KEYS.PROMOTIONS, list);
  },

  // Fiscal Settings & Documents
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
    const list = this.getFiscalDocuments();
    list.unshift(doc);
    setItem(STORAGE_KEYS.FISCAL_DOCS, list);
  }
};
