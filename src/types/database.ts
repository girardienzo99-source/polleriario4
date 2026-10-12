export type UserRole = 'admin' | 'encargado' | 'cajero' | 'cocinero' | 'repartidor';

export type ProductType = 'simple' | 'elaborado' | 'por_peso' | 'combo' | 'variante';

export type OrderStatus = 'recibido' | 'confirmado' | 'en_preparacion' | 'listo' | 'en_reparto' | 'entregado' | 'cancelado';

export type OrderChannel = 'landing' | 'mostrador' | 'whatsapp' | 'telefono' | 'interno';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercadopago' | 'mixto';

export type PaymentStatus = 'pendiente' | 'pagado' | 'parcial' | 'rechazado';

export type BatchStatus = 'en_horno' | 'listo' | 'agotado' | 'cancelado';

export interface Business {
  id: string;
  name: string;
  trade_name: string;
  cuit: string;
  iva_condition: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  whatsapp: string;
  email: string;
  logo_url?: string;
  primary_color: string;
  currency: string;
  active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  is_main: boolean;
  active: boolean;
}

export interface Profile {
  id: string;
  business_id: string;
  branch_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  pin_code?: string;
  active: boolean;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price_adjustment: number;
  final_price: number;
  is_default: boolean;
  active: boolean;
  /** Unidades de stock base que consume la variante (ej. medio pollo = 0.5). Default 1. */
  stock_units?: number;
}

export interface Product {
  id: string;
  business_id: string;
  category_id?: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  image_url: string;
  sale_price: number;
  cost_price: number;
  estimated_margin?: number;
  unit_measure: string;
  product_type: ProductType;
  vat_rate: number;
  is_available: boolean;
  is_visible_landing: boolean;
  is_featured: boolean;
  min_stock: number;
  current_stock: number;
  active: boolean;
  variants?: ProductVariant[];
  /**
   * Cómo impacta una venta en el inventario:
   * - batch: se produce por tandas (spiedo). La venta sólo descuenta stock terminado;
   *   los insumos se descuentan al iniciar la tanda.
   * - recipe_on_sale: se elabora al momento; la venta consume la receta.
   * - simple: producto de reventa; la venta descuenta su propio stock.
   * - none: no controla stock.
   */
  stock_mode?: StockMode;
  /** Componentes de un combo; la venta descuenta stock de cada componente. */
  combo_items?: { product_id: string; variant_id?: string; quantity: number }[];
  created_at?: string;
}

export type StockMode = 'batch' | 'recipe_on_sale' | 'simple' | 'none';

export interface InventoryMovement {
  id: string;
  item_kind: 'ingredient' | 'product';
  item_id: string;
  item_name: string;
  delta: number;
  stock_after: number;
  reason: string;
  reference?: string;
  user_name: string;
  created_at: string;
}

export interface Ingredient {
  id: string;
  business_id: string;
  name: string;
  sku?: string;
  unit_measure: string;
  current_stock: number;
  min_stock: number;
  cost_price: number;
  is_alert_active: boolean;
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  quantity: number;
  unit_measure: string;
  waste_percentage: number;
}

export interface Recipe {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  instructions?: string;
  yield_quantity: number;
  items: RecipeItem[];
}

export interface ProductionBatch {
  id: string;
  branch_id: string;
  batch_number: string;
  /** Producto terminado que genera la tanda (default: pollo al spiedo). */
  product_id?: string;
  start_time: string;
  estimated_end_time?: string;
  actual_end_time?: string;
  raw_chicken_quantity: number;
  cooked_quantity: number;
  sold_quantity: number;
  leftover_quantity: number;
  waste_quantity: number;
  status: BatchStatus;
  operator_name?: string;
  notes?: string;
  created_at: string;
}

export interface DeliveryZone {
  id: string;
  business_id: string;
  name: string;
  price: number;
  estimated_minutes: number;
  description?: string;
  active: boolean;
}

