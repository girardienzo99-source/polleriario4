'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  Bike, 
  Store, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Copy, 
  Check, 
  MessageCircle, 
  Clock 
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, buildWhatsAppLink } from '@/lib/formatters';
import { PaymentMethod } from '@/types/database';

export const CheckoutModal: React.FC = () => {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    items, 
    subtotal, 
    discount, 
    total, 
    selectedZoneId, 
    submitOrder 
  } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'retiro'>('delivery');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [orderNotes, setOrderNotes] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; number: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const zones = typeof window !== 'undefined' ? PolleriaStore.getDeliveryZones() : [];
  const currentZone = zones.find(z => z.id === selectedZoneId);
  const deliveryFee = deliveryType === 'delivery' ? (currentZone?.price || 1200) : 0;
  const finalTotal = deliveryType === 'delivery' ? total : Math.max(0, subtotal - discount);

  if (!isCheckoutOpen) return null;

  const handleCopyAlias = () => {
    navigator.clipboard.writeText('POLLERIA.CAMPEONES.RIO');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Por favor completá tu nombre y teléfono de contacto.');
      return;
    }
    if (deliveryType === 'delivery' && !customerAddress.trim()) {
      setErrorMessage('Por favor ingresá tu dirección para el envío.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const res = await submitOrder({
      customerName,
      customerPhone,
      deliveryType,
      deliveryZoneId: selectedZoneId,
      customerAddress,
      deliveryNotes,
      paymentMethod,
      orderNotes,
    });

    setIsSubmitting(false);

    if (res.success && res.orderNumber) {
      setCompletedOrder({ id: res.orderId!, number: res.orderNumber });
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Confetti fallback
      }
    } else {
      setErrorMessage(res.error || 'Ocurrió un error al procesar el pedido.');
    }
  };

  // Completed State View
  if (completedOrder) {
    const waMessage = `¡Hola Pollería Los Campeones! Acabo de hacer el pedido ${completedOrder.number} a nombre de ${customerName}.
Total: ${formatARS(finalTotal)}
Forma de entrega: ${deliveryType === 'delivery' ? `Delivery a ${customerAddress}` : 'Retiro en local'}
Medio de pago: ${paymentMethod.toUpperCase()}`;

    const waLink = buildWhatsAppLink('+5493585123456', waMessage);

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-lg w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-fire-400 uppercase tracking-widest">
              ¡Pedido Confirmado con Éxito!
            </span>
            <h2 className="text-3xl font-black text-white">{completedOrder.number}</h2>
            <p className="text-sm text-charcoal-300 font-medium">
              Tu pedido ya ingresó a nuestra cocina en vivo.
            </p>
          </div>

          <div className="bg-charcoal-950 p-4 rounded-2xl border border-charcoal-800 text-left text-xs space-y-2 text-charcoal-300">
            <div className="flex justify-between pb-1 border-b border-charcoal-800">
              <span className="font-bold text-white">Cliente:</span>
              <span>{customerName}</span>
            </div>
            <div className="flex justify-between pb-1 border-b border-charcoal-800">
              <span className="font-bold text-white">Entrega:</span>
              <span>{deliveryType === 'delivery' ? `Envío a ${customerAddress}` : 'Retiro en el local'}</span>
            </div>
            <div className="flex justify-between pb-1 border-b border-charcoal-800">
              <span className="font-bold text-white">Medio de pago:</span>
              <span className="uppercase">{paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black text-white">
              <span>Total abonado:</span>
              <span className="text-fire-400">{formatARS(finalTotal)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-amberGold-400 font-semibold bg-amberGold-500/10 p-3 rounded-xl border border-amberGold-500/20">
            <Clock className="w-4 h-4" />
            Tiempo estimado de preparación: 25 a 35 minutos
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition"
            >
              <MessageCircle className="w-5 h-5" />
              Notificar / Enviar Comprobante por WhatsApp
            </a>

            <button
              onClick={() => {
                setCompletedOrder(null);
                setIsCheckoutOpen(false);
              }}
              className="w-full py-3 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 font-bold rounded-xl text-xs transition"
            >
              Volver a la Página Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-xl w-full p-6 my-8 text-left shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={() => setIsCheckoutOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6 space-y-1">
          <span className="text-xs font-bold text-fire-400 uppercase tracking-widest">
            Finalizar Pedido Online
          </span>
          <h2 className="text-2xl font-black text-white">Datos de Entrega y Pago</h2>
          <p className="text-xs text-charcoal-400">
            Completá tus datos para que comencemos a preparar tu comida de inmediato.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-charcoal-300 block mb-1">Nombre y Apellido *</label>
              <input
                type="text"
                required
                placeholder="Ej: Marcelo Rossi"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3.5 py-2.5 text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-300 block mb-1">Teléfono Celular *</label>
              <input
                type="tel"
                required
                placeholder="Ej: 358 4123456"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl px-3.5 py-2.5 text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 text-xs"
              />
            </div>
          </div>

          {/* Delivery Mode */}
          <div>
            <label className="font-bold text-charcoal-300 block mb-1">Modalidad de entrega *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                  deliveryType === 'delivery'
                    ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                    : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                }`}
              >
                <Bike className="w-4 h-4" /> Envío a Domicilio
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('retiro')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                  deliveryType === 'retiro'
                    ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                    : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                }`}
              >
                <Store className="w-4 h-4" /> Retiro en el Local
              </button>
            </div>
          </div>

          {/* Delivery Address fields */}
          {deliveryType === 'delivery' ? (
            <div className="space-y-3 bg-charcoal-950 p-3.5 rounded-2xl border border-charcoal-800">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Dirección exacta en Río Cuarto *</label>
                <input
                  type="text"
                  required
                  placeholder="Calle y número (ej: Belgrano 450)"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3.5 py-2 text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Referencias de entrega (opcional)</label>
                <input
                  type="text"
                  placeholder="Piso, depto, timbre, portón o entrecalles"
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl px-3.5 py-2 text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="bg-charcoal-950 p-3.5 rounded-2xl border border-charcoal-800 text-charcoal-300 text-xs flex items-center gap-3">
              <Store className="w-5 h-5 text-fire-500 shrink-0" />
              <div>
                <p className="font-bold text-white">Retiro por nuestro local:</p>
                <p>Av. Marcelo T. de Alvear 840, Río Cuarto. Sin costo adicional de envío.</p>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="font-bold text-charcoal-300 block mb-1">Medio de Pago *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`p-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition text-[11px] ${
                  paymentMethod === 'efectivo'
                    ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                    : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`p-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition text-[11px] ${
                  paymentMethod === 'transferencia'
                    ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                    : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                }`}
              >
                <Copy className="w-4 h-4" />
                Transferencia
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mercadopago')}
                className={`p-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition text-[11px] ${
                  paymentMethod === 'mercadopago'
                    ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                    : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Mercado Pago
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debito')}
                className={`p-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition text-[11px] ${
                  paymentMethod === 'debito'
                    ? 'bg-fire-600/20 border-fire-500 text-fire-400'
                    : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Tarjeta / Posnet
              </button>
            </div>

            {/* Transfer instructions */}
            {paymentMethod === 'transferencia' && (
              <div className="mt-2 p-3 bg-charcoal-950 rounded-xl border border-charcoal-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-charcoal-400 block text-[10px]">Alias para transferir:</span>
                  <span className="font-mono font-bold text-white tracking-wider">POLLERIA.CAMPEONES.RIO</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAlias}
                  className="flex items-center gap-1 px-2.5 py-1 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-lg font-semibold transition"
                >
                  {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedAlias ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
          </div>

          {/* Special Order Notes */}
          <div>
            <label className="font-bold text-charcoal-300 block mb-1">
              Observaciones para la cocina (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Pollo bien dorado, chimichurri extra picante en pote aparte..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-3 text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500 text-xs"
            />
          </div>

          {/* Summary & Submit */}
          <div className="pt-3 border-t border-charcoal-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-charcoal-400 block">Total a pagar</span>
              <span className="text-2xl font-black text-fire-400">{formatARS(finalTotal)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black py-3 px-6 rounded-xl shadow-glow text-sm transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando Pedido...' : 'Confirmar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
