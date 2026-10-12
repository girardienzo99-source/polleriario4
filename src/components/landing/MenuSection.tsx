'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Beef, 
  UtensilsCrossed, 
  Salad, 
  PieChart, 
  CupSoda, 
  Sparkles, 
  Search, 
  Plus, 
  Check, 
  Utensils 
} from 'lucide-react';
import { Category, Product, ProductVariant } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { useCart } from '@/context/CartContext';
import { formatARS } from '@/lib/formatters';

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  Beef,
  UtensilsCrossed,
  Salad,
  PieChart,
  CupSoda,
  Sparkles,
};

export const MenuSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const { addItem } = useCart();

  useEffect(() => {
    const cats = PolleriaStore.getCategories();
    const prods = PolleriaStore.getProducts();
    setCategories(cats);
    setProducts(prods);

    // Initial default variants
    const initialVarMap: Record<string, ProductVariant> = {};
    prods.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        const def = p.variants.find(v => v.is_default) || p.variants[0];
        initialVarMap[p.id] = def;
      }
    });
    setSelectedVariants(initialVarMap);

    const handleUpdate = () => {
      setCategories(PolleriaStore.getCategories());
      setProducts(PolleriaStore.getProducts());
    };
    window.addEventListener('polleria_store_updated', handleUpdate);
    return () => window.removeEventListener('polleria_store_updated', handleUpdate);
  }, []);

  const handleSelectVariant = (productId: string, variant: ProductVariant) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variant }));
  };

  const handleAddToCart = (product: Product) => {
    const variant = selectedVariants[product.id];
    addItem(product, variant, 1);
    setAddedItemNotice(product.id);
    setTimeout(() => setAddedItemNotice(null), 1500);
  };

  const filteredProducts = products.filter(p => {
    if (!p.active || !p.is_visible_landing) return false;
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q) || false;
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <section id="menu" className="py-16 bg-charcoal-950 border-b border-charcoal-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fire-600/10 border border-fire-500/20 text-fire-400 text-xs font-bold uppercase tracking-wider">
            <Utensils className="w-3.5 h-3.5" />
            Carta Gastronómica
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Nuestro Menú y Especialidades
          </h2>
          <p className="text-sm text-charcoal-400">
            Elegí tu comida favorita, agregala al pedido y recibila lista para disfrutar.
          </p>
        </div>

        {/* Search bar & Category filters */}
        <div className="space-y-4 mb-10">
          {/* Search Input */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Buscar pollo, milanesa, fritas, bebida..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-charcoal-400 focus:outline-none focus:border-fire-500 transition"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-fire-600 text-white shadow-glow'
                  : 'bg-charcoal-900 text-charcoal-300 hover:bg-charcoal-800 border border-charcoal-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Todos los Platos
            </button>

            {categories.map(cat => {
              const IconComp = ICON_MAP[cat.icon || ''] || Utensils;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-fire-600 text-white shadow-glow'
                      : 'bg-charcoal-900 text-charcoal-300 hover:bg-charcoal-800 border border-charcoal-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-charcoal-900/50 rounded-2xl border border-charcoal-800">
            <Utensils className="w-12 h-12 text-charcoal-500 mx-auto mb-3" />
            <p className="text-base font-bold text-white">No se encontraron productos</p>
            <p className="text-xs text-charcoal-400">Probá buscando con otro término o seleccionando otra categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const hasVariants = product.variants && product.variants.length > 0;
              const activeVariant = selectedVariants[product.id];
              const displayPrice = activeVariant ? activeVariant.final_price : product.sale_price;
              const isRecentlyAdded = addedItemNotice === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-charcoal-900 rounded-2xl overflow-hidden border border-charcoal-800 hover:border-charcoal-700 flex flex-col justify-between transition duration-300 group hover:shadow-xl"
                >
                  {/* Image container */}
                  <div className="relative h-48 w-full overflow-hidden bg-charcoal-950">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-black/30" />

                    {/* Badge */}
                    {product.is_featured && (
                      <span className="absolute top-2.5 left-2.5 bg-fire-600/90 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        ★ Más pedido
                      </span>
                    )}

                    {product.product_type === 'combo' && (
                      <span className="absolute top-2.5 right-2.5 bg-amberGold-600 text-charcoal-950 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        Combo Ahorro
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-white group-hover:text-fire-400 transition">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-charcoal-400 line-clamp-2 leading-relaxed font-normal">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Variant selector */}
                    {hasVariants && (
                      <div className="pt-2">
                        <label className="text-[11px] font-semibold text-charcoal-400 block mb-1">
                          Seleccionar tamaño / porción:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {product.variants!.map(v => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSelectVariant(product.id, v)}
                              className={`text-[11px] py-1 px-2 rounded-lg font-semibold border transition ${
                                activeVariant?.id === v.id
                                  ? 'bg-fire-600/20 border-fire-500 text-fire-300'
                                  : 'bg-charcoal-800/80 border-charcoal-700 text-charcoal-400 hover:bg-charcoal-700'
                              }`}
                            >
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price and Add button */}
                    <div className="pt-3 border-t border-charcoal-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-charcoal-400 block">Precio</span>
                        <span className="text-lg font-black text-white">
                          {formatARS(displayPrice)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.is_available}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow ${
                          isRecentlyAdded
                            ? 'bg-emerald-600 text-white'
                            : product.is_available
                            ? 'bg-fire-600 hover:bg-fire-500 text-white shadow-glow'
                            : 'bg-charcoal-800 text-charcoal-500 cursor-not-allowed'
                        }`}
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> ¡Agregado!
                          </>
                        ) : product.is_available ? (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Agregar
                          </>
                        ) : (
                          'Agotado'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
