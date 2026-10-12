'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types/database';
import { CartItem, CheckoutFormValues } from '@/types/cart';
import { PolleriaStore } from '@/lib/data/storage';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant, quantity?: number, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  discountCode: string;
  applyDiscountCode: (code: string) => boolean;
  submitOrder: (form: CheckoutFormValues) => Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-1');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('polleria_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('polleria_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [items]);

  const addItem = (product: Product, variant?: ProductVariant, quantity: number = 1, notes?: string) => {
    const unitPrice = variant ? variant.final_price : product.sale_price;
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;

    setItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          product,
          variant,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
          notes,
        }
      ];
    });
    setIsCartOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, quantity, subtotal: quantity * i.unitPrice }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setDiscountPercent(0);
    localStorage.removeItem('polleria_cart');
  };

  const applyDiscountCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'CAMPEON10') {
      setDiscountCode(clean);
      setDiscountPercent(10);
      return true;
    }
    if (clean === 'RIOCUARTO') {
      setDiscountCode(clean);
      setDiscountPercent(15);
      return true;
    }
    return false;
  };

  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const zones = typeof window !== 'undefined' ? PolleriaStore.getDeliveryZones() : [];
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const deliveryFee = selectedZone ? selectedZone.price : 0;

  const discount = Math.round(subtotal * (discountPercent / 100));
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const submitOrder = async (form: CheckoutFormValues) => {
    try {
      if (items.length === 0) return { success: false, error: 'El carrito está vacío' };

      const currentZone = zones.find(z => z.id === form.deliveryZoneId);
      const actualDeliveryFee = form.deliveryType === 'delivery' ? (currentZone?.price || 1200) : 0;
      const orderTotal = Math.max(0, subtotal - discount + actualDeliveryFee);

      const created = PolleriaStore.createOrder({
        id: `ord-${Date.now()}`,
        business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        order_number: '',
        channel: 'landing',
        customer_name: form.customerName,
        customer_phone: form.customerPhone,
        customer_address: form.customerAddress,
        delivery_type: form.deliveryType,
        delivery_zone_id: form.deliveryType === 'delivery' ? form.deliveryZoneId : undefined,
        delivery_zone_name: form.deliveryType === 'delivery' ? currentZone?.name : undefined,
        delivery_fee: actualDeliveryFee,
        status: 'recibido',
        payment_status: form.paymentMethod === 'efectivo' ? 'pendiente' : 'pendiente',
        payment_method: form.paymentMethod,
        subtotal: subtotal,
        discount: discount,
        total: orderTotal,
        notes: [form.orderNotes, form.deliveryNotes ? `Entrega: ${form.deliveryNotes}` : null, form.paymentProofReference ? `Comprobante: ${form.paymentProofReference}` : null].filter(Boolean).join(' | '),
        items: items.map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          order_id: '',
          product_id: it.product.id,
          variant_id: it.variant?.id,
          product_name: it.variant ? `${it.product.name} (${it.variant.name})` : it.product.name,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          subtotal: it.subtotal,
          notes: it.notes,
        })),
        created_at: new Date().toISOString(),
      });

      clearCart();
      setIsCheckoutOpen(false);

      return {
        success: true,
        orderId: created.id,
        orderNumber: created.order_number,
      };
    } catch (e: any) {
      console.error('Error submitting order:', e);
      return { success: false, error: e.message || 'Error al procesar el pedido' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        deliveryFee,
        discount,
        total,
        selectedZoneId,
        setSelectedZoneId,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        discountCode,
        applyDiscountCode,
        submitOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
