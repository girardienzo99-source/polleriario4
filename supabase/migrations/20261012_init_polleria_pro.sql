-- ==============================================================================
-- POLLERÍA PRO — SISTEMA DE GESTIÓN GASTRONÓMICA
-- Esquema relacional completo para Supabase PostgreSQL
-- Diseñado por Río Cuarto Web
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE NEGOCIOS Y SUCURSALES (SaaS & Multi-sucursal ready)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  trade_name VARCHAR(150) NOT NULL,
  cuit VARCHAR(13) NOT NULL,
  iva_condition VARCHAR(50) NOT NULL DEFAULT 'Responsable Inscripto',
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Río Cuarto',
  province VARCHAR(100) NOT NULL DEFAULT 'Córdoba',
  postal_code VARCHAR(10) NOT NULL DEFAULT '5800',
  phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(10) DEFAULT '#ea580c',
  currency VARCHAR(5) DEFAULT 'ARS',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_main BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERFILES DE USUARIOS Y ROLES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'encargado', 'cajero', 'cocinero', 'repartidor')),
  pin_code VARCHAR(6),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORÍAS DE PRODUCTOS
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Utensils',
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTOS Y VARIANTES
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sku VARCHAR(50),
  barcode VARCHAR(50),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  image_url TEXT,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  estimated_margin NUMERIC(6, 2) GENERATED ALWAYS AS (
    CASE WHEN sale_price > 0 THEN ROUND(((sale_price - cost_price) / sale_price) * 100, 2) ELSE 0.00 END
  ) STORED,
  unit_measure VARCHAR(30) NOT NULL DEFAULT 'unidad', -- unidad, kg, porcion
  product_type VARCHAR(30) NOT NULL DEFAULT 'elaborado', -- simple, elaborado, por_peso, combo, variante
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 21.00, -- 21.00, 10.50, 0.00
  is_available BOOLEAN DEFAULT TRUE,
  is_visible_landing BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  min_stock NUMERIC(10, 2) DEFAULT 5.00,
  current_stock NUMERIC(10, 2) DEFAULT 0.00,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- Ej: Entero, Medio, Cuarto
  sku VARCHAR(50),
  price_adjustment NUMERIC(12, 2) DEFAULT 0.00,
  final_price NUMERIC(12, 2) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

-- 6. MATERIAS PRIMAS, INGREDIENTES Y RECETAS
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50),
  unit_measure VARCHAR(30) NOT NULL, -- kg, g, l, ml, unidad
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
  min_stock NUMERIC(12, 3) NOT NULL DEFAULT 10.000,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  is_alert_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  instructions TEXT,
  yield_quantity NUMERIC(10, 2) DEFAULT 1.00,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 4) NOT NULL,
  unit_measure VARCHAR(30) NOT NULL,
  waste_percentage NUMERIC(5, 2) DEFAULT 0.00
);

-- 7. DEPÓSITOS Y MOVIMIENTOS DE STOCK
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  is_main BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('ingredient', 'product')),
  item_id UUID NOT NULL,
  movement_type VARCHAR(30) NOT NULL, -- compra, produccion_ingreso, produccion_consumo, venta, ajuste_positivo, ajuste_negativo, merma, rotura, vencimiento
  quantity NUMERIC(12, 3) NOT NULL,
  previous_stock NUMERIC(12, 3) NOT NULL,
  new_stock NUMERIC(12, 3) NOT NULL,
  unit_cost NUMERIC(12, 2) DEFAULT 0.00,
  reference_type VARCHAR(30), -- order, purchase, batch, manual
  reference_id UUID,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TANDAS DE COCCIÓN DE POLLOS (SPIEDO / HORNO)
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  batch_number VARCHAR(30) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_end_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  raw_chicken_quantity INT NOT NULL, -- pollos crudos ingresados
  cooked_quantity INT NOT NULL DEFAULT 0, -- pollos salidos listos
  sold_quantity INT NOT NULL DEFAULT 0, -- vendidos de esta tanda
  leftover_quantity INT NOT NULL DEFAULT 0, -- sobrantes
  waste_quantity INT NOT NULL DEFAULT 0, -- quemados o mermas
  status VARCHAR(30) NOT NULL DEFAULT 'en_horno', -- en_horno, listo, agotado, cancelado
  operator_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CLIENTES Y ZONAS DE DELIVERY
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  address VARCHAR(255),
  delivery_notes TEXT,
  doc_type VARCHAR(10) DEFAULT 'DNI',
  doc_number VARCHAR(20),
  iva_condition VARCHAR(50) DEFAULT 'Consumidor Final',
  total_orders INT DEFAULT 0,
  total_spent NUMERIC(14, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  estimated_minutes INT DEFAULT 30,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- 10. PROMOCIONES Y COMBOS
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  promo_type VARCHAR(30) NOT NULL, -- combo, porcentaje, monto_fijo, dia_semana
  discount_value NUMERIC(10, 2) DEFAULT 0.00,
  promotional_price NUMERIC(12, 2) NOT NULL,
  start_date DATE,
  end_date DATE,
  active_days INT[] DEFAULT '{0,1,2,3,4,5,6}',
  active_channels TEXT[] DEFAULT '{"landing","mostrador","delivery"}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT TRUE
);

