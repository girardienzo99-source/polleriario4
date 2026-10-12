import type { PaymentMethod, Product, ProductVariant } from './database';

/** Datos de presentación guardados al agregar (sólo para mostrar si el catálogo aún no cargó). */
export interface CartLineSnapshot {
  name: string;
  variantName?: string;
  imageUrl: string;
  unitPrice: number;
}

/** Lo que se persiste en localStorage: referencias al catálogo, nunca precios "de verdad". */
export interface CartLine {
  key: string; // productId::variantId
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
  snapshot: CartLineSnapshot;
}

/** Línea recalculada con el catálogo vigente en cada render. */
export interface PricedCartLine extends CartLine {
  product: Product;
  variant?: ProductVariant;
  displayName: string;
  unitPrice: number;
  subtotal: number;
  /** false si hoy no se puede vender (sin stock / no disponible). */
  available: boolean;
  /** Máximo vendible según stock (Infinity si no controla stock). */
  maxQuantity: number;
}

export type DeliveryType = 'retiro' | 'delivery';

export interface CartTotalsPesos {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export interface CheckoutFormValues {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  deliveryZoneId?: string;
  customerAddress?: string;
  addressReferences?: string;
  requestedTime: string;
  paymentMethod: Exclude<PaymentMethod, 'mixto'>;
  orderNotes?: string;
}
