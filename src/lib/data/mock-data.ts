/**
 * Datos iniciales de DEMOSTRACIÓN (catálogo, insumos y algunos pedidos de ejemplo).
 * Se cargan sólo la primera vez en el almacenamiento local del navegador y pueden
 * borrarse desde Configuración → "Empezar de cero". No representan operaciones reales.
 *
 * Imágenes: fotografías reales de Wikimedia Commons con licencia libre,
 * descargadas a /public/images. Autoría y licencia en src/lib/data/image-credits.json
 * (visibles públicamente en /creditos).
 */
import {
  Business,
  Category,
  Product,
  Ingredient,
  Recipe,
  DeliveryZone,
  Promotion,
  Order,
  ProductionBatch,
  CashSession,
  Customer,
  Supplier,
  Expense,
  FiscalSettings
} from '@/types/database';

export const INITIAL_BUSINESS: Business = {
  id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  name: 'Pollería & Rotisería Los Campeones S.R.L.',
  trade_name: 'Pollería Los Campeones',
  cuit: '30-71589412-9',
  iva_condition: 'Responsable Inscripto',
  address: 'Av. Marcelo T. de Alvear 840',
  city: 'Río Cuarto',
  province: 'Córdoba',
  postal_code: '5800',
  phone: '+54 358 464-8899',
  whatsapp: '+54 9 358 512-3456',
  email: 'contacto@pollerialoscampeones.com.ar',
  logo_url: '/logo-polleria.png',
  primary_color: '#ea580c',
  currency: 'ARS',
  active: true,
  created_at: '2020-03-01T00:00:00Z',
};