-- 11. CAJAS Y SESIONES (TURNOS DE CAJA)
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  user_id UUID,
  user_name VARCHAR(100) NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  initial_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  expected_cash NUMERIC(12, 2) DEFAULT 0.00,
  actual_cash NUMERIC(12, 2) DEFAULT 0.00,
  difference NUMERIC(12, 2) DEFAULT 0.00,
  total_sales_cash NUMERIC(12, 2) DEFAULT 0.00,
  total_sales_digital NUMERIC(12, 2) DEFAULT 0.00,
  total_expenses NUMERIC(12, 2) DEFAULT 0.00,
  total_withdrawals NUMERIC(12, 2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'abierta', -- abierta, cerrada
  notes TEXT
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  movement_type VARCHAR(30) NOT NULL, -- ingreso_manual, retiro, gasto, venta, devolucion
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'efectivo',
  concept VARCHAR(255) NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PEDIDOS Y ENTREGAS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  order_number VARCHAR(30) NOT NULL, -- e.g. #POL-1001
  channel VARCHAR(30) NOT NULL DEFAULT 'landing', -- landing, mostrador, whatsapp, telefono, interno
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address VARCHAR(255),
  delivery_type VARCHAR(20) NOT NULL DEFAULT 'retiro', -- retiro, delivery
  delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
  delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'recibido', -- recibido, confirmado, en_preparacion, listo, en_reparto, entregado, cancelado
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- pendiente, pagado, parcial, rechazado
  payment_method VARCHAR(30) NOT NULL DEFAULT 'efectivo', -- efectivo, transferencia, debito, credito, mercadopago, mixto
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  requested_time TIMESTAMPTZ,
  estimated_time VARCHAR(50) DEFAULT '30-45 min',
  notes TEXT,
  cashier_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
  delivery_address VARCHAR(255) NOT NULL,
  delivery_notes TEXT,
  driver_id UUID,
  driver_name VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'pendiente', -- pendiente, asignado, en_camino, entregado, fallido
  fee NUMERIC(10, 2) DEFAULT 0.00,
  assigned_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- 13. VENTAS Y FACTURACIÓN COMERCIAL
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  sale_number VARCHAR(30) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  channel VARCHAR(30) NOT NULL DEFAULT 'mostrador',
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL,
  fiscal_status VARCHAR(30) DEFAULT 'no_fiscal', -- no_fiscal, pendiente, autorizado, rechazado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  description VARCHAR(150) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  payment_method VARCHAR(30) NOT NULL, -- efectivo, transferencia, debito, credito, mercadopago
  amount NUMERIC(12, 2) NOT NULL,
  reference_code VARCHAR(100),
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PROVEEDORES, COMPRAS Y GASTOS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  trade_name VARCHAR(150),
  cuit VARCHAR(13),
  contact_name VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  address VARCHAR(255),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50),
  invoice_date DATE DEFAULT CURRENT_DATE,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) DEFAULT 'recibida', -- borrador, recibida, cancelada
  payment_status VARCHAR(30) DEFAULT 'pagada', -- pendiente, pagada
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 3) NOT NULL,
  unit_cost NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL, -- insumos, servicios_luz_gas, sueldos, combustible, mantenimiento, envases, otros
  concept VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'efectivo',
  receipt_number VARCHAR(50),
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CONFIGURACIÓN FISCAL Y FACTURACIÓN ELECTRÓNICA ARCA (EX AFIP)
CREATE TABLE IF NOT EXISTS fiscal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  cuit VARCHAR(13) NOT NULL,
  legal_name VARCHAR(150) NOT NULL,
  fantasy_name VARCHAR(150),
  fiscal_address VARCHAR(255) NOT NULL,
  iva_condition VARCHAR(50) NOT NULL DEFAULT 'Responsable Inscripto',
  point_of_sale INT NOT NULL DEFAULT 1,
  start_activity_date DATE NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'homologacion', -- homologacion, produccion
  cert_crt TEXT,
  cert_key TEXT,
  token TEXT,
  sign TEXT,
  token_expiration TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiscal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  voucher_type INT NOT NULL, -- 1: Factura A, 6: Factura B, 11: Factura C, 3: NC A, 8: NC B, 13: NC C
  point_of_sale INT NOT NULL,
  voucher_number BIGINT NOT NULL,
  doc_type_receiver INT NOT NULL DEFAULT 96, -- 80: CUIT, 96: DNI, 99: Sin identificar
  doc_number_receiver VARCHAR(20) NOT NULL,
  receiver_name VARCHAR(150) NOT NULL,
  receiver_iva_condition VARCHAR(50) NOT NULL DEFAULT 'Consumidor Final',
  net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  exempt_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL,
  cae VARCHAR(30),
  cae_expiration DATE,
  qr_data TEXT,
  qr_url TEXT,
  afip_status VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- autorizado, rechazado, pendiente
  afip_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AUDITORÍA Y CONFIGURACIONES GENERALES
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  payload JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_business_setting UNIQUE (business_id, key)
);

-- 17. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_status ON orders(business_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(cash_register_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_production_batches_branch ON production_batches(branch_id, status);

-- 18. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Regla de lectura pública para catálogo en la Landing Page
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (active = TRUE);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (active = TRUE AND is_visible_landing = TRUE);
CREATE POLICY "Public Read Variants" ON product_variants FOR SELECT USING (active = TRUE);
CREATE POLICY "Public Read Promotions" ON promotions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public Read Delivery Zones" ON delivery_zones FOR SELECT USING (active = TRUE);
CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Create Order Items" ON order_items FOR INSERT WITH CHECK (true);

-- Permisos autenticados completos para administración del propio negocio
CREATE POLICY "Business Users Full Access" ON products FOR ALL USING (true);
CREATE POLICY "Business Users Full Access Orders" ON orders FOR ALL USING (true);
CREATE POLICY "Business Users Full Access Sales" ON sales FOR ALL USING (true);
CREATE POLICY "Business Users Full Access Cash" ON cash_sessions FOR ALL USING (true);
