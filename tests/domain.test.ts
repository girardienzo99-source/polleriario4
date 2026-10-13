import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeCartTotals, applyIncrease, findCoupon, MAX_DISCOUNT_PERCENT, marginPercent } from '../src/lib/domain/pricing.ts';
import { computeSaleDeltas, computeBatchStartDeltas, findShortages, reverseDeltas, type StockProduct, type StockRecipe } from '../src/lib/domain/stock.ts';
import { computeCashTotals, closingDifference, assertSessionOpen } from '../src/lib/domain/cash.ts';
import { validateCuit, allowedVoucherTypes, vatFromGross, buildArcaQrUrl, vatBreakdownByRate } from '../src/lib/domain/fiscal.ts';
import { summarizeSales, salesSeries, dayKey, pctChange } from '../src/lib/domain/reports.ts';
import { canAccess, canDo } from '../src/lib/domain/permissions.ts';

// ---------- Precios ----------
test('totales del carrito en centavos, sin errores de redondeo', () => {
  const t = computeCartTotals([{ unitPrice: 0.1, quantity: 3 }, { unitPrice: 14500, quantity: 1 }], { deliveryFee: 1200 });
  assert.equal(t.subtotal, 1450030);
  assert.equal(t.total, 1450030 + 120000);
});

test('el descuento nunca supera el tope', () => {
  const t = computeCartTotals([{ unitPrice: 1000, quantity: 1 }], { discountPercent: 90 });
  assert.equal(t.discount, 100000 * MAX_DISCOUNT_PERCENT / 100);
});

test('cantidades inválidas se rechazan', () => {
  assert.throws(() => computeCartTotals([{ unitPrice: 1000, quantity: 0 }]));
  assert.throws(() => computeCartTotals([{ unitPrice: -5, quantity: 1 }]));
});

test('cupones: sólo activos y sin distinguir mayúsculas', () => {
  assert.equal(findCoupon(' campeon10 ')?.percent, 10);
  assert.equal(findCoupon('NOEXISTE'), null);
});

test('aumento masivo con redondeo y rango válido', () => {
  assert.equal(applyIncrease(14500, 10, 100), 16000);
  assert.throws(() => applyIncrease(14500, -100));
  assert.equal(marginPercent(10000, 6000), 40);
});

// ---------- Stock ----------
const products: StockProduct[] = [
  { id: 'spiedo', name: 'Pollo al spiedo', product_type: 'variante', stock_mode: 'batch', current_stock: 10,
    variants: [{ id: 'entero', stock_units: 1 }, { id: 'medio', stock_units: 0.5 }] },
  { id: 'fritas', name: 'Papas fritas', product_type: 'elaborado', stock_mode: 'recipe_on_sale', current_stock: 0 },
  { id: 'coca', name: 'Gaseosa', product_type: 'simple', stock_mode: 'simple', current_stock: 5 },
  { id: 'combo', name: 'Combo', product_type: 'combo', current_stock: 0,
    combo_items: [{ product_id: 'spiedo', variant_id: 'entero', quantity: 1 }, { product_id: 'fritas', quantity: 1 }, { product_id: 'coca', quantity: 1 }] },
];
const recipes: StockRecipe[] = [
  { product_id: 'spiedo', yield_quantity: 1, items: [{ ingredient_id: 'pollo_crudo', quantity: 1, waste_percentage: 0 }] },
  { product_id: 'fritas', yield_quantity: 1, items: [{ ingredient_id: 'papa', quantity: 1, waste_percentage: 15 }] },
];

test('vender pollo de tanda NO descuenta pollo crudo (ya se descontó al hornear)', () => {
  const d = computeSaleDeltas([{ productId: 'spiedo', variantId: 'medio', quantity: 3 }], products, recipes);
  assert.deepEqual(d, [{ kind: 'product', id: 'spiedo', delta: -1.5 }]);
  assert.ok(!d.some(x => x.id === 'pollo_crudo'));
});

test('iniciar tanda descuenta pollo crudo una sola vez', () => {
  const d = computeBatchStartDeltas('spiedo', 20, recipes);
  assert.deepEqual(d, [{ kind: 'ingredient', id: 'pollo_crudo', delta: -20 }]);
});

test('combo se expande en componentes y agrega deltas', () => {
  const d = computeSaleDeltas([{ productId: 'combo', quantity: 2 }, { productId: 'coca', quantity: 1 }], products, recipes);
  const byId = Object.fromEntries(d.map(x => [x.id, x.delta]));
  assert.equal(byId.spiedo, -2);
  assert.equal(byId.papa, -2.3);
  assert.equal(byId.coca, -3);
  assert.equal(byId.pollo_crudo, undefined);
});

test('faltantes impiden la sobreventa', () => {
  const d = computeSaleDeltas([{ productId: 'coca', quantity: 6 }], products, recipes);
  const s = findShortages(d, products, []);
  assert.equal(s.length, 1);
  assert.equal(s[0].available, 5);
  assert.equal(findShortages(computeSaleDeltas([{ productId: 'coca', quantity: 5 }], products, recipes), products, []).length, 0);
});