const B = INITIAL_BUSINESS.id;

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-spiedo', business_id: B, name: 'Pollos a la Brasa', slug: 'pollos-a-la-brasa', description: 'Pollos al estilo argentino asados despacio sobre brasas de quebracho y anchico, dorados y crocantes.', icon: 'Flame', display_order: 1, active: true },
  { id: 'cat-horno-parrilla', business_id: B, name: 'Especialidades a la Leña', slug: 'especialidades-lena', description: 'Pollo al limón, chimichurri criollo a la brasa y pollo al horno con papas.', icon: 'Beef', display_order: 2, active: true },
  { id: 'cat-milanesas', business_id: B, name: 'Milanesas y Hamburguesas', slug: 'milanesas', description: 'Milanesas de pechuga y hamburguesas de pollo a la plancha.', icon: 'UtensilsCrossed', display_order: 3, active: true },
  { id: 'cat-guarniciones', business_id: B, name: 'Papas y Guarniciones', slug: 'guarniciones', description: 'Papas fritas caseras y ensaladas.', icon: 'Salad', display_order: 4, active: true },
  { id: 'cat-empanadas', business_id: B, name: 'Empanadas', slug: 'empanadas', description: 'Empanadas de pollo horneadas.', icon: 'PieChart', display_order: 5, active: true },
  { id: 'cat-bebidas', business_id: B, name: 'Bebidas', slug: 'bebidas', description: 'Gaseosas y cervezas bien frías.', icon: 'CupSoda', display_order: 6, active: true },
  { id: 'cat-combos', business_id: B, name: 'Combos a la Brasa', slug: 'combos', description: 'Combinaciones familiares con guarniciones y bebida.', icon: 'Sparkles', display_order: 7, active: true },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-spiedo-entero', business_id: B, category_id: 'cat-spiedo', sku: 'POL-BRASA-01', barcode: '779123400001',
    name: 'Pollo a la Brasa (Estilo Argentino)',
    description: 'Pollo entero abierto al estilo argentino, asado despacio sobre brasas de leña de anchico y quebracho. Piel bien dorada y crocante, carne jugosa con adobo criollo de la casa y limón.',
    image_url: '/images/pollo-brasa-entero.jpg',
    sale_price: 14500, cost_price: 7800, unit_measure: 'unidad', product_type: 'variante', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 4, current_stock: 6, active: true,
    stock_mode: 'batch',
    variants: [
      { id: 'var-entero', product_id: 'prod-spiedo-entero', name: 'Entero', price_adjustment: 0, final_price: 14500, is_default: true, active: true, stock_units: 1 },
      { id: 'var-medio', product_id: 'prod-spiedo-entero', name: 'Medio pollo', price_adjustment: -6600, final_price: 7900, is_default: false, active: true, stock_units: 0.5 },
      { id: 'var-cuarto', product_id: 'prod-spiedo-entero', name: 'Cuarto de pollo', price_adjustment: -9600, final_price: 4900, is_default: false, active: true, stock_units: 0.25 },
    ],
  },
  {
    id: 'prod-horno-papas', business_id: B, category_id: 'cat-horno-parrilla', sku: 'POL-LIMON-02',
    name: 'Pollo al Limón a la Brasa',
    description: 'Pollo marinado con jugo de limón fresco, ajo y finas hierbas aromáticas, asado lentamente sobre brasas de quebracho.',
    image_url: '/images/pollo-limon-brasa.jpg',
    sale_price: 15500, cost_price: 8400, unit_measure: 'unidad', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 3, current_stock: 8, active: true,
    stock_mode: 'batch',
  },
  {
    id: 'prod-parrilla', business_id: B, category_id: 'cat-horno-parrilla', sku: 'POL-CHIMI-03',
    name: 'Pollo a la Brasa con Chimichurri Criollo',
    description: 'El clásico asado criollo: pollo abierto asado a las brasas de leña, bañado en chimichurri casero tradicional.',
    image_url: '/images/pollo-chimichurri.jpg',
    sale_price: 15200, cost_price: 8100, unit_measure: 'unidad', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 2, current_stock: 5, active: true,
    stock_mode: 'batch',
  },
  {
    id: 'prod-mila-napo', business_id: B, category_id: 'cat-milanesas', sku: 'MIL-NAPO-01',
    name: 'Milanesa Napolitana con Fritas',
    description: 'Milanesa de pechuga con salsa de tomate, jamón cocido y muzzarella gratinada. Con papas fritas.',
    image_url: '/images/milanesa-napolitana.jpg',
    sale_price: 11500, cost_price: 5200, unit_measure: 'porción', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 0, current_stock: 0, active: true,
    stock_mode: 'recipe_on_sale',
  },
  {
    id: 'prod-mila-pollo', business_id: B, category_id: 'cat-milanesas', sku: 'MIL-CLAS-02',
    name: 'Milanesa de Pollo con Fritas',
    description: 'Milanesa de pechuga rebozada en pan rallado, con limón y papas fritas.',
    image_url: '/images/milanesa-pollo.jpg',
    sale_price: 9200, cost_price: 4300, unit_measure: 'porción', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 0, current_stock: 0, active: true,
    stock_mode: 'recipe_on_sale',
  },
  {
    id: 'prod-hamburguesa-pollo', business_id: B, category_id: 'cat-milanesas', sku: 'HAM-POL-01',
    name: 'Hamburguesa de Pollo Grillada',
    description: 'Pechuga grillada en pan de papa, con lechuga, tomate y mayonesa casera.',
    image_url: '/images/hamburguesa-pollo.jpg',
    sale_price: 8900, cost_price: 3900, unit_measure: 'unidad', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 0, current_stock: 0, active: true,
    stock_mode: 'recipe_on_sale',
  },
  {
    id: 'prod-fritas-grandes', business_id: B, category_id: 'cat-guarniciones', sku: 'PAP-CLAS-01',
    name: 'Papas Fritas Caseras',
    description: 'Corte bastón, peladas en el día y fritas al momento. Porción para compartir.',
    image_url: '/images/papas-fritas.jpg',
    sale_price: 4500, cost_price: 1600, unit_measure: 'porción', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 0, current_stock: 0, active: true,
    stock_mode: 'recipe_on_sale',
  },
  {
    id: 'prod-fritas-cheddar', business_id: B, category_id: 'cat-guarniciones', sku: 'PAP-CHED-02',
    name: 'Papas Fritas con Cheddar',
    description: 'Papas fritas bañadas en salsa de queso cheddar fundido.',
    image_url: '/images/papas-cheddar.jpg',
    sale_price: 6200, cost_price: 2400, unit_measure: 'porción', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 0, current_stock: 0, active: true,
    stock_mode: 'recipe_on_sale',
  },
  {
    id: 'prod-ensalada-rusa', business_id: B, category_id: 'cat-guarniciones', sku: 'ENS-RUSA-01',
    name: 'Ensalada Rusa (500 g)',
    description: 'Papa, zanahoria, arvejas y huevo con mayonesa. Bandeja de 500 g.',
    image_url: '/images/ensalada-rusa.jpg',
    sale_price: 3800, cost_price: 1400, unit_measure: 'unidad', product_type: 'elaborado', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 3, current_stock: 10, active: true,
    stock_mode: 'batch',
  },
  {
    id: 'prod-empanadas', business_id: B, category_id: 'cat-empanadas', sku: 'EMP-DOC-01',
    name: 'Empanadas de Pollo al Horno',
    description: 'Relleno de pollo, cebolla de verdeo, morrón y huevo. Masa casera horneada.',
    image_url: '/images/empanadas.jpg',
    sale_price: 12000, cost_price: 5800, unit_measure: 'docena', product_type: 'variante', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 2, current_stock: 6, active: true,
    stock_mode: 'batch',
    variants: [
      { id: 'var-emp-docena', product_id: 'prod-empanadas', name: 'Docena', price_adjustment: 0, final_price: 12000, is_default: true, active: true, stock_units: 1 },
      { id: 'var-emp-media', product_id: 'prod-empanadas', name: 'Media docena', price_adjustment: -5500, final_price: 6500, is_default: false, active: true, stock_units: 0.5 },
    ],
  },
  {
    id: 'prod-coca-15', business_id: B, category_id: 'cat-bebidas', sku: 'BEB-COCA-15', barcode: '7790895000454',
    name: 'Coca-Cola 1,5 L',
    description: 'Gaseosa sabor original, bien fría.',
    image_url: '/images/gaseosa.jpg',
    sale_price: 3200, cost_price: 2100, unit_measure: 'unidad', product_type: 'simple', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 12, current_stock: 48, active: true,
    stock_mode: 'simple',
  },
  {
    id: 'prod-quilmes-473', business_id: B, category_id: 'cat-bebidas', sku: 'BEB-QUIL-473', barcode: '7792798007394',
    name: 'Cerveza Quilmes Clásica lata 473 ml',
    description: 'Cerveza rubia lager. Venta exclusiva a mayores de 18 años.',
    image_url: '/images/cerveza.jpg',
    sale_price: 2400, cost_price: 1500, unit_measure: 'unidad', product_type: 'simple', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: false, min_stock: 12, current_stock: 36, active: true,
    stock_mode: 'simple',
  },
  {
    id: 'prod-combo-campeon', business_id: B, category_id: 'cat-combos', sku: 'CMB-CAMP-01',
    name: 'Combo Campeón a la Brasa',
    description: '1 pollo a la brasa entero estilo argentino + papas fritas caseras + Coca-Cola 1,5 L. Para 3 o 4 personas.',
    image_url: '/images/combo-brasa.jpg',
    sale_price: 19900, cost_price: 11500, unit_measure: 'combo', product_type: 'combo', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 0, current_stock: 0, active: true,
    combo_items: [
      { product_id: 'prod-spiedo-entero', variant_id: 'var-entero', quantity: 1 },
      { product_id: 'prod-fritas-grandes', quantity: 1 },
      { product_id: 'prod-coca-15', quantity: 1 },
    ],
  },
  {
    id: 'prod-combo-familiar', business_id: B, category_id: 'cat-combos', sku: 'CMB-FAM-02',
    name: 'Gran Parrillada Familiar a la Brasa',
    description: '2 pollos a la brasa estilo argentino + 2 papas fritas caseras + 2 Coca-Cola 1,5 L. Para 6 a 8 personas.',
    image_url: '/images/parrillada-completa.jpg',
    sale_price: 37500, cost_price: 23000, unit_measure: 'combo', product_type: 'combo', vat_rate: 21,
    is_available: true, is_visible_landing: true, is_featured: true, min_stock: 0, current_stock: 0, active: true,
    combo_items: [
      { product_id: 'prod-spiedo-entero', variant_id: 'var-entero', quantity: 2 },
      { product_id: 'prod-fritas-grandes', quantity: 2 },
      { product_id: 'prod-coca-15', quantity: 2 },
    ],
  },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-pollo-crudo', business_id: B, name: 'Pollo crudo entero', sku: 'INS-POL-CRU', unit_measure: 'unidad', current_stock: 65, min_stock: 20, cost_price: 4900, is_alert_active: true },
  { id: 'ing-papas-blancas', business_id: B, name: 'Papa blanca', sku: 'INS-PAP-BLA', unit_measure: 'kg', current_stock: 140, min_stock: 40, cost_price: 850, is_alert_active: true },
  { id: 'ing-aceite-freir', business_id: B, name: 'Aceite para freír', sku: 'INS-ACE-VEG', unit_measure: 'l', current_stock: 80, min_stock: 25, cost_price: 1950, is_alert_active: true },
  { id: 'ing-adobo-criollo', business_id: B, name: 'Adobo criollo (mix especias)', sku: 'INS-ESP-ADO', unit_measure: 'kg', current_stock: 18, min_stock: 5, cost_price: 6500, is_alert_active: true },
  { id: 'ing-limones', business_id: B, name: 'Limón', sku: 'INS-FRU-LIM', unit_measure: 'kg', current_stock: 25, min_stock: 10, cost_price: 900, is_alert_active: true },
  { id: 'ing-pechuga', business_id: B, name: 'Pechuga deshuesada', sku: 'INS-PEC-DES', unit_measure: 'kg', current_stock: 28, min_stock: 12, cost_price: 6200, is_alert_active: true },
  { id: 'ing-pan-rallado', business_id: B, name: 'Pan rallado', sku: 'INS-PAN-RAL', unit_measure: 'kg', current_stock: 35, min_stock: 15, cost_price: 1400, is_alert_active: true },
  { id: 'ing-huevos', business_id: B, name: 'Huevo', sku: 'INS-HUE', unit_measure: 'unidad', current_stock: 180, min_stock: 60, cost_price: 160, is_alert_active: true },
  { id: 'ing-queso-muzza', business_id: B, name: 'Queso muzzarella', sku: 'INS-LAC-MUZ', unit_measure: 'kg', current_stock: 19, min_stock: 8, cost_price: 7800, is_alert_active: true },
  { id: 'ing-jamon', business_id: B, name: 'Jamón cocido', sku: 'INS-FIA-JAM', unit_measure: 'kg', current_stock: 8, min_stock: 3, cost_price: 9800, is_alert_active: true },
  { id: 'ing-salsa-tomate', business_id: B, name: 'Salsa de tomate', sku: 'INS-SAL-TOM', unit_measure: 'kg', current_stock: 12, min_stock: 4, cost_price: 2100, is_alert_active: true },
  { id: 'ing-cheddar', business_id: B, name: 'Salsa de queso cheddar', sku: 'INS-LAC-CHE', unit_measure: 'kg', current_stock: 9, min_stock: 3, cost_price: 8900, is_alert_active: true },
  { id: 'ing-pan-hamburguesa', business_id: B, name: 'Pan de hamburguesa', sku: 'INS-PAN-HAM', unit_measure: 'unidad', current_stock: 60, min_stock: 24, cost_price: 450, is_alert_active: true },
  { id: 'ing-verduras', business_id: B, name: 'Lechuga y tomate (mix)', sku: 'INS-VER-MIX', unit_measure: 'kg', current_stock: 10, min_stock: 4, cost_price: 1800, is_alert_active: true },
  { id: 'ing-envases-pollo', business_id: B, name: 'Envase térmico para pollo', sku: 'INS-ENV-TER', unit_measure: 'unidad', current_stock: 220, min_stock: 50, cost_price: 280, is_alert_active: true },
  { id: 'ing-bolsas-kraft', business_id: B, name: 'Bolsa kraft con manija', sku: 'INS-ENV-BOL', unit_measure: 'unidad', current_stock: 310, min_stock: 80, cost_price: 190, is_alert_active: true },
  { id: 'ing-carbon', business_id: B, name: 'Carbón / leña de quebracho', sku: 'INS-COMB-CARB', unit_measure: 'kg', current_stock: 150, min_stock: 40, cost_price: 650, is_alert_active: true },
];

