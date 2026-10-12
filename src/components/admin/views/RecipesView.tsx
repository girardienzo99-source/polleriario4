'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  UtensilsCrossed, 
  DollarSign, 
  Layers 
} from 'lucide-react';
import { Recipe, RecipeItem, Ingredient, Product } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const RecipesView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const loadData = () => {
    setRecipes(PolleriaStore.getRecipes());
    setProducts(PolleriaStore.getProducts());
    setIngredients(PolleriaStore.getIngredients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  useEffect(() => {
    if (recipes.length > 0 && !selectedRecipe) {
      setSelectedRecipe(recipes[0]);
    }
  }, [recipes, selectedRecipe]);

  const calculateRecipeCost = (recipe: Recipe) => {
    return recipe.items.reduce((acc, curr) => {
      const ing = ingredients.find(i => i.id === curr.ingredient_id);
      const unitCost = ing ? ing.cost_price : 0;
      return acc + curr.quantity * unitCost * (1 + (curr.waste_percentage || 0) / 100);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-fire-500" />
            Recetas y Fichas Técnicas de Cocina
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Descuento automático de materias primas por porción y control exacto de costos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recipes List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider block">
            Platos con Receta Registrada
          </span>

          <div className="space-y-2">
            {recipes.map(rec => {
              const isSelected = selectedRecipe?.id === rec.id;
              const prod = products.find(p => p.id === rec.product_id);
              const cost = calculateRecipeCost(rec);

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecipe(rec)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                    isSelected
                      ? 'bg-charcoal-900 border-fire-500 shadow-glow'
                      : 'bg-charcoal-900/60 border-charcoal-800 hover:bg-charcoal-900'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-white">{rec.name}</h4>
                    <span className="text-[11px] text-charcoal-400">
                      Rendimiento: {rec.yield_quantity} {prod?.unit_measure || 'u.'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-charcoal-400 block font-medium">Costo Insumos</span>
                    <span className="text-xs font-black text-emerald-400">
                      {formatARS(cost)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recipe Details & BOM Ingredients */}
        <div className="lg:col-span-8 bg-charcoal-900 rounded-3xl border border-charcoal-800 p-6 space-y-5">
          {selectedRecipe ? (
            <>
              <div className="flex justify-between items-start pb-4 border-b border-charcoal-800">
                <div>
                  <span className="text-xs font-bold text-fire-400 uppercase tracking-widest block">
                    Ficha Técnica de Producción
                  </span>
                  <h2 className="text-2xl font-black text-white">{selectedRecipe.name}</h2>
                  <p className="text-xs text-charcoal-400 mt-1">
                    Instrucciones: {selectedRecipe.instructions || 'Seguir protocolo estándar de cocción.'}
                  </p>
                </div>

                <div className="bg-charcoal-950 p-3 rounded-2xl border border-charcoal-800 text-right">
                  <span className="text-[10px] text-charcoal-400 block">Costo Teórico Total</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatARS(calculateRecipeCost(selectedRecipe))}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Insumos Requeridos por Unidad Elaborada:
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
                      <tr>
                        <th className="p-3">Insumo</th>
                        <th className="p-3">Cantidad Requerida</th>
                        <th className="p-3">Merma %</th>
                        <th className="p-3">Costo Unitario</th>
                        <th className="p-3 text-right">Subtotal Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal-800">
                      {selectedRecipe.items.map((item, idx) => {
                        const ing = ingredients.find(i => i.id === item.ingredient_id);
                        const cost = ing ? ing.cost_price * item.quantity * (1 + item.waste_percentage / 100) : 0;

                        return (
                          <tr key={idx} className="hover:bg-charcoal-800/40">
                            <td className="p-3 font-bold text-white">{ing?.name || item.ingredient_id}</td>
                            <td className="p-3 text-charcoal-200 font-semibold">
                              {item.quantity} {item.unit_measure}
                            </td>
                            <td className="p-3 text-charcoal-400">{item.waste_percentage}%</td>
                            <td className="p-3 text-charcoal-400">{formatARS(ing?.cost_price || 0)}</td>
                            <td className="p-3 text-right font-black text-white">{formatARS(cost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-charcoal-500 text-xs">
              Seleccioná una receta a la izquierda para inspeccionar sus ingredientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