test('cancelar revierte exactamente los mismos deltas', () => {
  const d = computeSaleDeltas([{ productId: 'combo', quantity: 1 }], products, recipes);
  const r = reverseDeltas(d);
  d.forEach((x, i) => assert.equal(x.delta + r[i].delta, 0));
});

// ---------- Caja ----------
test('caja: totales recalculados desde movimientos', () => {
  const t = computeCashTotals(25000, [
    { movement_type: 'venta', amount: 14500, payment_method: 'efectivo' },
    { movement_type: 'venta', amount: 8000, payment_method: 'mercadopago' },
    { movement_type: 'gasto', amount: 3000, payment_method: 'efectivo' },
    { movement_type: 'gasto', amount: 9000, payment_method: 'transferencia' },
    { movement_type: 'retiro', amount: 10000, payment_method: 'efectivo' },
  ]);
  assert.equal(t.expectedCash, 25000 + 14500 - 3000 - 10000);
  assert.equal(t.salesDigital, 8000);
  assert.equal(t.expenses, 12000);
  assert.equal(closingDifference(t.expectedCash, 26000), -500);
});

test('caja cerrada bloquea operaciones', () => {
  assert.throws(() => assertSessionOpen({ status: 'cerrada' }));
  assert.throws(() => assertSessionOpen(null));
  assert.doesNotThrow(() => assertSessionOpen({ status: 'abierta' }));
});

// ---------- Fiscal ----------
test('CUIT con dígito verificador', () => {
  assert.equal(validateCuit('30-71589412-9'), true);
  assert.equal(validateCuit('30-71589412-8'), false);
  assert.equal(validateCuit('20-12345678-6'), true);
  assert.equal(validateCuit('123'), false);
});

test('tipo de comprobante según condiciones de IVA', () => {
  assert.deepEqual(allowedVoucherTypes('Responsable Inscripto', 'Responsable Inscripto'), [1]);
  assert.deepEqual(allowedVoucherTypes('Responsable Inscripto', 'Consumidor Final'), [6]);
  assert.deepEqual(allowedVoucherTypes('Monotributo', 'Responsable Inscripto'), [11]);
});

test('IVA discriminado: neto + IVA = total exacto', () => {
  const b = vatFromGross(14500, 21);
  assert.equal(b.net, 11983.47);
  assert.equal(Math.round((b.net + b.vat) * 100), 1450000);
  const multi = vatBreakdownByRate([{ gross: 12100, rate: 21 }, { gross: 1105, rate: 10.5 }]);
  assert.equal(multi.find(x => x.rate === 21)?.net, 10000);
  assert.equal(multi.find(x => x.rate === 10.5)?.net, 1000);
});

test('sin CAE real no hay QR fiscal', () => {
  const base = { date: '2026-10-12', cuit: '30715894129', pointOfSale: 1, voucherType: 6, voucherNumber: 1, total: 100, docTypeReceiver: 99, docNumberReceiver: '0' };
  assert.throws(() => buildArcaQrUrl({ ...base, cae: '' }));
  assert.throws(() => buildArcaQrUrl({ ...base, cae: 'SIMULADO' }));
  const url = buildArcaQrUrl({ ...base, cae: '12345678901234' });
  const payload = JSON.parse(atob(url.split('?p=')[1]));
  assert.equal(payload.codAut, 12345678901234);
  assert.equal(payload.cuit, 30715894129);
});

// ---------- Informes ----------
test('informes calculados desde ventas reales', () => {
  const sales = [
    { total: 14500, payment_method: 'efectivo', created_at: '2026-10-12T15:00:00Z', items: [{ description: 'Pollo', quantity: 1, unit_price: 14500, subtotal: 14500, cost_price: 7800 }] },
    { total: 9000, payment_method: 'mercadopago', created_at: '2026-10-12T16:00:00Z', items: [{ description: 'Pollo', quantity: 0.5, unit_price: 7900, subtotal: 3950, cost_price: 7800 }, { description: 'Fritas', quantity: 1, unit_price: 5050, subtotal: 5050, cost_price: 1600 }] },
  ];
  const s = summarizeSales(sales);
  assert.equal(s.total, 23500);
  assert.equal(s.avgTicket, 11750);
  assert.equal(s.cost, 7800 + 3900 + 1600);
  assert.equal(s.topProducts[0].name, 'Pollo');
  const series = salesSeries(sales, ['2026-10-11', '2026-10-12']);
  assert.deepEqual(series.map(x => x.total), [0, 23500]);
  assert.equal(pctChange(100, 0), null);
});

test('día contable en hora de Córdoba (UTC-3)', () => {
  assert.equal(dayKey('2026-10-13T02:30:00Z'), '2026-10-12');
});

// ---------- Permisos ----------
test('permisos por rol', () => {
  assert.equal(canAccess('cocinero', 'kitchen'), true);
  assert.equal(canAccess('cocinero', 'cash'), false);
  assert.equal(canAccess('encargado', 'arca'), false);
  assert.equal(canAccess(null, 'pos'), false);
  assert.equal(canDo('cajero', 'edit_prices'), false);
  assert.equal(canDo('admin', 'reset_data'), true);
});
