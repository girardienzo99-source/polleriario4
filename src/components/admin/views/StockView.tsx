'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Check, 
  X, 
  Search 
} from 'lucide-react';
import { Ingredient } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const StockView: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<'entrada' | 'salida' | 'merma'>('entrada');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Recepción de mercadería / ajuste');

  const loadData = () => {
    setIngredients(PolleriaStore.getIngredients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;

    const delta = adjustType === 'entrada' ? adjustQty : -adjustQty;
    PolleriaStore.adjustIngredientStock(adjustModal.id, delta, `${adjustType.toUpperCase()}: ${adjustReason}`);
    setAdjustModal(null);
    setAdjustReason('Recepción de mercadería / ajuste');
  };

  const filtered = ingredients.filter(i => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q) || (i.sku && i.sku.toLowerCase().includes(q));
    }
    return true;
  });

  const criticalCount = ingredients.filter(i => i.current_stock <= i.min_stock).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-fire-500" />
            Stock e Inventario de Insumos y Materias Primas
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Pollo fresco crudo, papas, aceites, adobos, condimentos y envases descartables
          </p>
        </div>

        {criticalCount > 0 ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amberGold-500/10 border border-amberGold-500/30 text-amberGold-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            {criticalCount} insumos por debajo del mínimo
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Check className="w-4 h-4" />
            Niveles de inventario óptimos
          </div>
        )}
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <input
          type="text"
          placeholder="Buscar insumo (ej: pollo crudo, papas, envase)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500"
        />
      </div>

      {/* Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Insumo / Materia Prima</th>
                <th className="p-3.5">Código SKU</th>
                <th className="p-3.5">Unidad</th>
                <th className="p-3.5">Stock Actual</th>
                <th className="p-3.5">Stock Mínimo</th>
                <th className="p-3.5">Costo Unitario</th>
                <th className="p-3.5">Valorizado</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {filtered.map(ing => {
                const isCritical = ing.current_stock <= ing.min_stock;
                const valorized = ing.current_stock * ing.cost_price;

                return (
                  <tr key={ing.id} className="hover:bg-charcoal-800/40 transition">
                    <td className="p-3.5 font-bold text-white">{ing.name}</td>
                    <td className="p-3.5 text-charcoal-400 font-mono text-[11px]">{ing.sku || '-'}</td>
                    <td className="p-3.5 capitalize text-charcoal-300">{ing.unit_measure}</td>
                    <td className="p-3.5 font-black text-sm text-white">
                      {ing.current_stock} {ing.unit_measure}
                    </td>
                    <td className="p-3.5 text-charcoal-400">
                      {ing.min_stock} {ing.unit_measure}
                    </td>
                    <td className="p-3.5 text-charcoal-300">{formatARS(ing.cost_price)}</td>
                    <td className="p-3.5 font-bold text-white">{formatARS(valorized)}</td>
                    <td className="p-3.5">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-amberGold-500/20 text-amberGold-400 border border-amberGold-500/30">
                          Reponer
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-500/10 text-emerald-400">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setAdjustModal(ing);
                          setAdjustQty(10);
                        }}
                        className="px-2.5 py-1 bg-charcoal-800 hover:bg-fire-600 hover:text-white text-charcoal-200 rounded-lg text-xs font-bold transition"
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-charcoal-800">
              <h3 className="text-lg font-black text-white">
                Ajuste de Stock: {adjustModal.name}
              </h3>
              <button
                onClick={() => setAdjustModal(null)}
                className="text-charcoal-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Tipo de Movimiento *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('entrada')}
                    className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition ${
                      adjustType === 'entrada'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                        : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('salida')}
                    className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition ${
                      adjustType === 'salida'
                        ? 'bg-amberGold-600/20 border-amberGold-500 text-amberGold-400'
                        : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" /> Salida
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('merma')}
                    className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition ${
                      adjustType === 'merma'
                        ? 'bg-red-600/20 border-red-500 text-red-400'
                        : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Merma
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Cantidad ({adjustModal.unit_measure}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Motivo / Documento de Referencia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Remito N° 4819 / Vencimiento / Corrección recuento físico"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal(null)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl shadow-glow"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
