import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeCartTotals, findCoupon, applyIncrease, roundToStep, marginPercent } from '../src/lib/domain/pricing.ts';
import { canTransition, delayLevel, nextStatuses } from '../src/lib/domain/orders.ts';
import { computeCashTotals, closingDifference } from '../src/lib/domain/cash.ts';
import { validateCuit, allowedVoucherTypes, vatFromGross, buildArcaQrUrl } from '../src/lib/domain/fiscal.ts';
import { canAccess, canDo, ROLE_MODULES } from '../src/lib/domain/permissions.ts';
import { computeSaleDeltas, findShortages, reverseDeltas, type StockProduct, type StockRecipe } from '../src/lib/domain/stock.ts';

// ----------------------------------------------------
// 1. Tienda: Precios, Cupones, Zonas de Envío y Totales
// ----------------------------------------------------
test('Regresión Tienda: Producto de $14.500 con CAMPEON10 da descuento $1.450 y subtotal $13.050', () => {
  const coupon = findCoupon('CAMPEON10');
  assert.ok(coupon, 'El cupón CAMPEON10 debe existir');
  assert.equal(coupon.percent, 10, 'El porcentaje de CAMPEON10 debe ser 10%');

  // Sin envío
  const totalsPickup = computeCartTotals([{ unitPrice: 14500, quantity: 1 }], { discountPercent: coupon.percent, deliveryFee: 0 });
  assert.equal(totalsPickup.subtotal, 1450000); // 14500.00
  assert.equal(totalsPickup.discount, 145000); // 1450.00
  assert.equal(totalsPickup.deliveryFee, 0);
  assert.equal(totalsPickup.total, 1305000); // 13050.00
});

test('Regresión Tienda: Con envío de Zona 1 ($1.200), el total queda exactamente en $14.250', () => {
  const coupon = findCoupon('CAMPEON10');
  assert.ok(coupon);

  const totalsDelivery = computeCartTotals([{ unitPrice: 14500, quantity: 1 }], { discountPercent: coupon.percent, deliveryFee: 1200 });
  assert.equal(totalsDelivery.subtotal, 1450000);
  assert.equal(totalsDelivery.discount, 145000);
  assert.equal(totalsDelivery.deliveryFee, 120000); // 1200.00
  assert.equal(totalsDelivery.total, 1425000); // 14250.00 (13050 + 1200)
});

// ----------------------------------------------------
// 2. ARCA: Venta demo VTA-1001 ($21.400) y Desglose Neto + IVA
// ----------------------------------------------------
test('Regresión ARCA: Venta demo de $21.400 arroja neto $17.685,95 + IVA $3.714,05 = $21.400', () => {
  const total = 21400;
  const breakdown = vatFromGross(total, 21);

  assert.equal(breakdown.net, 17685.95, 'Neto debe ser exactamente 17685.95');
  assert.equal(breakdown.vat, 3714.05, 'IVA 21% debe ser exactamente 3714.05');
  assert.equal(breakdown.total, 21400.00, 'Total debe ser 21400.00');
  assert.equal(Math.round((breakdown.net + breakdown.vat) * 100), 2140000, 'Neto + IVA debe igualar el total al centavo');
});

test('Regresión ARCA: En simulación no se genera QR fiscal ni CAE', () => {
  // Comprobante simulado sin CAE válido de 14 dígitos falla al querer generar QR de AFIP
  assert.throws(() => buildArcaQrUrl({
    date: '2026-10-12',
    cuit: '30715894129',
    pointOfSale: 1,
    voucherType: 6,
    voucherNumber: 1,
    total: 21400,
    docTypeReceiver: 99,
    docNumberReceiver: '0',
    cae: 'SIMULADO',
  }), /No se puede generar el QR fiscal sin un CAE válido emitido por ARCA/);
});

// ----------------------------------------------------
// 3. Cocina: Máquina de estados y transiciones válidas
// ----------------------------------------------------
test('Regresión Cocina: Ciclo de vida y transiciones completas', () => {
  // recibido -> en_preparacion -> listo -> entregado
  assert.ok(canTransition('recibido', 'en_preparacion'));
  assert.ok(canTransition('confirmado', 'en_preparacion'));
  assert.ok(canTransition('en_preparacion', 'listo'));
  assert.ok(canTransition('listo', 'entregado'));
  assert.ok(canTransition('listo', 'en_reparto'));
  assert.ok(canTransition('en_reparto', 'entregado'));

  // Transiciones inválidas
  assert.ok(!canTransition('recibido', 'listo'));
  assert.ok(!canTransition('recibido', 'entregado'));
  assert.ok(!canTransition('entregado', 'en_preparacion'));
  assert.ok(!canTransition('cancelado', 'listo'));

  // Niveles de demora
  const now = Date.now();
  assert.equal(delayLevel(new Date(now - 5 * 60_000).toISOString(), now), 'ok');
  assert.equal(delayLevel(new Date(now - 16 * 60_000).toISOString(), now), 'warn');
  assert.equal(delayLevel(new Date(now - 35 * 60_000).toISOString(), now), 'late');
});

// ----------------------------------------------------
// 4. POS y Caja: Totales y arqueo
// ----------------------------------------------------
test('Regresión POS & Caja: Vuelto y control de caja', () => {
  const initialCash = 30000;
  const movements = [
    { movement_type: 'venta' as const, amount: 14250, payment_method: 'efectivo' as const },
    { movement_type: 'venta' as const, amount: 21400, payment_method: 'mercadopago' as const },
    { movement_type: 'ingreso_manual' as const, amount: 5000, payment_method: 'efectivo' as const },
    { movement_type: 'retiro' as const, amount: 10000, payment_method: 'efectivo' as const },
  ];
  const totals = computeCashTotals(initialCash, movements);
  assert.equal(totals.expectedCash, 30000 + 14250 + 5000 - 10000); // 39250
  assert.equal(totals.salesDigital, 21400);

  // Arqueo de cierre
  assert.equal(closingDifference(totals.expectedCash, 39250), 0);
  assert.equal(closingDifference(totals.expectedCash, 39000), -250);
});

// ----------------------------------------------------
// 5. Permisos de los 8 módulos permitidos
// ----------------------------------------------------
test('Regresión Permisos: Solo 8 módulos autorizados', () => {
  const allowedModules = ['pos', 'kitchen', 'products', 'stock', 'prices', 'cash', 'arca', 'settings'];
  for (const m of allowedModules) {
    assert.ok(canAccess('admin', m as any), `Admin debe tener acceso a ${m}`);
  }

  // Módulos eliminados no deben ser accesibles
  assert.ok(!canAccess('admin', 'dashboard' as any));
  assert.ok(!canAccess('admin', 'orders' as any));
  assert.ok(!canAccess('admin', 'reports' as any));
  assert.ok(!canAccess('admin', 'recipes' as any));
  assert.ok(!canAccess('admin', 'production' as any));
  assert.ok(!canAccess('admin', 'promotions' as any));
  assert.ok(!canAccess('admin', 'customers' as any));
  assert.ok(!canAccess('admin', 'purchases' as any));
  assert.ok(!canAccess('admin', 'expenses' as any));
});