const recipe = (id: string, product_id: string, name: string, instructions: string, items: [string, number, string, number?][]): Recipe => ({
  id, product_id, name, instructions, yield_quantity: 1,
  items: items.map(([ingredient_id, quantity, unit_measure, waste], i) => ({
    id: `${id}-${i + 1}`, recipe_id: id, ingredient_id, quantity, unit_measure, waste_percentage: waste ?? 0,
  })),
});

/**
 * Recetas. Para productos con stock_mode 'batch' (spiedo) la receta se consume al
 * INICIAR la tanda; para 'recipe_on_sale' se consume en cada venta. Nunca ambas.
 */
export const INITIAL_RECIPES: Recipe[] = [
  recipe('rec-spiedo', 'prod-spiedo-entero', 'Pollo al spiedo (por unidad)',
    '1. Limpiar y secar el pollo. 2. Frotar con 60 g de adobo, limón y sal; reposar 12 h. 3. Espetar. 4. Cocinar 80 min a fuego parejo.',
    [['ing-pollo-crudo', 1, 'unidad'], ['ing-adobo-criollo', 0.06, 'kg'], ['ing-limones', 0.15, 'kg', 10], ['ing-envases-pollo', 1, 'unidad']]),
  recipe('rec-fritas', 'prod-fritas-grandes', 'Papas fritas (porción)',
    '1. Cortar en bastones. 2. Primera fritura a 140 °C 6 min. 3. Segunda a 185 °C 3 min. 4. Salar.',
    [['ing-papas-blancas', 0.8, 'kg', 15], ['ing-aceite-freir', 0.08, 'l'], ['ing-bolsas-kraft', 1, 'unidad']]),
  recipe('rec-fritas-cheddar', 'prod-fritas-cheddar', 'Papas con cheddar (porción)',
    'Papas fritas según receta base, cubiertas con 120 g de salsa cheddar caliente.',
    [['ing-papas-blancas', 0.8, 'kg', 15], ['ing-aceite-freir', 0.08, 'l'], ['ing-cheddar', 0.12, 'kg']]),
  recipe('rec-mila-pollo', 'prod-mila-pollo', 'Milanesa de pollo con fritas',
    'Pechuga fileteada, pasada por huevo y pan rallado, frita. Acompañar con papas fritas.',
    [['ing-pechuga', 0.25, 'kg', 5], ['ing-huevos', 1, 'unidad'], ['ing-pan-rallado', 0.06, 'kg'], ['ing-aceite-freir', 0.1, 'l'], ['ing-papas-blancas', 0.4, 'kg', 15]]),
  recipe('rec-mila-napo', 'prod-mila-napo', 'Milanesa napolitana con fritas',
    'Milanesa base + salsa de tomate, jamón y muzzarella gratinada al horno.',
    [['ing-pechuga', 0.25, 'kg', 5], ['ing-huevos', 1, 'unidad'], ['ing-pan-rallado', 0.06, 'kg'], ['ing-aceite-freir', 0.1, 'l'], ['ing-salsa-tomate', 0.05, 'kg'], ['ing-jamon', 0.04, 'kg'], ['ing-queso-muzza', 0.08, 'kg'], ['ing-papas-blancas', 0.4, 'kg', 15]]),
  recipe('rec-hamburguesa', 'prod-hamburguesa-pollo', 'Hamburguesa de pollo',
    'Pechuga aplanada y grillada; armar en pan con verduras y mayonesa.',
    [['ing-pechuga', 0.18, 'kg', 5], ['ing-pan-hamburguesa', 1, 'unidad'], ['ing-verduras', 0.05, 'kg']]),
];

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'zone-1', business_id: B, name: 'Zona 1: Centro y Macrocentro', price: 1200, estimated_minutes: 25, description: 'Plaza Roca, Bv. Roca y alrededores', active: true },
  { id: 'zone-2', business_id: B, name: 'Zona 2: Banda Norte y Alberdi', price: 1800, estimated_minutes: 35, description: 'Cruzando el puente y zona este', active: true },
  { id: 'zone-3', business_id: B, name: 'Zona 3: Las Higueras y quintas', price: 2500, estimated_minutes: 45, description: 'Radio ampliado', active: true },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1', business_id: B,
    name: 'Combo Campeón a la Brasa',
    description: 'Pollo a la brasa entero + papas fritas caseras + Coca-Cola 1,5 L a precio promocional.',
    promo_type: 'combo', discount_value: 2300, promotional_price: 19900,
    active_days: [0, 1, 2, 3, 4, 5, 6], active_channels: ['landing', 'mostrador', 'delivery'],
    image_url: '/images/combo-brasa.jpg', product_id: 'prod-combo-campeon', is_active: true,
  },
  {
    id: 'promo-2', business_id: B,
    name: 'Gran Parrillada Familiar a la Brasa',
    description: '2 pollos a la brasa estilo argentino + 2 papas fritas caseras + 2 gaseosas 1,5 L.',
    promo_type: 'combo', discount_value: 4900, promotional_price: 37500,
    active_days: [0, 1, 2, 3, 4, 5, 6], active_channels: ['landing', 'mostrador', 'delivery'],
    image_url: '/images/parrillada-completa.jpg', product_id: 'prod-combo-familiar', is_active: true,
  },
  {
    id: 'promo-3', business_id: B,
    name: '10% OFF pidiendo online',
    description: 'Ingresá el cupón CAMPEON10 en el carrito y obtené 10% de descuento en tu pedido.',
    promo_type: 'porcentaje', discount_value: 10, promotional_price: 0,
    active_days: [0, 1, 2, 3, 4, 5, 6], active_channels: ['landing'],
    image_url: '/images/parrilla-fuego.jpg', coupon_code: 'CAMPEON10', is_active: true,
  },
];

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();

