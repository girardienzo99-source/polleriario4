'use client';

import React from 'react';
import { formatARS, formatDateTimeAR } from '@/lib/formatters';

export interface ThermalReceiptProps {
  type: 'commercial' | 'kitchen' | 'fiscal';
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessCuit?: string;
  orderNumber: string;
  date?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: 'retiro' | 'delivery';
  deliveryAddress?: string;
  paymentMethod?: string;
  notes?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
  }>;
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  fiscalData?: {
    voucherLetter: 'A' | 'B' | 'C';
    pointOfSale: number;
    voucherNumber: number;
    /** Sólo presente si ARCA autorizó el comprobante. Nunca se completa en simulación. */
    cae?: string;
    caeExpiration?: string;
    qrDataUrl?: string;
    isSimulation: boolean;
    receiverDoc?: string;
    receiverName?: string;
    receiverIvaCondition?: string;
    netAmount?: number;
    vatAmount?: number;
  };
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  type,
  businessName = 'POLLERÍA LOS CAMPEONES',
  businessAddress = 'Av. Marcelo T. de Alvear 840, Río Cuarto',
  businessPhone = '+54 358 464-8899',
  businessCuit = '30-71589412-9',
  orderNumber,
  date,
  customerName,
  customerPhone,
  deliveryType,
  deliveryAddress,
  paymentMethod = 'Efectivo',
  notes,
  items,
  subtotal,
  deliveryFee = 0,
  discount = 0,
  total,
  fiscalData,
}) => {
  const formattedDate = formatDateTimeAR(date || new Date().toISOString());

  if (type === 'kitchen') {
    return (
      <div id="thermal-receipt" className="font-mono text-xs bg-white text-black p-3 max-w-[80mm] mx-auto border border-dashed border-gray-300">
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <p className="text-sm font-bold tracking-wider">COMANDA DE COCINA</p>
          <p className="text-2xl font-black mt-1">{orderNumber}</p>
          <p className="text-xs uppercase font-semibold mt-1">
            {deliveryType === 'delivery' ? '🛵 DELIVERY' : '🏪 RETIRO EN LOCAL'}
          </p>
          <p className="text-[10px] text-gray-700">{formattedDate}</p>
        </div>

        {customerName && (
          <div className="border-b border-dashed border-gray-400 pb-1 mb-2">
            <p className="font-bold">Cliente: {customerName}</p>
            {deliveryAddress && <p className="text-[11px]">Dir: {deliveryAddress}</p>}
          </div>
        )}

        <div className="space-y-2 my-2 border-b-2 border-black pb-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-start text-sm">
              <span className="font-black text-base mr-2">{it.quantity}x</span>
              <div className="flex-1">
                <span className="font-bold">{it.name}</span>
                {it.notes && <p className="text-xs text-red-700 font-semibold italic">→ {it.notes}</p>}
              </div>
            </div>
          ))}
        </div>

        {notes && (
          <div className="bg-yellow-100 p-1.5 border border-yellow-400 mb-2">
            <p className="font-black text-xs">OBSERVACIONES:</p>
            <p className="text-xs font-bold">{notes}</p>
          </div>
        )}

        <div className="text-center pt-1 text-[10px] uppercase font-semibold">
          -- MARCAR LISTO EN PANTALLA KDS --
        </div>
      </div>
    );
  }

  if (type === 'fiscal') {
    const authorized = !!fiscalData && !fiscalData.isSimulation && /^\d{14}$/.test(fiscalData.cae || '');
    const letter = fiscalData?.voucherLetter || 'B';
    return (
      <div id="thermal-receipt" className="font-mono text-xs bg-white text-black p-3 max-w-[80mm] mx-auto border border-dashed border-gray-300">
        {!authorized && (
          <div className="text-center border-2 border-red-600 text-red-700 font-black text-[11px] p-1.5 mb-2">
            SIMULACIÓN — NO VÁLIDO COMO FACTURA
            <p className="text-[9px] font-semibold">No fue enviado ni autorizado por ARCA</p>
          </div>
        )}
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <div className="inline-block border-2 border-black font-black text-xl px-3 py-0.5 mb-1">{letter}</div>
          <p className="font-bold text-sm">{businessName}</p>
          <p className="text-[10px]">{businessAddress}</p>
          <p className="text-[10px]">CUIT: {businessCuit}</p>
          <p className="text-[10px]">IVA: Responsable Inscripto</p>
          <p className="text-[10px]">Inicio de actividades: 01/03/2020</p>
          <div className="border-t border-dotted border-gray-500 mt-1 pt-1">
            <p className="font-bold text-xs">
              {authorized ? `FACTURA ${letter} N° ` : `BORRADOR ${letter} SIM-`}
              {String(fiscalData?.pointOfSale || 1).padStart(4, '0')}-{String(fiscalData?.voucherNumber || 0).padStart(8, '0')}
            </p>
            <p className="text-[10px]">Fecha: {formattedDate}</p>
          </div>
        </div>

        <div className="border-b border-dotted border-gray-500 pb-1 mb-2 text-[10px]">
          <p><strong>A:</strong> {fiscalData?.receiverName || customerName || 'Consumidor Final'}</p>
          <p><strong>Doc:</strong> {fiscalData?.receiverDoc || 'Sin identificar'}</p>
          <p><strong>Cond. IVA:</strong> {fiscalData?.receiverIvaCondition || 'Consumidor Final'}</p>
        </div>

        <table className="w-full text-[10px] mb-2 border-b border-black pb-1">
          <thead>
            <tr className="border-b border-gray-400 text-left">
              <th className="py-0.5">Cant</th>
              <th className="py-0.5">Detalle</th>
              <th className="py-0.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td className="align-top">{it.quantity}</td>
                <td className="align-top">{it.name}</td>
                <td className="align-top text-right">{formatARS(it.subtotal, true)}</td>
              </tr>
            ))}
            {deliveryFee > 0 && (
              <tr>
                <td>1</td>
                <td>Costo de envío</td>
                <td className="text-right">{formatARS(deliveryFee, true)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="space-y-0.5 text-xs text-right border-b-2 border-black pb-1 mb-2">
          {discount > 0 && <p>Descuento: -{formatARS(discount, true)}</p>}
          {letter === 'A' && fiscalData?.netAmount !== undefined && (
            <>
              <p className="text-[10px]">Neto gravado: {formatARS(fiscalData.netAmount, true)}</p>
              <p className="text-[10px]">IVA 21%: {formatARS(fiscalData.vatAmount ?? 0, true)}</p>
            </>
          )}
          <p className="font-black text-sm">TOTAL: {formatARS(total, true)}</p>
          {letter === 'B' && fiscalData?.vatAmount !== undefined && (
            <p className="text-[9px] text-gray-700">Régimen de Transparencia Fiscal (Ley 27.743) — IVA contenido: {formatARS(fiscalData.vatAmount, true)}</p>
          )}
          <p className="text-[10px] text-gray-700">Pago: {paymentMethod}</p>
        </div>

        {authorized ? (
          <div className="text-center pt-1 border-t border-dashed border-gray-400">
            {fiscalData?.qrDataUrl && (
              <div className="flex justify-center my-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fiscalData.qrDataUrl} alt="Código QR del comprobante (ARCA)" className="w-24 h-24" />
              </div>
            )}
            <p className="font-bold text-[10px]">CAE: {fiscalData?.cae}</p>
            {fiscalData?.caeExpiration && <p className="text-[9px]">Vto. CAE: {fiscalData.caeExpiration}</p>}
            <p className="text-[8px] text-gray-600 mt-1">Comprobante autorizado por ARCA</p>
          </div>
        ) : (
          <div className="text-center pt-1 border-t border-dashed border-gray-400 text-[9px] text-gray-700">
            Sin CAE ni QR: este documento es una vista previa interna.
          </div>
        )}
      </div>
    );
  }

  // Commercial Ticket (Default)
  return (
    <div id="thermal-receipt" className="font-mono text-xs bg-white text-black p-3 max-w-[80mm] mx-auto border border-dashed border-gray-300">
      <div className="text-center border-b border-black pb-2 mb-2">
        <p className="text-sm font-black">{businessName}</p>
        <p className="text-[10px]">{businessAddress}</p>
        <p className="text-[10px]">Tel: {businessPhone}</p>
        <p className="text-[10px] font-semibold mt-1">TICKET DE CONTROL COMERCIAL</p>
        <p className="text-[9px] text-gray-600">(NO VÁLIDO COMO FACTURA)</p>
        <div className="mt-1 border-t border-dotted border-gray-400 pt-1">
          <p className="font-bold text-xs">{orderNumber}</p>
          <p className="text-[10px]">{formattedDate}</p>
          <p className="text-[10px] font-bold uppercase">{deliveryType === 'delivery' ? '🛵 DELIVERY' : '🏪 RETIRO EN LOCAL'}</p>
        </div>
      </div>

      {customerName && (
        <div className="border-b border-dotted border-gray-400 pb-1 mb-2 text-[10px]">
          <p><strong>Cliente:</strong> {customerName}</p>
          {customerPhone && <p><strong>Tel:</strong> {customerPhone}</p>}
          {deliveryAddress && <p><strong>Dir:</strong> {deliveryAddress}</p>}
        </div>
      )}

      <table className="w-full text-[10px] mb-2 border-b border-black pb-1">
        <thead>
          <tr className="border-b border-gray-400 text-left">
            <th className="py-0.5">Cant</th>
            <th className="py-0.5">Producto</th>
            <th className="py-0.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td className="align-top font-bold">{it.quantity}</td>
              <td className="align-top">{it.name}</td>
              <td className="align-top text-right font-medium">{formatARS(it.subtotal)}</td>
            </tr>
          ))}
          {deliveryFee > 0 && (
            <tr>
              <td>1</td>
              <td>Envío a domicilio</td>
              <td className="text-right">{formatARS(deliveryFee)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="space-y-0.5 text-right border-b border-black pb-2 mb-2">
        <p className="text-xs">Subtotal: {formatARS(subtotal)}</p>
        {discount > 0 && <p className="text-xs text-red-600 font-semibold">Descuento: -{formatARS(discount)}</p>}
        <p className="font-black text-sm pt-1">TOTAL: {formatARS(total)}</p>
        <p className="text-[10px] text-gray-700">Forma de pago: {paymentMethod}</p>
      </div>

      {notes && (
        <div className="text-[10px] italic border-b border-dashed border-gray-300 pb-1 mb-1">
          Obs: {notes}
        </div>
      )}

      <div className="text-center pt-2 text-[10px]">
        <p className="font-bold">¡Muchas gracias por su compra!</p>
        <p className="text-[9px] text-gray-600">Pollería Los Campeones • Río Cuarto</p>
      </div>
    </div>
  );
};
