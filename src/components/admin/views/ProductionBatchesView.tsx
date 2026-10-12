'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Check, 
  Layers 
} from 'lucide-react';
import { ProductionBatch } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatTimeAR } from '@/lib/formatters';

export const ProductionBatchesView: React.FC = () => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [rawQuantity, setRawQuantity] = useState(15);
  const [operator, setOperator] = useState('Carlos Maidana (Spiedo)');
  const [notes, setNotes] = useState('');
  const [markReadyBatch, setMarkReadyBatch] = useState<ProductionBatch | null>(null);
  const [cookedQty, setCookedQty] = useState(15);
  const [wasteQty, setWasteQty] = useState(0);

  const loadBatches = () => {
    setBatches(PolleriaStore.getBatches());
  };

  useEffect(() => {
    loadBatches();
    window.addEventListener('polleria_store_updated', loadBatches);
    return () => window.removeEventListener('polleria_store_updated', loadBatches);
  }, []);

  const handleStartBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      branch_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      batch_number: `TANDA-${batches.length + 1}-HOY`,
      start_time: new Date().toISOString(),
      estimated_end_time: new Date(Date.now() + 80 * 60 * 1000).toISOString(),
      raw_chicken_quantity: rawQuantity,
      cooked_quantity: 0,
      sold_quantity: 0,
      leftover_quantity: 0,
      waste_quantity: 0,
      status: 'en_horno',
      operator_name: operator,
      notes: notes,
      created_at: new Date().toISOString(),
    };

    PolleriaStore.saveBatch(newBatch);
    setShowModal(false);
    setNotes('');
  };

  const handleFinishCooking = () => {
    if (!markReadyBatch) return;
    PolleriaStore.markBatchReady(markReadyBatch.id, cookedQty, wasteQty);
    setMarkReadyBatch(null);
  };

  // Metrics
  const activeBatchesInOven = batches.filter(b => b.status === 'en_horno');
  const readyBatches = batches.filter(b => b.status === 'listo');
  const totalCookedAvailable = readyBatches.reduce((acc, curr) => acc + (curr.cooked_quantity - curr.sold_quantity), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-fire-500" />
            Producción de Pollos (Spiedo y Horno)
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Gestión de tandas de cocción a fuego lento, stock de pollos listos y mermas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fire-600 to-crimson-600 hover:from-fire-500 hover:to-crimson-500 text-white font-black text-xs rounded-xl shadow-glow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nueva Tanda de Spiedo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Pollos Listos para la Venta</span>
          <div className="text-3xl font-black text-emerald-400">{totalCookedAvailable} u.</div>
          <span className="text-[11px] text-charcoal-400">Disponibles en el mostrador</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Tandas al Fuego (Horno/Spiedo)</span>
          <div className="text-3xl font-black text-fire-400">{activeBatchesInOven.length}</div>
          <span className="text-[11px] text-charcoal-400">
            {activeBatchesInOven.reduce((acc, c) => acc + c.raw_chicken_quantity, 0)} pollos cocinándose
          </span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Total Horneados en la Jornada</span>
          <div className="text-3xl font-black text-white">
            {batches.reduce((acc, c) => acc + c.cooked_quantity, 0)} u.
          </div>
          <span className="text-[11px] text-charcoal-400">Cumplimiento de demanda</span>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden">
        <div className="p-5 border-b border-charcoal-800">
          <h3 className="font-black text-white text-base">Historial y Control de Tandas</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">N° Tanda</th>
                <th className="p-3.5">Hora Inicio</th>
                <th className="p-3.5">Hora Estimada</th>
                <th className="p-3.5">Ingresados</th>
                <th className="p-3.5">Salidos Listos</th>
                <th className="p-3.5">Vendidos</th>
                <th className="p-3.5">Mermas</th>
                <th className="p-3.5">Responsable</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {batches.map(batch => (
                <tr key={batch.id} className="hover:bg-charcoal-800/40 transition">
                  <td className="p-3.5 font-bold text-white">{batch.batch_number}</td>
                  <td className="p-3.5 text-charcoal-300">{formatTimeAR(batch.start_time)}</td>
                  <td className="p-3.5 text-charcoal-300">
                    {batch.actual_end_time ? (
                      <span className="text-emerald-400 font-bold">{formatTimeAR(batch.actual_end_time)} (finalizada)</span>
                    ) : (
                      formatTimeAR(batch.estimated_end_time)
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-white">{batch.raw_chicken_quantity} u.</td>
                  <td className="p-3.5 font-black text-emerald-400">
                    {batch.cooked_quantity > 0 ? `${batch.cooked_quantity} u.` : '-'}
                  </td>
                  <td className="p-3.5 text-charcoal-300">{batch.sold_quantity} u.</td>
                  <td className="p-3.5 text-red-400 font-bold">{batch.waste_quantity} u.</td>
                  <td className="p-3.5 text-charcoal-300">{batch.operator_name || '-'}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      batch.status === 'en_horno'
                        ? 'bg-fire-600/20 text-fire-400 border border-fire-500/30 animate-pulse'
                        : batch.status === 'listo'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-charcoal-800 text-charcoal-400'
                    }`}>
                      {batch.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {batch.status === 'en_horno' && (
                      <button
                        onClick={() => {
                          setMarkReadyBatch(batch);
                          setCookedQty(batch.raw_chicken_quantity);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition active:scale-95"
                      >
                        Marcar Salida
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start New Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-fire-500" />
              Iniciar Nueva Tanda de Spiedo
            </h3>
            <p className="text-xs text-charcoal-400">
              Descontará automáticamente los pollos crudos del inventario de insumos.
            </p>

            <form onSubmit={handleStartBatch} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Cantidad de Pollos Crudos a Colocar *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={rawQuantity}
                  onChange={e => setRawQuantity(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-base"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Responsable del Spiedo / Horno *
                </label>
                <input
                  type="text"
                  required
                  value={operator}
                  onChange={e => setOperator(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Observaciones de la tanda
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Fuego medio, leña de quebracho, adobo suave..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
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
                  className="px-5 py-2 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl shadow-glow"
                >
                  Confirmar e Ingresar al Horno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Batch Ready Modal */}
      {markReadyBatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Registrar Salida de Cocción ({markReadyBatch.batch_number})
            </h3>
            <p className="text-xs text-charcoal-400">
              Ingresará los pollos terminados al stock disponible para la venta sin volver a descontar materias primas.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Pollos Cocinados Listos Óptimos *
                </label>
                <input
                  type="number"
                  min="0"
                  max={markReadyBatch.raw_chicken_quantity}
                  value={cookedQty}
                  onChange={e => setCookedQty(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-base"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Mermas / Desperdicios / Dañados
                </label>
                <input
                  type="number"
                  min="0"
                  value={wasteQty}
                  onChange={e => setWasteQty(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-base text-red-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMarkReadyBatch(null)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinishCooking}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
                >
                  Guardar y Habilitar Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
