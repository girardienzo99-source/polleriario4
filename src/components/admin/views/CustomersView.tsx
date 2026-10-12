'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, MapPin, Mail, FileText } from 'lucide-react';
import { Customer } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS } from '@/lib/formatters';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    doc_type: 'DNI',
    doc_number: '',
    iva_condition: 'Consumidor Final',
    notes: '',
  });

  const loadData = () => {
    setCustomers(PolleriaStore.getCustomers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) return;

    PolleriaStore.saveCustomer({
      id: `cust-${Date.now()}`,
      business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      full_name: formData.full_name!,
      phone: formData.phone!,
      email: formData.email,
      address: formData.address,
      doc_type: formData.doc_type || 'DNI',
      doc_number: formData.doc_number,
      iva_condition: formData.iva_condition || 'Consumidor Final',
      total_orders: 0,
      total_spent: 0,
      notes: formData.notes,
      created_at: new Date().toISOString(),
    });

    setShowModal(false);
  };

  const filtered = customers.filter(c => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-fire-500" />
            Base de Clientes y Fidelización
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Historial de consumos, direcciones de entrega frecuentes y condición fiscal
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black text-xs rounded-xl shadow-glow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o dirección..."
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
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Teléfono Celular</th>
                <th className="p-3.5">Dirección Habitual</th>
                <th className="p-3.5">Documento / CUIT</th>
                <th className="p-3.5">Cond. IVA</th>
                <th className="p-3.5">Pedidos Realizados</th>
                <th className="p-3.5 text-right">Total Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-charcoal-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{c.full_name}</td>
                  <td className="p-3.5 text-charcoal-300 font-medium">{c.phone}</td>
                  <td className="p-3.5 text-charcoal-400">{c.address || '-'}</td>
                  <td className="p-3.5 text-charcoal-400 font-mono text-[11px]">{c.doc_number || '-'}</td>
                  <td className="p-3.5 text-charcoal-300">{c.iva_condition || 'Consumidor Final'}</td>
                  <td className="p-3.5 font-bold text-white">{c.total_orders} pedidos</td>
                  <td className="p-3.5 text-right font-black text-emerald-400">
                    {formatARS(c.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white">Registrar Nuevo Cliente</h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Teléfono Móvil *</label>
                <input
                  type="tel"
                  required
                  placeholder="+54 9 358 ..."
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  placeholder="Calle, número, piso, depto"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Doc / CUIT</label>
                  <input
                    type="text"
                    value={formData.doc_number}
                    onChange={e => setFormData({ ...formData, doc_number: e.target.value })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal-300 block mb-1">Condición IVA</label>
                  <select
                    value={formData.iva_condition}
                    onChange={e => setFormData({ ...formData, iva_condition: e.target.value })}
                    className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Consumidor Final">Consumidor Final</option>
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                  </select>
                </div>
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
