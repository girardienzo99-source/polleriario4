/**
 * Dinero en centavos enteros. Nunca operar importes con floats sueltos:
 * toda la lógica de negocio recibe y devuelve centavos (number entero).
 */
export type Cents = number;

export function toCents(pesos: number): Cents {
  if (!Number.isFinite(pesos)) throw new Error(`Importe inválido: ${pesos}`);
  return Math.round(pesos * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

export function mulCents(cents: Cents, factor: number): Cents {
  return Math.round(cents * factor);
}

export function sumCents(values: Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0);
}

export function assertCents(value: number, label = 'importe'): void {
  if (!Number.isInteger(value)) throw new Error(`${label} debe ser un entero en centavos`);
}
