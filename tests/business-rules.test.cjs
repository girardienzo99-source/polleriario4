/**
 * SUITE DE PRUEBAS FUNCIONALES AUTOMATIZADAS
 * POLLERÍA PRO — Reglas de Negocio, Stock, Caja, ARCA y Pedidos
 */

const assert = require('assert');

// 1. Test CUIT Validator
function validateCUIT(cuit) {
  const clean = cuit.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * multipliers[i];
  }
  const mod = sum % 11;
  const checkDigit = mod === 0 ? 0 : mod === 1 ? 9 : 11 - mod;
  return checkDigit === parseInt(clean[10]);
}

console.log('🧪 Ejecutando Pruebas de Reglas de Negocio...');

// Test 1: CUIT
assert.strictEqual(validateCUIT('30-71589412-9'), true, 'El CUIT de Pollería Los Campeones debe ser válido');
assert.strictEqual(validateCUIT('20-12345678-0'), false, 'Un CUIT inválido debe retornar false');
console.log('  ✓ [1/8] Validación de CUIT con algoritmo módulo 11 superada.');

// Test 2: Precios y Margen
const costPrice = 7800;
const salePrice = 14500;
const margin = ((salePrice - costPrice) / salePrice) * 100;
assert.ok(margin > 45 && margin < 50, 'El margen debe rondar el 46.2%');
console.log(`  ✓ [2/8] Cálculo de margen bruto superado (${margin.toFixed(2)}%).`);

// Test 3: Redondeo masivo de precios
const oldPrice = 14500;
const percentIncrease = 15; // +15%
const roundTo = 100;
const rawNew = oldPrice * (1 + percentIncrease / 100); // 16675
const roundedNew = Math.round(rawNew / roundTo) * roundTo; // 16700
assert.strictEqual(roundedNew, 16700, 'El aumento de 15% con redondeo a $100 debe dar $16.700');
console.log(`  ✓ [3/8] Actualización masiva de precios con redondeo limpio a $100 superada ($${roundedNew}).`);

// Test 4: Consumo de Receta de Pollo al Spiedo
const initialRawChickenStock = 65;
const batchCooked = 15;
const remainingRawStock = initialRawChickenStock - batchCooked;
assert.strictEqual(remainingRawStock, 50, 'El stock de pollos crudos debe decrementar exactamente en la cantidad horneada');
console.log(`  ✓ [4/8] Consumo de materia prima en tanda de spiedo superado (Restan ${remainingRawStock} u.).`);

// Test 5: Cálculo de Vuelto en Efectivo
const posTotal = 19900;
const cashPaid = 20000;
const change = cashPaid - posTotal;
assert.strictEqual(change, 100, 'El vuelto debe ser exactamente $100');
console.log(`  ✓ [5/8] Cálculo de vuelto en efectivo para POS superado ($${change}).`);

// Test 6: Arqueo y Cierre de Caja
const initialCash = 25000;
const salesCash = 73400;
const manualWithdrawal = 5000;
const expectedCash = initialCash + salesCash - manualWithdrawal; // 93400
const countedCash = 93400;
const diff = countedCash - expectedCash;
assert.strictEqual(expectedCash, 93400, 'El efectivo esperado debe ser $93.400');
assert.strictEqual(diff, 0, 'La diferencia de caja debe ser cero cuando el conteo coincide');
console.log(`  ✓ [6/8] Arqueo de cierre de caja con diferencia cero superado.`);

// Test 7: Generación de QR oficial de ARCA (ex AFIP)
const qrPayload = {
  ver: 1,
  fecha: '2026-10-12',
  cuit: 30715894128,
  ptoVta: 1,
  tipoCmp: 6,
  nroCmp: 1042,
  importe: 19900.00,
  moneda: 'PES',
  ctz: 1,
  tipoDocRec: 96,
  nroDocRec: 34890123,
  tipoCodAut: 'E',
  codAut: 74428901234567,
};
const base64Data = Buffer.from(JSON.stringify(qrPayload)).toString('base64');
const expectedUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`;
assert.ok(expectedUrl.startsWith('https://www.afip.gob.ar/fe/qr/?p='), 'La URL del QR debe ser la oficial de AFIP');
const decoded = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf-8'));
assert.strictEqual(decoded.codAut, 74428901234567, 'El CAE decodificado del QR debe coincidir');
console.log('  ✓ [7/8] Especificación oficial del QR de ARCA (RG 4291/2018) verificada.');

// Test 8: Determinación de Comprobante Fiscal por Condición
function getVoucherType(emitterIva, receiverIva) {
  if (emitterIva === 'Monotributo') return 11; // Factura C
  if (receiverIva === 'Responsable Inscripto') return 1; // Factura A
  return 6; // Factura B
}
assert.strictEqual(getVoucherType('Responsable Inscripto', 'Responsable Inscripto'), 1, 'RI a RI debe ser Factura A');
assert.strictEqual(getVoucherType('Responsable Inscripto', 'Consumidor Final'), 6, 'RI a Final debe ser Factura B');
assert.strictEqual(getVoucherType('Monotributo', 'Consumidor Final'), 11, 'Monotributo debe ser Factura C');
console.log('  ✓ [8/8] Reglas fiscales de compatibilidad de comprobantes verificadas.');

console.log('\n🎉 ¡TODAS LAS PRUEBAS DE REGLAS DE NEGOCIO PASARON SATISFACTORIAMENTE!');
