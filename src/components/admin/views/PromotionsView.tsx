'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Tag 
} from 'lucide-react';
import { Promotion } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const PromotionsView: React.FC = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    description: '',
    promo_type: 'combo',
    discount_value: 2000,
    promotional_price: 19900,
    active_days: [0, 1, 2, 3, 4, 5, 6],
    active_channels: ['landing', 'mostrador', 'delivery'],
    image_url: '/images/combo-campeon.jpg',
    coupon_code: '',
    is_active: true,
  });

  const loadData = () => {
    setPromos(PolleriaStore.getPromotions());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      name: formData.name!,
      description: formData.description,
      promo_type: formData.promo_type || 'combo',
      discount_value: Number(formData.discount_value) || 0,
      promotional_price: Math.max(0, Number(formData.promotional_price) || 0),
      active_days: formData.active_days || [0, 1, 2, 3, 4, 5, 6],
      active_channels: formData.active_channels || ['landing', 'mostrador', 'delivery'],
      image_url: formData.image_url || '/images/combo-campeon.jpg',
      coupon_code: formData.coupon_code ? formData.coupon_code.toUpperCase().trim() : undefined,
      product_id: formData.product_id,
      is_active: true,
    };

    PolleriaStore.savePromotion(newPromo);
    setShowModal(false);
  };

  const togglePromo = (promo: Promotion) => {
    PolleriaStore.savePromotion({ ...promo, is_active: !promo.is_active });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amberGold-400" />
            Administrador de Promociones y Combos
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Combos familiares, descuentos por día de la semana y cupones de fidelización
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black text-xs rounded-xl shadow-glow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nueva Promoción / Combo
        </button>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {promos.map(promo => (
          <div
            key={promo.id}
            className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow"
          >
            <div className="flex gap-4">
              <img
                src={promo.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}
                alt={promo.name}
                className="w-24 h-24 rounded-2xl object-cover bg-charcoal-950 shrink-0"
              />

              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-amberGold-400 uppercase tracking-widest block">
                  {promo.promo_type}
                </span>
                <h3 className="font-black text-base text-white truncate">{promo.name}</h3>
                <p className="text-xs text-charcoal-300 line-clamp-2">{promo.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-charcoal-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-charcoal-400 block font-medium">Precio Promo</span>
                <span className="text-xl font-black text-amberGold-400">
                  {formatARS(promo.promotional_price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePromo(promo)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                    promo.is_active
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {promo.is_active ? 'Activa en Tienda' : 'Pausada'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Promo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amberGold-400" />
              Crear Promoción o Combo Familiar
            </h3>

            <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Nombre de la Promoción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Combo Pareja (Medio Pollo + Fritas + 2 Bebidas)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Descripción y Componentes *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalle de productos incluidos"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Precio Final Promo ($) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.promotional_price}
                    onChange={e => setFormData({ ...formData, promotional_price: Number(e.target.value) })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Ahorro Estimado ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Código de Cupón Opcional (ej: CAMPEON10)</label>
                <input
                  type="text"
                  placeholder="Dejar vacío si es combo automático"
                  value={formData.coupon_code || ''}
                  onChange={e => setFormData({ ...formData, coupon_code: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Imagen (Ruta local o URL)</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="/images/combo-campeon.jpg"
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl shadow-glow"
                >
                  Guardar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
