'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Category, DeliveryZone, Order, Product, Promotion } from '@/types/database';
import type { CartLine, CartTotalsPesos, CheckoutFormValues, DeliveryType, PricedCartLine } from '@/types/cart';
import { PolleriaStore, STORE_EVENT } from '@/lib/data/storage';
import { INITIAL_BUSINESS } from '@/lib/data/mock-data';
import { computeCartTotals, findCoupon } from '@/lib/domain/pricing';
import { activeVariants, maxUnits, MAX_QTY_PER_LINE, unitPriceOf } from '@/components/landing/availability';

const CART_KEY = 'polleria_cart';

export interface Catalog {
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  zones: DeliveryZone[];
}

export interface CartToast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
  showCartAction?: boolean;
}

interface CartContextType {
  // catálogo en vivo (localStorage del panel)
  catalog: Catalog;
  catalogReady: boolean;
  // carrito
  lines: PricedCartLine[];
  itemCount: number;
  hasUnavailable: boolean;
  addItem: (productId: string, variantId?: string, quantity?: number, notes?: string) => boolean;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  // descuentos
  couponCode: string;
  discountPercent: number;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  // entrega
  deliveryType: DeliveryType;
  setDeliveryType: (t: DeliveryType) => void;
  zoneId: string;
  setZoneId: (id: string) => void;
  activeZones: DeliveryZone[];
  totals: CartTotalsPesos;
  // UI
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  toast: CartToast | null;
  showToast: (message: string, tone?: CartToast['tone'], showCartAction?: boolean) => void;
  dismissToast: () => void;
  // pedido
  submitOrder: (form: CheckoutFormValues) => Order;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const lineKey = (productId: string, variantId?: string) => `${productId}::${variantId ?? ''}`;

const EMPTY_CATALOG: Catalog = { products: [], categories: [], promotions: [], zones: [] };

function readCatalog(): Catalog {
  return {
    products: PolleriaStore.getProducts(),
    categories: PolleriaStore.getCategories(),
    promotions: PolleriaStore.getPromotions(),
    zones: PolleriaStore.getDeliveryZones(),
  };
}

interface PersistedCart {
  v: 2;
  lines: CartLine[];
  coupon?: string;
  deliveryType?: DeliveryType;
  zoneId?: string;
}

function readPersisted(): PersistedCart | null {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Formato anterior (array con el producto completo): se migra a referencias.
    if (Array.isArray(data)) {
      const lines: CartLine[] = data
        .filter((i: any) => i?.product?.id && i.quantity > 0)
        .map((i: any) => ({
          key: lineKey(i.product.id, i.variant?.id),
          productId: i.product.id,
          variantId: i.variant?.id,
          quantity: Math.min(Math.floor(i.quantity), MAX_QTY_PER_LINE),
          notes: i.notes,
          snapshot: { name: i.product.name, variantName: i.variant?.name, imageUrl: i.product.image_url, unitPrice: i.unitPrice ?? 0 },
        }));
      return { v: 2, lines };
    }
    if (data?.v === 2 && Array.isArray(data.lines)) return data as PersistedCart;
    return null;
  } catch {
    return null;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<Catalog>(EMPTY_CATALOG);
  const [catalogReady, setCatalogReady] = useState(false);
  const [rawLines, setRawLines] = useState<CartLine[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('retiro');
  const [zoneId, setZoneId] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);
  const hydrated = useRef(false);

  // Catálogo vivo: se refresca cuando el panel modifica el store (misma pestaña u otra).
  useEffect(() => {
    const load = () => {
      try {
        setCatalog(readCatalog());
      } catch (e) {
        console.error('Error leyendo el catálogo:', e);
      }
      setCatalogReady(true);
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('polleria_')) load();
    };
    window.addEventListener(STORE_EVENT, load);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STORE_EVENT, load);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Restaurar carrito
  useEffect(() => {
    const saved = readPersisted();
    if (saved) {
      setRawLines(saved.lines);
      if (saved.coupon) setCouponCode(saved.coupon);
      if (saved.deliveryType) setDeliveryType(saved.deliveryType);
      if (saved.zoneId) setZoneId(saved.zoneId);
    }
    hydrated.current = true;
  }, []);

  // Persistir carrito
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      const data: PersistedCart = { v: 2, lines: rawLines, coupon: couponCode || undefined, deliveryType, zoneId: zoneId || undefined };
      localStorage.setItem(CART_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error guardando el carrito:', e);
    }
  }, [rawLines, couponCode, deliveryType, zoneId]);

  const showToast = useCallback((message: string, tone: CartToast['tone'] = 'success', showCartAction = false) => {
    setToast({ id: Date.now() + Math.random(), message, tone, showCartAction });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  // Recalcular precios y disponibilidad con el catálogo vigente.
  const { lines, dropped } = useMemo(() => {
    const out: PricedCartLine[] = [];
    const dropped: string[] = [];
    if (!catalogReady) return { lines: out, dropped };
    for (const l of rawLines) {
      const product = catalog.products.find(p => p.id === l.productId);
      if (!product || !product.active || !product.is_visible_landing) {
        dropped.push(l.key);
        continue;
      }
      const variants = activeVariants(product);
      const variant = l.variantId ? variants.find(v => v.id === l.variantId) : undefined;
      if ((l.variantId && !variant) || (!l.variantId && variants.length > 0)) {
        dropped.push(l.key);
        continue;
      }
      const unitPrice = unitPriceOf(product, variant);
      const max = maxUnits(product, variant, catalog.products);
      out.push({
        ...l,
        product,
        variant,
        displayName: product.name,
        unitPrice,
        subtotal: Math.round(unitPrice * l.quantity * 100) / 100,
        available: max >= l.quantity && max > 0,
        maxQuantity: max,
        snapshot: { name: product.name, variantName: variant?.name, imageUrl: product.image_url, unitPrice },
      });
    }
    return { lines: out, dropped };
  }, [rawLines, catalog.products, catalogReady]);

  // Quitar del carrito persistido los productos dados de baja.
  useEffect(() => {
    if (!dropped.length) return;
    setRawLines(prev => prev.filter(l => !dropped.includes(l.key)));
    showToast('Algunos productos ya no están en la carta y se quitaron del carrito.', 'info');
  }, [dropped, showToast]);

  const activeZones = useMemo(() => catalog.zones.filter(z => z.active), [catalog.zones]);

  // Zona por defecto válida
  useEffect(() => {
    if (!catalogReady || !activeZones.length) return;
    if (!activeZones.some(z => z.id === zoneId)) setZoneId(activeZones[0].id);
  }, [activeZones, zoneId, catalogReady]);

  const coupon = couponCode ? findCoupon(couponCode) : null;
  const discountPercent = coupon?.percent ?? 0;
  const selectedZone = activeZones.find(z => z.id === zoneId);

  const totals = useMemo<CartTotalsPesos>(() => {
    try {
      const t = computeCartTotals(
        lines.map(l => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
        { discountPercent, deliveryFee: deliveryType === 'delivery' && lines.length ? selectedZone?.price ?? 0 : 0 },
      );
      return { subtotal: t.subtotal / 100, discount: t.discount / 100, deliveryFee: t.deliveryFee / 100, total: t.total / 100 };
    } catch {
      return { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 };
    }
  }, [lines, discountPercent, deliveryType, selectedZone?.price]);

  const addItem = useCallback(
    (productId: string, variantId?: string, quantity = 1, notes?: string): boolean => {
      const product = catalog.products.find(p => p.id === productId && p.active);
      if (!product) {
        showToast('Ese producto ya no está disponible.', 'error');
        return false;
      }
      const variant = variantId ? product.variants?.find(v => v.id === variantId && v.active) : undefined;
      if (variantId && !variant) {
        showToast('Esa opción ya no está disponible.', 'error');
        return false;
      }
      const key = lineKey(productId, variant?.id);
      const max = Math.min(maxUnits(product, variant, catalog.products), MAX_QTY_PER_LINE);
      const inCart = rawLines.find(l => l.key === key)?.quantity ?? 0;
      if (max <= 0) {
        showToast(`${product.name} está agotado por ahora.`, 'error');
        return false;
      }
      const next = Math.min(inCart + Math.max(1, Math.floor(quantity)), max);
      if (next === inCart) {
        showToast(`No hay más unidades disponibles de ${product.name}.`, 'error');
        return false;
      }
      const snapshot = { name: product.name, variantName: variant?.name, imageUrl: product.image_url, unitPrice: unitPriceOf(product, variant) };
      setRawLines(prev => {
        const exists = prev.some(l => l.key === key);
        if (exists) return prev.map(l => (l.key === key ? { ...l, quantity: next, snapshot } : l));
        return [...prev, { key, productId, variantId: variant?.id, quantity: next, notes, snapshot }];
      });
      const label = variant ? `${product.name} (${variant.name})` : product.name;
      showToast(next < inCart + quantity ? `Agregamos las últimas unidades de ${label}.` : `${label} se agregó a tu pedido.`, 'success', true);
      return true;
    },
    [catalog.products, rawLines, showToast],
  );

  const removeItem = useCallback((key: string) => setRawLines(prev => prev.filter(l => l.key !== key)), []);

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity <= 0) return removeItem(key);
      setRawLines(prev => prev.map(l => (l.key === key ? { ...l, quantity: Math.min(Math.floor(quantity), MAX_QTY_PER_LINE) } : l)));
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setRawLines([]);
    setCouponCode('');
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const c = findCoupon(code);
    if (!c) return { ok: false, message: 'El cupón no es válido o ya no está vigente.' };
    setCouponCode(c.code);
    return { ok: true, message: `Cupón ${c.code} aplicado: ${c.percent}% de descuento.` };
  }, []);
  const removeCoupon = useCallback(() => setCouponCode(''), []);

  const submitOrder = useCallback(
    (form: CheckoutFormValues): Order => {
      if (!lines.length) throw new Error('Tu carrito está vacío.');
      const blocked = lines.find(l => !l.available);
      if (blocked) throw new Error(`"${blocked.displayName}" no tiene stock suficiente. Ajustá la cantidad o quitalo del carrito.`);
      const isDelivery = form.deliveryType === 'delivery';
      const zone = isDelivery ? activeZones.find(z => z.id === form.deliveryZoneId) : undefined;
      if (isDelivery && !zone) throw new Error('Seleccioná una zona de envío válida.');

      const notes = [
        form.orderNotes?.trim(),
        isDelivery && form.addressReferences?.trim() ? `Referencias: ${form.addressReferences.trim()}` : '',
        coupon ? `Cupón ${coupon.code} (${coupon.percent}%)` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const now = new Date().toISOString();
      const order: Order = {
        id: '',
        business_id: INITIAL_BUSINESS.id,
        order_number: '',
        channel: 'landing',
        customer_name: form.customerName.trim(),
        customer_phone: form.customerPhone.trim(),
        customer_address: isDelivery ? form.customerAddress?.trim() : undefined,
        delivery_type: form.deliveryType,
        delivery_zone_id: zone?.id,
        delivery_zone_name: zone?.name,
        delivery_fee: zone?.price ?? 0,
        status: 'recibido',
        payment_status: 'pendiente',
        payment_method: form.paymentMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        requested_time: form.requestedTime,
        notes: notes || undefined,
        items: lines.map((l, idx) => ({
          id: `item-${Date.now().toString(36)}-${idx}`,
          order_id: '',
          product_id: l.productId,
          variant_id: l.variantId,
          product_name: l.variant ? `${l.product.name} (${l.variant.name})` : l.product.name,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          subtotal: l.subtotal,
          notes: l.notes,
        })),
        created_at: now,
      };

      // El store vuelve a cotizar con el catálogo vigente, valida stock y lanza Error en castellano.
      const created = PolleriaStore.createOrder(order, { discountPercent });
      clearCart();
      return created;
    },
    [lines, activeZones, coupon, totals, discountPercent, clearCart],
  );

  const itemCount = lines.reduce((a, l) => a + l.quantity, 0);
  const hasUnavailable = lines.some(l => !l.available);
  const activeCouponCode = coupon ? coupon.code : '';

  const openCart = useCallback(() => {
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const value = useMemo<CartContextType>(
    () => ({
      catalog,
      catalogReady,
      lines,
      itemCount,
      hasUnavailable,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      couponCode: activeCouponCode,
      discountPercent,
      applyCoupon,
      removeCoupon,
      deliveryType,
      setDeliveryType,
      zoneId,
      setZoneId,
      activeZones,
      totals,
      isCartOpen,
      openCart,
      closeCart,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
      toast,
      showToast,
      dismissToast,
      submitOrder,
    }),
    [
      catalog,
      catalogReady,
      lines,
      itemCount,
      hasUnavailable,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      activeCouponCode,
      discountPercent,
      applyCoupon,
      removeCoupon,
      deliveryType,
      zoneId,
      activeZones,
      totals,
      isCartOpen,
      openCart,
      closeCart,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
      toast,
      showToast,
      dismissToast,
      submitOrder,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};