export const INITIAL_PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    id: 'batch-101', branch_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', batch_number: 'TANDA-001', product_id: 'prod-spiedo-entero',
    start_time: minutesAgo(90), estimated_end_time: minutesAgo(10), actual_end_time: minutesAgo(8),
    raw_chicken_quantity: 15, cooked_quantity: 15, sold_quantity: 9, leftover_quantity: 6, waste_quantity: 0,
    status: 'listo', operator_name: 'Carlos Maidana', notes: 'Tanda de demostración.', created_at: minutesAgo(90),
  },
];

/** La caja arranca CERRADA: hay que abrirla con el fondo inicial antes de cobrar. */
export const INITIAL_CASH_SESSION: CashSession = {
  id: 'session-none',
  cash_register_id: 'reg-01',
  user_name: '',
  opened_at: '',
  initial_cash: 0,
  expected_cash: 0,
  total_sales_cash: 0,
  total_sales_digital: 0,
  total_expenses: 0,
  total_withdrawals: 0,
  status: 'cerrada',
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1', business_id: B, full_name: 'Santiago Martínez', phone: '+54 9 358 411-2233', email: 'smartinez@example.com',
    address: 'Belgrano 450, Piso 3 B', delivery_notes: 'Timbre 3B, portón negro', doc_type: 'DNI', doc_number: '34890123',
    iva_condition: 'Consumidor Final', total_orders: 0, total_spent: 0, created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'cust-2', business_id: B, full_name: 'Patricia Bressan', phone: '+54 9 358 488-9900', email: 'pbressan@example.com',
    address: 'Sobremonte 920', delivery_notes: 'Recepción consultorio', doc_type: 'CUIT', doc_number: '27-23456789-1',
    iva_condition: 'Responsable Inscripto', total_orders: 0, total_spent: 0, created_at: '2023-11-20T00:00:00Z',
  },
];

