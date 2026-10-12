'use client';

import React, { useState, useEffect } from 'react';
import { Receipt, Plus, DollarSign, Calendar, Tag } from 'lucide-react';
import { Expense } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateAR } from '@/lib/formatters';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'combustible',
    concept: '',
    amount: 15000,
    payment_method: 'efectivo',
    receipt_number: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const loadData = () => {
    setExpenses(PolleriaStore.getExpenses());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.concept || !formData.amount) return;

    PolleriaStore.saveExpense({
      id: `exp-${Date.now()}`,
      business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      category: formData.category || 'otros',
      concept: formData.concept!,
      amount: Number(formData.amount) || 0,
      payment_method: formData.payment_method || 'efectivo',
      receipt_number: formData.receipt_number,
      expense_date: formData.expense_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });

    setShowModal(false);
    setFormData({
      category: 'combustible',
      concept: '',
      amount: 15000,
      payment_method: 'efectivo',
      receipt_number: '',
      expense_date: new Date().toISOString().split('T')[0],
    });
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-red-400" />
            Gastos Operativos del Comercio
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Registro de leña, carbón, electricidad, gas natural, envases, sueldos y mantenimiento
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-charcoal-400 block font-medium">Total Gastos Registrados</span>
            <span className="text-xl font-black text-red-400">{formatARS(totalExpenses)}</span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black text-xs rounded-xl shadow-glow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Concepto / Detalle</th>
                <th className="p-3.5">Medio de Pago</th>
                <th className="p-3.5">Comprobante N°</th>
                <th className="p-3.5 text-right">Monto ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-charcoal-800/40">
                  <td className="p-3.5 text-charcoal-300">{formatDateAR(exp.expense_date)}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-charcoal-800 text-charcoal-300">
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-white">{exp.concept}</td>
                  <td className="p-3.5 uppercase text-charcoal-400 text-[10px] font-semibold">{exp.payment_method}</td>
                  <td className="p-3.5 text-charcoal-400 font-mono text-[11px]">{exp.receipt_number || '-'}</td>
                  <td className="p-3.5 text-right font-black text-red-400 text-sm">
                    {formatARS(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white">Registrar Gasto Operativo</h3>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Categoría del Gasto *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                >
                  <option value="combustible">Carbón / Leña / Combustible</option>
                  <option value="servicios_luz_gas">Electricidad y Gas Natural</option>
                  <option value="envases">Envases y Bolsas Delivery</option>
                  <option value="sueldos">Sueldos y Jornales</option>
                  <option value="mantenimiento">Mantenimiento y Reparaciones</option>
                  <option value="otros">Otros Gastos Operativos</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Concepto / Detalle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 10 bolsas de carbón quebracho colorado"
                  value={formData.concept}
                  onChange={e => setFormData({ ...formData, concept: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Medio de Pago</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="efectivo">Efectivo de Caja</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="debito">Tarjeta / Débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">N° Comprobante / Factura</label>
                <input
                  type="text"
                  placeholder="REC-00129"
                  value={formData.receipt_number}
                  onChange={e => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
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
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
