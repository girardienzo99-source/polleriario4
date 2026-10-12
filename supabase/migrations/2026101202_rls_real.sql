-- ==============================================================================
-- POLLERÍA PRO — POLÍTICAS DE SEGURIDAD RLS REALES (MULTI-TENANT & ROLES)
-- Diseñado por Río Cuarto Web
-- ==============================================================================
-- Esta migración reemplaza los placeholders 'USING (true)' por políticas
-- reales basadas en Supabase Auth (auth.uid()), perfil del usuario,
-- pertenencia a la empresa (business_id) y matriz de roles RBAC.
-- ==============================================================================

-- 1. ELIMINAR POLÍTICAS INSEGURAS DE LA MIGRACIÓN INICIAL
DROP POLICY IF EXISTS "Business Users Full Access" ON products;
DROP POLICY IF EXISTS "Business Users Full Access Orders" ON orders;
DROP POLICY IF EXISTS "Business Users Full Access Sales" ON sales;
DROP POLICY IF EXISTS "Business Users Full Access Cash" ON cash_sessions;

-- 2. FUNCIONES DE AYUDA DE SEGURIDAD (SECURITY DEFINER)
-- Retornan el negocio y rol del usuario actual autenticado en auth.users
CREATE OR REPLACE FUNCTION current_user_business_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid() AND active = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND active = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_role(VARIADIC allowed_roles text[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND active = TRUE
      AND role = ANY(allowed_roles)
  );
$$;

-- 3. PERFILES (PROFILES)
-- Los usuarios pueden leer perfiles de su propia empresa; sólo admin puede crear o modificar.
CREATE POLICY "Profiles read same business"
  ON profiles FOR SELECT
  USING (business_id = current_user_business_id());

CREATE POLICY "Profiles admin manage"
  ON profiles FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin'));

-- 4. PRODUCTOS Y CATEGORÍAS (CATÁLOGO)
-- Lectura: clientes en landing (ya cubierto por public read) + empleados del negocio
CREATE POLICY "Staff read products"
  ON products FOR SELECT
  USING (business_id = current_user_business_id());

CREATE POLICY "Staff manage products"
  ON products FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

CREATE POLICY "Staff manage categories"
  ON categories FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

-- 5. MATERIAS PRIMAS, RECETAS Y TANDAS DE COCCIÓN (COCINA Y STOCK)
-- Cocinero, encargado y admin pueden leer y operar tandas
CREATE POLICY "Kitchen read ingredients"
  ON ingredients FOR SELECT
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cocinero'));

CREATE POLICY "Stock manage ingredients"
  ON ingredients FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

CREATE POLICY "Kitchen read recipes"
  ON recipes FOR SELECT
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cocinero'));

CREATE POLICY "Kitchen manage recipes"
  ON recipes FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

CREATE POLICY "Kitchen read recipe_items"
  ON recipe_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_items.recipe_id
      AND r.business_id = current_user_business_id()
      AND has_role('admin', 'encargado', 'cocinero')
  ));

CREATE POLICY "Kitchen manage batches"
  ON production_batches FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cocinero'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cocinero'));

-- 6. PEDIDOS (ORDERS & ORDER_ITEMS)
-- El personal del negocio puede ver todos los pedidos
CREATE POLICY "Staff read orders"
  ON orders FOR SELECT
  USING (business_id = current_user_business_id());

CREATE POLICY "Staff read order items"
  ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND o.business_id = current_user_business_id()
  ));

-- Inserción de pedidos por staff (POS / Mostrador)
CREATE POLICY "Staff insert orders"
  ON orders FOR INSERT
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'));

-- Actualización según rol (KDS cocinero cambia a en_preparacion/listo; repartidor a en_reparto/entregado; cajero/admin a todo)
CREATE POLICY "Staff update orders"
  ON orders FOR UPDATE
  USING (
    business_id = current_user_business_id() AND (
      has_role('admin', 'encargado', 'cajero')
      OR (has_role('cocinero') AND status IN ('recibido', 'confirmado', 'en_preparacion', 'listo'))
      OR (has_role('repartidor') AND status IN ('listo', 'en_reparto', 'entregado'))
    )
  );

-- 7. CAJA REGISTRADORA Y MOVIMIENTOS
-- Acceso exclusivo para cajeros, encargados y administradores. Cocineros y repartidores bloqueados.
CREATE POLICY "Cash view sessions"
  ON cash_sessions FOR SELECT
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'));

CREATE POLICY "Cash manage sessions"
  ON cash_sessions FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'));

CREATE POLICY "Cash manage movements"
  ON cash_movements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM cash_sessions cs
    WHERE cs.id = cash_movements.cash_session_id
      AND cs.business_id = current_user_business_id()
      AND has_role('admin', 'encargado', 'cajero')
  ));

-- 8. VENTAS Y FACTURACIÓN FISCAL ARCA
CREATE POLICY "Sales staff access"
  ON sales FOR SELECT
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'));

CREATE POLICY "Sales staff insert"
  ON sales FOR INSERT
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'));

CREATE POLICY "Fiscal docs view"
  ON fiscal_documents FOR SELECT
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado', 'cajero'));

CREATE POLICY "Fiscal docs manage"
  ON fiscal_documents FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

CREATE POLICY "Fiscal settings manage"
  ON fiscal_settings FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin'));

-- 9. COMPRAS, PROVEEDORES Y GASTOS (OPERATIVO SENSIBLE)
-- Sólo administradores y encargados tienen acceso
CREATE POLICY "Expenses manage"
  ON expenses FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

CREATE POLICY "Purchases manage"
  ON purchases FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));

CREATE POLICY "Suppliers manage"
  ON suppliers FOR ALL
  USING (business_id = current_user_business_id() AND has_role('admin', 'encargado'))
  WITH CHECK (business_id = current_user_business_id() AND has_role('admin', 'encargado'));
