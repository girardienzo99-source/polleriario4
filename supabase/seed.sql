-- ==============================================================================
-- POLLERÍA PRO — DATOS DE DEMOSTRACIÓN Y SEMILLAS REALES
-- Negocio: Pollería & Rotisería Los Campeones (Río Cuarto, Córdoba)
-- ==============================================================================

-- 1. NEGOCIO PRINCIPAL
INSERT INTO businesses (id, name, trade_name, cuit, iva_condition, address, city, province, postal_code, phone, whatsapp, email, primary_color)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Pollería & Rotisería Los Campeones S.R.L.',
  'Pollería Los Campeones',
  '30-71589412-8',
  'Responsable Inscripto',
  'Av. Marcelo T. de Alvear 840',
  'Río Cuarto',
  'Córdoba',
  '5800',
  '+54 358 464-8899',
  '+54 9 358 512-3456',
  'contacto@pollerialoscampeones.com.ar',
  '#ea580c'
) ON CONFLICT DO NOTHING;

-- 2. SUCURSAL
INSERT INTO branches (id, business_id, name, code, address, phone, is_main)
VALUES (
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Casa Central - Marcelo T. de Alvear',
  'SUC-01',
  'Av. Marcelo T. de Alvear 840, Río Cuarto',
  '+54 358 464-8899',
  TRUE
) ON CONFLICT DO NOTHING;

-- 3. PERFILES DE PRUEBA
INSERT INTO profiles (id, business_id, branch_id, full_name, email, phone, role, pin_code)
VALUES
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Enzo Garbarino (Administrador)', 'admin@polleria.com', '+54 358 500-1111', 'admin', '1234'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Martina Rossi (Encargada)', 'encargado@polleria.com', '+54 358 500-2222', 'encargado', '2222'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Lucas Gómez (Cajero)', 'cajero@polleria.com', '+54 358 500-3333', 'cajero', '3333'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Carlos Maidana (Cocinero Spiedo)', 'cocina@polleria.com', '+54 358 500-4444', 'cocinero', '4444'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Nicolás Pérez (Repartidor)', 'repartidor@polleria.com', '+54 358 500-5555', 'repartidor', '5555')
ON CONFLICT DO NOTHING;

-- 4. CATEGORÍAS
INSERT INTO categories (id, business_id, name, slug, description, icon, display_order)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Pollos Asados y al Spiedo', 'pollos-asados', 'Elaborados a fuego lento con receta tradicional de la casa', 'Flame', 1),
  ('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Pollo al Horno y Parrilla', 'horno-y-parrilla', 'Crocantes, jugosos y marinados con finas hierbas y limón', 'Beef', 2),
  ('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Milanesas y Supremas', 'milanesas', 'Gigantes, tiernas y doradas a punto con papas fritas', 'UtensilsCrossed', 3),
  ('44444444-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Papas Fritas y Guarniciones', 'guarniciones', 'Papas rústicas, cheddar, ensaladas frescas y puré casero', 'Salad', 4),
  ('55555555-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Empanadas y Tartas', 'empanadas', 'Masa casera y relleno abundante de pollo cortado a cuchillo', 'PieChart', 5),
  ('66666666-6666-6666-6666-666666666666', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Bebidas Frías', 'bebidas', 'Gaseosas de primera línea, cervezas artesanales y aguas', 'CupSoda', 6),
  ('77777777-7777-7777-7777-777777777777', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Combos y Promociones', 'combos', 'Las mejores combinaciones familiares al precio más conveniente', 'Sparkles', 7)
ON CONFLICT DO NOTHING;

-- 5. ZONAS DE DELIVERY
INSERT INTO delivery_zones (id, business_id, name, price, estimated_minutes, description)
VALUES
  ('a0a0a0a0-0001-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Zona 1 - Centro y Microcentro', 1200.00, 25, 'Radio céntrico de Río Cuarto'),
  ('a0a0a0a0-0002-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Zona 2 - Banda Norte y Alberdi', 1800.00, 35, 'Banda Norte, Macrocentro y Alberdi'),
  ('a0a0a0a0-0003-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Zona 3 - Las Higueras y Barrios Quintas', 2500.00, 45, 'Las Higueras, Soles del Oeste y periferia')
ON CONFLICT DO NOTHING;

-- 6. CONFIGURACIÓN FISCAL ARCA
INSERT INTO fiscal_settings (business_id, cuit, legal_name, fantasy_name, fiscal_address, iva_condition, point_of_sale, start_activity_date, environment)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '30715894128',
  'Pollería & Rotisería Los Campeones S.R.L.',
  'Pollería Los Campeones',
  'Av. Marcelo T. de Alvear 840, Río Cuarto, Córdoba',
  'Responsable Inscripto',
  1,
  '2020-03-01',
  'homologacion'
) ON CONFLICT DO NOTHING;