export interface Promotion {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  promo_type: 'combo' | 'porcentaje' | 'monto_fijo' | 'dia_semana';
  discount_value: number;
  promotional_price: number;
  start_date?: string;
  end_date?: string;
  active_days: number[];
  active_channels: string[];
  image_url?: string;
  /** Producto real que se agrega al carrito al pedir la promo (combos). */
  product_id?: string;
  /** Cupón que aplica la promo en el carrito (promos porcentuales). */
  coupon_code?: string;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  business_id: string;
  branch_id?: string;
  order_number: string;
  channel: OrderChannel;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  delivery_type: 'retiro' | 'delivery';
  delivery_zone_id?: string;
  delivery_zone_name?: string;
  delivery_fee: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  total: number;
  requested_time?: string;
  estimated_time?: string;
  notes?: string;
  items: OrderItem[];
  /** Deltas de inventario aplicados al crear el pedido (se revierten al cancelar). */
  stock_deltas?: StockDeltaRecord[];
  cancel_reason?: string;
  /** Venta generada al cobrar el pedido. */
  sale_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface StockDeltaRecord {
  kind: 'product' | 'ingredient';
  id: string;
  delta: number;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  delivery_notes?: string;
  doc_type?: string;
  doc_number?: string;
  iva_condition?: string;
  total_orders: number;
  total_spent: number;
  notes?: string;
  created_at: string;
}

export interface CashSession {
  id: string;
  cash_register_id: string;
  user_id?: string;
  user_name: string;
  opened_at: string;
  closed_at?: string;
  initial_cash: number;
  expected_cash: number;
  actual_cash?: number;
  difference?: number;
  total_sales_cash: number;
  total_sales_digital: number;
  total_expenses: number;
  total_withdrawals: number;
  status: 'abierta' | 'cerrada';
  notes?: string;
}

export interface CashMovement {
  id: string;
  cash_session_id: string;
  movement_type: 'ingreso_manual' | 'retiro' | 'gasto' | 'venta' | 'devolucion';
  amount: number;
  payment_method: string;
  concept: string;
  user_id?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  variant_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  cost_price: number;
}

export interface Sale {
  id: string;
  business_id: string;
  branch_id?: string;
  sale_number: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  cash_session_id?: string;
  channel: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  fiscal_status: 'no_fiscal' | 'simulado' | 'pendiente' | 'autorizado' | 'rechazado';
  fiscal_doc_id?: string;
  items: SaleItem[];
  stock_deltas?: StockDeltaRecord[];
  user_name?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  trade_name?: string;
  cuit?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  business_id: string;
  supplier_id?: string;
  supplier_name?: string;
  invoice_number?: string;
  invoice_date: string;
  total: number;
  status: 'borrador' | 'recibida' | 'cancelada';
  payment_status: 'pendiente' | 'pagada';
  received_at?: string;
  items: PurchaseItem[];
  created_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  branch_id?: string;
  cash_session_id?: string;
  category: string;
  concept: string;
  amount: number;
  payment_method: string;
  receipt_number?: string;
  expense_date: string;
  created_at: string;
}

export interface FiscalSettings {
  id: string;
  business_id: string;
  cuit: string;
  legal_name: string;
  fantasy_name?: string;
  fiscal_address: string;
  iva_condition: string;
  point_of_sale: number;
  start_activity_date: string;
  environment: 'homologacion' | 'produccion';
  cert_crt?: string;
  cert_key?: string;
  token?: string;
  sign?: string;
  token_expiration?: string;
  is_active: boolean;
}

export interface FiscalDocument {
  id: string;
  business_id: string;
  sale_id?: string;
  voucher_type: number; // 1: Fac A, 6: Fac B, 11: Fac C
  point_of_sale: number;
  voucher_number: number;
  doc_type_receiver: number; // 80: CUIT, 96: DNI, 99: Final
  doc_number_receiver: string;
  receiver_name: string;
  receiver_iva_condition: string;
  net_amount: number;
  vat_amount: number;
  exempt_amount: number;
  total_amount: number;
  cae?: string;
  cae_expiration?: string;
  qr_data?: string;
  qr_url?: string;
  /** 'simulado' = generado localmente, SIN validez fiscal (no hubo respuesta de ARCA). */
  afip_status: 'simulado' | 'autorizado' | 'rechazado' | 'pendiente';
  afip_response?: any;
  created_at: string;
}
