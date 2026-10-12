'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { ThermalReceipt, ThermalReceiptProps } from '@/components/common/ThermalReceipt';

interface ThermalModalProps {
  receiptProps: ThermalReceiptProps | null;
  onClose: () => void;
}

export const ThermalModal: React.FC<ThermalModalProps> = ({ receiptProps, onClose }) => {
  if (!receiptProps) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-400 hover:text-white flex items-center justify-center transition no-print"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 no-print">
          <Printer className="w-5 h-5 text-fire-500" />
          <h3 className="font-bold text-white text-base">
            Vista Previa de Impresión Térmica
          </h3>
        </div>

        {/* Paper Container */}
        <div className="bg-gray-100 p-4 rounded-xl max-h-[65vh] overflow-y-auto shadow-inner">
          <ThermalReceipt {...receiptProps} />
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-charcoal-800 flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold transition"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-fire-600 hover:bg-fire-500 text-white rounded-xl text-xs font-black shadow-glow transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprobante (80mm / 58mm)
          </button>
        </div>
      </div>
    </div>
  );
};