/** Pedidos de ejemplo para ver la cocina en funcionamiento (sin cobro registrado). */
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001', business_id: B, order_number: '#POL-1001', channel: 'landing',
    customer_name: 'Federico Lucero', customer_phone: '+54 9 358 601-9922', customer_address: 'Av. Sabattini 1420',
    delivery_type: 'delivery', delivery_zone_id: 'zone-1', delivery_zone_name: 'Zona 1: Centro y Macrocentro', delivery_fee: 1200,
    status: 'en_preparacion', payment_status: 'pendiente', payment_method: 'mercadopago',
    subtotal: 19900, discount: 0, total: 21100, estimated_time: '25-35 min', notes: 'Chimichurri aparte.',
    items: [{ id: 'item-1', order_id: 'ord-1001', product_id: 'prod-combo-campeon', product_name: 'Combo Campeón', quantity: 1, unit_price: 19900, subtotal: 19900 }],
    created_at: minutesAgo(18),
  },
  {
    id: 'ord-1002', business_id: B, order_number: '#POL-1002', channel: 'mostrador',
    customer_name: 'Mariana Quiroga', customer_phone: '+54 9 358 433-7711',
    delivery_type: 'retiro', delivery_fee: 0, status: 'listo', payment_status: 'pendiente', payment_method: 'efectivo',
    subtotal: 14500, discount: 0, total: 14500, estimated_time: 'Retira en mostrador', notes: 'Bien dorado.',
    items: [{ id: 'item-2', order_id: 'ord-1002', product_id: 'prod-spiedo-entero', variant_id: 'var-entero', product_name: 'Pollo al Spiedo (Entero)', quantity: 1, unit_price: 14500, subtotal: 14500 }],
    created_at: minutesAgo(32),
  },
  {
    id: 'ord-1003', business_id: B, order_number: '#POL-1003', channel: 'whatsapp',
    customer_name: 'Gonzalo Cabrera', customer_phone: '+54 9 358 522-8844', customer_address: 'Muñiz 210, Banda Norte',
    delivery_type: 'delivery', delivery_zone_id: 'zone-2', delivery_zone_name: 'Zona 2: Banda Norte y Alberdi', delivery_fee: 1800,
    status: 'recibido', payment_status: 'pendiente', payment_method: 'transferencia',
    subtotal: 12000, discount: 0, total: 13800, estimated_time: '35-45 min',
    items: [{ id: 'item-3', order_id: 'ord-1003', product_id: 'prod-empanadas', variant_id: 'var-emp-docena', product_name: 'Empanadas de Pollo al Horno (Docena)', quantity: 1, unit_price: 12000, subtotal: 12000 }],
    created_at: minutesAgo(5),
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1', business_id: B, name: 'Frigorífico Avícola Río Cuarto', trade_name: 'Avícola del Sur', cuit: '30-68493012-1',
    contact_name: 'Raúl Carrizo', phone: '+54 358 462-1100', email: 'pedidos@example.com', address: 'Ruta 8 Km 605, Río Cuarto',
    notes: 'Pollos enteros de 2,2 a 2,4 kg. Entregas martes y viernes.', active: true,
  },
  {
    id: 'sup-2', business_id: B, name: 'Distribuidora Central Bebidas y Descartables', trade_name: 'Distribuidora Río', cuit: '30-70891234-0',
    contact_name: 'Esteban Viale', phone: '+54 358 463-5544', email: 'ventas@example.com', address: 'General Paz 1240, Río Cuarto',
    notes: 'Gaseosas, envases térmicos y bolsas kraft.', active: true,
  },
];

/** Sin gastos precargados: se registran desde el módulo Gastos. */
export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_FISCAL_SETTINGS: FiscalSettings = {
  id: 'fisc-setting-01',
  business_id: B,
  cuit: '30715894129',
  legal_name: 'Pollería & Rotisería Los Campeones S.R.L.',
  fantasy_name: 'Pollería Los Campeones',
  fiscal_address: 'Av. Marcelo T. de Alvear 840, Río Cuarto, Córdoba',
  iva_condition: 'Responsable Inscripto',
  point_of_sale: 1,
  start_activity_date: '2020-03-01',
  environment: 'homologacion',
  is_active: false,
};
