'use client';

import React from 'react';
import { Sparkles, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const PromosBanner: React.FC = () => {
  const { addItem } = useCart();
  const [promos, setPromos] = React.useState<any[]>([]);
  const [addedId, setAddedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPromos(PolleriaStore.getPromotions().filter(p => p.is_active));
  }, []);

  const handleAddCombo = (promo: any) => {
    // Buscar si existe producto combo equivalente en el catálogo
    const products = PolleriaStore.getProducts();
    const comboProduct = products.find(p => p.product_type === 'combo') || products[0];

    addItem({
      ...comboProduct,
      name: promo.name,
      description: promo.description,
      sale_price: promo.promotional_price,
    }, undefined, 1);

    setAddedId(promo.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (promos.length === 0) return null;

  return (
    <section id="promos" className="py-12 bg-charcoal-900 border-b border-charcoal-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amberGold-500/10 border border-amberGold-500/20 text-amberGold-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Promociones de la Semana
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Combos Especiales para Compartir
            </h2>
          </div>
          <p className="text-xs text-charcoal-400 max-w-sm">
            Aprovechá nuestros precios especiales por tiempo limitado en pedidos online y mostrador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promos.map(promo => {
            const isAdded = addedId === promo.id;
            return (
              <div
                key={promo.id}
                className="relative bg-gradient-to-br from-charcoal-950 to-charcoal-900 rounded-3xl p-6 border border-charcoal-700 hover:border-fire-500/50 transition duration-300 shadow-xl overflow-hidden flex flex-col sm:flex-row gap-6 items-center"
              >
                {/* Image */}
                <div className="w-full sm:w-48 h-40 rounded-2xl overflow-hidden shrink-0 relative bg-charcoal-800">
                  <img
                    src={promo.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80'}
                    alt={promo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-fire-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                    AHORRO
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3 w-full text-left">
                  <div>
                    <h3 className="text-lg font-black text-white">{promo.name}</h3>
                    <p className="text-xs text-charcoal-300 mt-1 leading-relaxed">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-charcoal-800">
                    <div>
                      <span className="text-[10px] text-charcoal-400 block font-medium">Precio Especial</span>
                      <span className="text-2xl font-black text-amberGold-400">
                        {formatARS(promo.promotional_price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddCombo(promo)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 shadow ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white shadow-glow'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" /> ¡Combo en Carrito!
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" /> Pedir Combo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
