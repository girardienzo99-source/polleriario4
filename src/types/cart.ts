import { Product, ProductVariant, PaymentMethod } from './database';

export interface CartItem {
  id: string; // unique item id in cart (product_id + variant_id)
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface CheckoutFormValues {
  customerName: string;
  customerPhone: string;
  deliveryType: 'retiro' | 'delivery';
  deliveryZoneId?: string;
  customerAddress?: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  paymentProofReference?: string;
  orderNotes?: string;
  scheduleTime?: string;
}
