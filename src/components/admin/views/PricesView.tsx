'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Percent, 
  Check, 
  Layers 
} from 'lucide-react';
import { Product, Category } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

import { applyIncrease } from '@/lib/domain/pricing';

export const PricesView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targetCategory, setTargetCategory] = useState<string>('all');
  const [percentIncrease, setPercentIncrease] = useState<number>(10);
  const [roundToNearest, setRoundToNearest] = useState<number>(100);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const loadData = () => {
    setProducts(PolleriaStore.getProducts());
    setCategories(PolleriaStore.getCategories());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleApplyBulkIncrease = () => {
    if (percentIncrease <= 0) return;

    let updatedCount = 0;

    const updated = products.map(p => {
      if (targetCategory !== 'all' && p.category_id !== targetCategory) {
        return p;
      }
      updatedCount++;
      return {
        ...p,
        sale_price: applyIncrease(p.sale_price, percentIncrease, roundToNearest),
      };
    });

    PolleriaStore.saveProductsBulk(updated);
    setAppliedNotice(`¡Precios actualizados (+${percentIncrease}%) en ${updatedCount} productos!`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-4 sm:p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-fire-500 shrink-0" />
            Administración Centralizada de Precios
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Costos, márgenes y actualización masiva por inflación en pesos argentinos
          </p>
        </div>
      </div>

      {/* Bulk Price Increaser Card */}
      <div className="bg-charcoal-900 p-4 sm:p-6 rounded-3xl border border-charcoal-800 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-fire-500 shrink-0" />
          <h3 className="font-black text-sm sm:text-base text-white">Herramienta de Aumento Masivo de Precios</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-charcoal-300 block mb-1">Aplicar a Categoría:</label>
            <select
              value={targetCategory}
              onChange={e => setTargetCategory(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
            >
              <option value="all">Todo el Catálogo Completo</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-charcoal-300 block mb-1">Porcentaje de Aumento (%):</label>
            <input
              type="number"
              min="1"
              max="100"
              value={percentIncrease}
              onChange={e => setPercentIncrease(Number(e.target.value))}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-charcoal-300 block mb-1">Redondeo en ARS:</label>
            <select
              value={roundToNearest}
              onChange={e => setRoundToNearest(Number(e.target.value))}
              className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
            >
              <option value={100}>Al $100 más cercano (ej: $14.500)</option>
              <option value={500}>Al $500 más cercano (ej: $14.500 / $15.000)</option>
              <option value={1000}>Al $1.000 más cercano</option>
              <option value={1}>Sin redondeo exacto</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyBulkIncrease}
              className="w-full py-3 sm:py-2.5 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black rounded-xl text-xs shadow-glow transition active:scale-95"
            >
              Aplicar Aumento Masivo
            </button>
          </div>
        </div>

        {appliedNotice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl animate-in fade-in">
            {appliedNotice}
          </div>
        )}
      </div>

      {/* Mobile Pricing Cards (< md) */}
      <div className="md:hidden space-y-2.5">
        {products.map(p => {
          const profit = p.sale_price - p.cost_price;
          const margin = p.sale_price > 0 ? ((profit / p.sale_price) * 100).toFixed(0) : '0';

          return (
            <div key={p.id} className="bg-charcoal-900 rounded-2xl border border-charcoal-800 p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{p.name}</h4>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                    Costo: {formatARS(p.cost_price)} · Margen: <span className="text-emerald-400 font-bold">{margin}%</span> ({formatARS(profit)})
                  </p>
                </div>
                <span className="font-black text-base text-white shrink-0">{formatARS(p.sale_price)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-charcoal-800/80">
                <span className="text-xs font-semibold text-charcoal-300">Nuevo precio ($):</span>
                <div className="inline-flex items-center gap-1.5">
                  <span className="text-xs text-charcoal-400 font-bold">$</span>
                  <input
                    key={p.sale_price}
                    type="number"
                    step="100"
                    defaultValue={p.sale_price}
                    onBlur={e => {
                      const newPrice = Number(e.target.value);
                      if (newPrice > 0 && newPrice !== p.sale_price) {
                        PolleriaStore.saveProduct({ ...p, sale_price: newPrice });
                      }
                    }}
                    className="w-28 bg-charcoal-950 border border-charcoal-700 rounded-xl px-2.5 py-1.5 text-right text-base font-bold text-white focus:border-fire-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop & Tablet Pricing Table (md+) */}
      <div className="hidden md:block bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Plato / Producto</th>
                <th className="p-3.5">Costo Base</th>
                <th className="p-3.5">Precio Mostrador</th>
                <th className="p-3.5">Margen Bruto</th>
                <th className="p-3.5">Ganancia ($)</th>
                <th className="p-3.5 text-right">Actualización Directa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {products.map(p => {
                const profit = p.sale_price - p.cost_price;
                const margin = p.sale_price > 0 ? ((profit / p.sale_price) * 100).toFixed(0) : '0';

                return (
                  <tr key={p.id} className="hover:bg-charcoal-800/40">
                    <td className="p-3.5 font-bold text-white">{p.name}</td>
                    <td className="p-3.5 text-charcoal-400">{formatARS(p.cost_price)}</td>
                    <td className="p-3.5 font-black text-sm text-white">{formatARS(p.sale_price)}</td>
                    <td className="p-3.5">
                      <span className="text-emerald-400 font-bold">{margin}%</span>
                    </td>
                    <td className="p-3.5 font-bold text-fire-400">{formatARS(profit)}</td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-[10px] text-charcoal-400">$</span>
                        <input
                          key={p.sale_price}
                          type="number"
                          step="100"
                          defaultValue={p.sale_price}
                          onBlur={e => {
                            const newPrice = Number(e.target.value);
                            if (newPrice > 0 && newPrice !== p.sale_price) {
                              PolleriaStore.saveProduct({ ...p, sale_price: newPrice });
                            }
                          }}
                          className="w-24 bg-charcoal-950 border border-charcoal-700 rounded-lg p-1 text-right text-xs font-bold text-white focus:border-fire-500"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
