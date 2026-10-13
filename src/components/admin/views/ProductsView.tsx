'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  Check, 
  X, 
  Layers 
} from 'lucide-react';
import { Product, Category, ProductType } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';
import { applyIncrease } from '@/lib/domain/pricing';

const PHOTO_PRESETS = [
  { label: 'Pollo Brasa Entero', url: '/images/pollo-brasa-entero.jpg' },
  { label: 'Medio Pollo Brasa', url: '/images/medio-pollo-brasa.jpg' },
  { label: 'Cuarto Pollo Brasa', url: '/images/cuarto-pollo-brasa.jpg' },
  { label: 'Pollo Limón Brasa', url: '/images/pollo-limon-brasa.jpg' },
  { label: 'Pollo Chimichurri', url: '/images/pollo-chimichurri.jpg' },
  { label: 'Combo Campeón', url: '/images/combo-campeon.jpg' },
  { label: 'Pollo Spiedo', url: '/images/pollo-spiedo.jpg' },
  { label: 'Pollo Horno', url: '/images/pollo-horno.jpg' },
  { label: 'Milanesa Napolitana', url: '/images/milanesa-napolitana.jpg' },
  { label: 'Milanesa Pollo', url: '/images/milanesa-pollo.jpg' },
  { label: 'Papas Fritas', url: '/images/papas-fritas.jpg' },
  { label: 'Papas Cheddar', url: '/images/papas-cheddar.jpg' },
  { label: 'Ensalada Rusa', url: '/images/ensalada-rusa.jpg' },
  { label: 'Empanadas Criollas', url: '/images/empanadas.jpg' },
  { label: 'Gaseosa 1.5L', url: '/images/gaseosa.jpg' },
  { label: 'Cerveza 1L', url: '/images/cerveza.jpg' },
];

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit / Create modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category_id: '',
    sku: '',
    barcode: '',
    description: '',
    image_url: '/images/pollo-horno.jpg',
    sale_price: 10000,
    cost_price: 5000,
    unit_measure: 'unidad',
    product_type: 'elaborado',
    stock_mode: 'recipe_on_sale',
    vat_rate: 21,
    is_available: true,
    is_visible_landing: true,
    is_featured: false,
    min_stock: 5,
    current_stock: 10,
    active: true,
  });

  const loadData = () => {
    setProducts(PolleriaStore.getProducts());
    setCategories(PolleriaStore.getCategories());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      barcode: '',
      description: '',
      image_url: '/images/pollo-horno.jpg',
      sale_price: 12000,
      cost_price: 6000,
      unit_measure: 'unidad',
      product_type: 'elaborado',
      stock_mode: 'recipe_on_sale',
      vat_rate: 21,
      is_available: true,
      is_visible_landing: true,
      is_featured: false,
      min_stock: 5,
      current_stock: 10,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const toSave: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      name: formData.name!,
      category_id: formData.category_id,
      sku: formData.sku,
      barcode: formData.barcode,
      description: formData.description,
      image_url: formData.image_url || '/images/pollo-horno.jpg',
      sale_price: Number(formData.sale_price) || 0,
      cost_price: Number(formData.cost_price) || 0,
      unit_measure: formData.unit_measure || 'unidad',
      product_type: formData.product_type as ProductType || 'elaborado',
      stock_mode: formData.stock_mode || editingProduct?.stock_mode || (formData.product_type === 'simple' ? 'simple' : 'recipe_on_sale'),
      vat_rate: Number(formData.vat_rate) || 21,
      is_available: formData.is_available ?? true,
      is_visible_landing: formData.is_visible_landing ?? true,
      is_featured: formData.is_featured ?? false,
      min_stock: Number(formData.min_stock) || 5,
      current_stock: Number(formData.current_stock) || 0,
      active: true,
      variants: editingProduct?.variants || [],
      combo_items: editingProduct?.combo_items || [],
    };

    PolleriaStore.saveProduct(toSave);
    setIsModalOpen(false);
  };

  const handleToggleActive = (prod: Product) => {
    PolleriaStore.saveProduct({
      ...prod,
      is_available: !prod.is_available,
    });
  };

  const handleDelete = (prodId: string) => {
    if (confirm('¿Dar de baja lógica a este producto? No se mostrará en catálogo.')) {
      PolleriaStore.deleteProduct(prodId);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Nombre', 'SKU', 'Precio Venta', 'Costo', 'Margen %', 'Stock'];
    const rows = products.map(p => [
      p.id,
      `"${p.name}"`,
      p.sku || '',
      p.sale_price,
      p.cost_price,
      p.sale_price > 0 ? (((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(1) : 0,
      p.current_stock,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_productos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = products.filter(p => {
    if (!p.active) return false;
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="bg-charcoal-900 p-4 sm:p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-fire-500 shrink-0" />
            Catálogo de Productos y Platos
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Gestión de precios, costos, márgenes, recetas y visibilidad en la tienda
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-2.5 sm:py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold border border-charcoal-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-4 py-2.5 sm:py-2 bg-fire-600 hover:bg-fire-500 text-white rounded-xl text-xs font-black shadow-glow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o ingrediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl pl-10 pr-4 py-2.5 text-base sm:text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-fire-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white font-semibold"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="md:hidden space-y-2.5">
        {filtered.map(p => {
          const margin = p.sale_price > 0 ? (((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(0) : '0';
          const cat = categories.find(c => c.id === p.category_id);

          return (
            <div key={p.id} className="bg-charcoal-900 rounded-2xl border border-charcoal-800 p-3.5 space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-14 h-14 rounded-xl object-cover bg-charcoal-950 shrink-0 border border-charcoal-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-sm leading-tight truncate">{p.name}</h3>
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        p.is_available
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {p.is_available ? 'Disponible' : 'Pausado'}
                    </button>
                  </div>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                    {cat?.name || 'General'} · <span className="capitalize">{p.product_type}</span> · {p.sku || '-'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="font-black text-white text-sm">{formatARS(p.sale_price)}</span>
                    <span className="text-charcoal-400">Costo: {formatARS(p.cost_price)}</span>
                    <span className="text-emerald-400 font-bold">{margin}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-charcoal-800/80 text-xs">
                <span className="text-charcoal-300 font-semibold">
                  Stock: <strong className="text-white">{p.current_stock} u.</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-100 font-bold text-xs"
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-charcoal-800 hover:bg-red-500/20 text-charcoal-400 hover:text-red-400 font-bold text-xs"
                    title="Baja lógica"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop & Tablet Table (md+) */}
      <div className="hidden md:block bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Plato / Producto</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Precio Venta</th>
                <th className="p-3.5">Costo</th>
                <th className="p-3.5">Margen</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {filtered.map(p => {
                const margin = p.sale_price > 0 ? (((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(0) : '0';
                const cat = categories.find(c => c.id === p.category_id);

                return (
                  <tr key={p.id} className="hover:bg-charcoal-800/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-charcoal-950 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-white block">{p.name}</span>
                          <span className="text-[10px] text-charcoal-400">{p.sku || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-charcoal-300">{cat?.name || 'General'}</td>
                    <td className="p-3.5 capitalize text-charcoal-400 font-semibold">{p.product_type}</td>
                    <td className="p-3.5 font-black text-white">{formatARS(p.sale_price)}</td>
                    <td className="p-3.5 text-charcoal-400">{formatARS(p.cost_price)}</td>
                    <td className="p-3.5">
                      <span className="text-emerald-400 font-bold">{margin}%</span>
                    </td>
                    <td className="p-3.5 font-bold text-white">{p.current_stock} u.</td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                          p.is_available
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                      >
                        {p.is_available ? 'Disponible' : 'Pausado'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-red-500/20 text-charcoal-400 hover:text-red-400"
                        title="Baja lógica"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta / Edición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-lg w-full p-4 sm:p-6 text-left shadow-2xl space-y-4 my-4 sm:my-8 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-charcoal-800">
              <h3 className="text-base sm:text-lg font-black text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto / Plato'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Nombre del Plato *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Pollo al Spiedo con Papas"
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Categoría *</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Tipo de Producto</label>
                  <select
                    value={formData.product_type}
                    onChange={e => setFormData({ ...formData, product_type: e.target.value as ProductType })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                  >
                    <option value="elaborado">Elaborado (con receta)</option>
                    <option value="simple">Simple (bebida o envasado)</option>
                    <option value="combo">Combo Promocional</option>
                    <option value="por_peso">Por Peso / Fraccionable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sale_price}
                    onChange={e => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Costo Estimado ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.cost_price}
                    onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white font-bold"
                  />
                </div>
              </div>

              {(() => {
                const saleVal = Number(formData.sale_price) || 0;
                const costVal = Number(formData.cost_price) || 0;
                const profit = saleVal - costVal;
                const marginPct = saleVal > 0 ? Math.round((profit / saleVal) * 100) : 0;
                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-charcoal-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs">
                    <span className="text-charcoal-400">Margen bruto proyectado:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-charcoal-300">Ganancia: <strong className="text-white">{formatARS(profit)}</strong></span>
                      <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                        marginPct >= 40 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        marginPct >= 20 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {marginPct}%
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <label className="font-bold text-charcoal-300 block">Foto del Plato</label>
                <div className="flex gap-3 items-center">
                  <img
                    src={formData.image_url || '/images/pollo-horno.jpg'}
                    alt="Vista previa"
                    className="w-14 h-14 rounded-xl object-cover border border-charcoal-700 bg-charcoal-950 shrink-0"
                  />
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/images/pollo-brasa-entero.jpg"
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white text-base sm:text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-charcoal-400 block mb-1.5 font-bold">Fotos reales de archivo (1 clic para elegir):</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-charcoal-950/60 rounded-xl border border-charcoal-800">
                    {PHOTO_PRESETS.map(preset => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: preset.url })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                          formData.image_url === preset.url
                            ? 'bg-fire-600 text-white border-fire-500'
                            : 'bg-charcoal-800 text-charcoal-300 border-charcoal-700 hover:bg-charcoal-700 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalle de ingredientes, marinado, etc."
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 text-white font-semibold cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.is_visible_landing}
                    onChange={e => setFormData({ ...formData, is_visible_landing: e.target.checked })}
                    className="rounded text-fire-600 focus:ring-fire-500 w-4 h-4"
                  />
                  Visible en Tienda Web
                </label>

                <label className="flex items-center gap-2 text-white font-semibold cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                    className="rounded text-fire-600 focus:ring-fire-500 w-4 h-4"
                  />
                  Disponible para Venta
                </label>
              </div>

              <div className="pt-3 border-t border-charcoal-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 sm:py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 sm:py-2 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl shadow-glow"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
