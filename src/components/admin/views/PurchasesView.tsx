'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Check, Search, Calendar, PackagePlus } from 'lucide-react';
import { Supplier, Ingredient } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const PurchasesView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('FAC-0001-000489');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [receivedQty, setReceivedQty] = useState(25);
  const [unitCost, setUnitCost] = useState(4900);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const loadData = () => {
    setSuppliers(PolleriaStore.getSuppliers());
    setIngredients(PolleriaStore.getIngredients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleRegisterPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId) return;

    // 1. Aumentar stock del insumo y actualizar costo
    PolleriaStore.adjustIngredientStock(
      selectedIngredientId,
      receivedQty,
      `Compra Proveedor ${invoiceNumber}`
    );

    // 2. Actualizar precio de costo del insumo
    const ing = ingredients.find(i => i.id === selectedIngredientId);
    if (ing) {
      PolleriaStore.saveIngredient({
        ...ing,
        cost_price: unitCost,
      });
    }

    setSuccessNotice(`¡Ingreso de ${receivedQty} ${ing?.unit_measure || 'unidades'} registrado en stock con éxito!`);
    setTimeout(() => setSuccessNotice(null), 3500);
    setShowPurchaseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-fire-500" />
            Compras a Proveedores y Recepción de Mercadería
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Entrada de pollos crudos, verduras, papas, envases y reposición de inventario
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSupplierId(suppliers[0]?.id || '');
            setSelectedIngredientId(ingredients[0]?.id || '');
            setShowPurchaseModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black text-xs rounded-xl shadow-glow transition active:scale-95"
        >
          <PackagePlus className="w-4 h-4" />
          Registrar Entrada de Compra
        </button>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl animate-in fade-in">
          {successNotice}
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="p-5 border-b border-charcoal-800">
          <h3 className="font-black text-white text-base">Proveedores Homologados</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Razón Social / Proveedor</th>
                <th className="p-3.5">Nombre Fantasía</th>
                <th className="p-3.5">CUIT</th>
                <th className="p-3.5">Contacto</th>
                <th className="p-3.5">Teléfono</th>
                <th className="p-3.5">Dirección / Localidad</th>
                <th className="p-3.5">Notas de Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-charcoal-800/40">
                  <td className="p-3.5 font-bold text-white">{s.name}</td>
                  <td className="p-3.5 text-charcoal-300 font-semibold">{s.trade_name || '-'}</td>
                  <td className="p-3.5 text-charcoal-400 font-mono text-[11px]">{s.cuit || '-'}</td>
                  <td className="p-3.5 text-charcoal-200">{s.contact_name || '-'}</td>
                  <td className="p-3.5 text-charcoal-300">{s.phone}</td>
                  <td className="p-3.5 text-charcoal-400">{s.address || '-'}</td>
                  <td className="p-3.5 text-charcoal-400 max-w-xs truncate">{s.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-fire-500" />
              Recepción y Carga de Mercadería
            </h3>
            <p className="text-xs text-charcoal-400">
              Incrementa automáticamente el stock del insumo seleccionado y actualiza su costo de reposición.
            </p>

            <form onSubmit={handleRegisterPurchase} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Proveedor *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">N° de Factura / Remito *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Insumo Recibido *</label>
                <select
                  value={selectedIngredientId}
                  onChange={e => {
                    setSelectedIngredientId(e.target.value);
                    const found = ingredients.find(i => i.id === e.target.value);
                    if (found) setUnitCost(found.cost_price);
                  }}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-semibold"
                >
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit_measure})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Cantidad Recibida *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receivedQty}
                    onChange={e => setReceivedQty(Number(e.target.value))}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Costo Unitario ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={unitCost}
                    onChange={e => setUnitCost(Number(e.target.value))}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-charcoal-950 rounded-2xl border border-charcoal-800 flex justify-between items-center">
                <span className="text-charcoal-400">Total de Compra:</span>
                <span className="font-black text-fire-400 text-sm">{formatARS(receivedQty * unitCost)}</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl shadow-glow"
                >
                  Confirmar e Ingresar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
