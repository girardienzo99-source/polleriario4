'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Lock, 
  Unlock, 
  DollarSign, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { CashSession, CashMovement } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateTimeAR } from '@/lib/formatters';

export const CashRegisterView: React.FC = () => {
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);

  // Open session modal
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [initialFloat, setInitialFloat] = useState(25000);
  const [cashierName, setCashierName] = useState('Lucas Gómez (Cajero)');

  // Close session modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  // Manual movement modal
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movType, setMovType] = useState<'ingreso_manual' | 'retiro' | 'gasto'>('retiro');
  const [movAmount, setMovAmount] = useState<number>(5000);
  const [movConcept, setMovConcept] = useState<string>('Retiro parcial para cambio');

  const loadData = () => {
    setSession(PolleriaStore.getCashSession());
    setMovements(PolleriaStore.getCashMovements());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleOpenCash = (e: React.FormEvent) => {
    e.preventDefault();
    PolleriaStore.openCashSession(cashierName, initialFloat);
    setShowOpenModal(false);
  };

  const handleCloseCash = (e: React.FormEvent) => {
    e.preventDefault();
    PolleriaStore.closeCashSession(countedCash, closeNotes);
    setShowCloseModal(false);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    PolleriaStore.recordCashMovement({
      cash_session_id: session.id,
      movement_type: movType,
      amount: movAmount,
      payment_method: 'efectivo',
      concept: movConcept,
    });

    setShowMovementModal(false);
    setMovConcept('Retiro parcial para cambio');
  };

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            Control de Caja y Turnos
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Aperturas, ventas del turno, movimientos manuales, gastos y arqueo de cierre
          </p>
        </div>

        <div className="flex gap-2">
          {session.status === 'abierta' ? (
            <>
              <button
                onClick={() => setShowMovementModal(true)}
                className="px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 rounded-xl text-xs font-bold border border-charcoal-700 transition"
              >
                Movimiento Manual / Retiro
              </button>
              <button
                onClick={() => {
                  setCountedCash(session.expected_cash);
                  setShowCloseModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow transition active:scale-95"
              >
                <Lock className="w-4 h-4" />
                Cerrar Caja y Arqueo
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-glow transition active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              Abrir Nuevo Turno de Caja
            </button>
          )}
        </div>
      </div>

      {/* Session Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Fondo Inicial de Caja</span>
          <div className="text-2xl font-black text-white">{formatARS(session.initial_cash)}</div>
          <span className="text-[10px] text-charcoal-400">Apertura: {formatDateTimeAR(session.opened_at)}</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Ventas en Efectivo</span>
          <div className="text-2xl font-black text-emerald-400">{formatARS(session.total_sales_cash)}</div>
          <span className="text-[10px] text-charcoal-400">Directo al cajón</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Ventas Digitales (MP / Transf)</span>
          <div className="text-2xl font-black text-blue-400">{formatARS(session.total_sales_digital)}</div>
          <span className="text-[10px] text-charcoal-400">Bancarizado / QR</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Efectivo Teórico Esperado</span>
          <div className="text-2xl font-black text-fire-400">{formatARS(session.expected_cash)}</div>
          <span className="text-[10px] text-charcoal-400">
            Estado: <strong className="uppercase">{session.status}</strong>
          </span>
        </div>
      </div>

      {/* Closed Session Arqueo banner if closed */}
      {session.status === 'cerrada' && session.actual_cash !== undefined && (
        <div className="p-4 bg-charcoal-900 rounded-2xl border border-charcoal-700 flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-white block">Arqueo Registrado al Cierre:</span>
            <span className="text-charcoal-300">
              Efectivo Contado: <strong>{formatARS(session.actual_cash)}</strong> | Esperado:{' '}
              <strong>{formatARS(session.expected_cash)}</strong>
            </span>
          </div>
          <div className="text-right">
            <span className="text-charcoal-400 block text-[10px]">Diferencia de Arqueo:</span>
            <span className={`text-base font-black ${
              (session.difference || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(session.difference || 0) >= 0 ? '+' : ''}{formatARS(session.difference || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="p-5 border-b border-charcoal-800">
          <h3 className="font-black text-white text-base">Movimientos de Caja del Turno</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Hora</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Concepto</th>
                <th className="p-3.5">Medio</th>
                <th className="p-3.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {movements.map(m => (
                <tr key={m.id} className="hover:bg-charcoal-800/40">
                  <td className="p-3.5 text-charcoal-300">{formatDateTimeAR(m.created_at)}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      m.movement_type === 'venta'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : m.movement_type === 'retiro'
                        ? 'bg-amberGold-500/10 text-amberGold-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {m.movement_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-white font-medium">{m.concept}</td>
                  <td className="p-3.5 uppercase text-charcoal-400 text-[10px] font-semibold">{m.payment_method}</td>
                  <td className="p-3.5 text-right font-black text-white">{formatARS(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Cash Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              Cierre y Arqueo de Caja
            </h3>
            <p className="text-xs text-charcoal-400">
              Contá el dinero físico presente en el cajón para contrastarlo con el cálculo del sistema.
            </p>

            <form onSubmit={handleCloseCash} className="space-y-4 text-xs">
              <div className="bg-charcoal-950 p-3 rounded-2xl border border-charcoal-800 space-y-1">
                <div className="flex justify-between text-charcoal-400">
                  <span>Efectivo Teórico Esperado:</span>
                  <span className="font-bold text-white">{formatARS(session.expected_cash)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  Efectivo Real Contado en Billetes ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={countedCash}
                  onChange={e => setCountedCash(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-lg text-emerald-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex justify-between items-center">
                <span className="font-bold text-charcoal-300">Diferencia resultante:</span>
                <span className={`text-base font-black ${
                  countedCash - session.expected_cash >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {countedCash - session.expected_cash >= 0 ? '+' : ''}
                  {formatARS(countedCash - session.expected_cash)}
                </span>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Observaciones de Cierre</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de retiro para caja fuerte, fajos de billetes..."
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow"
                >
                  Confirmar y Guardar Cierre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white">Movimiento Manual de Dinero</h3>

            <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Tipo *</label>
                <select
                  value={movType}
                  onChange={e => setMovType(e.target.value as any)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white"
                >
                  <option value="retiro">Retiro / Extracción de Caja</option>
                  <option value="ingreso_manual">Ingreso Manual de Cambio</option>
                  <option value="gasto">Gasto Menor Operativo</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movAmount}
                  onChange={e => setMovAmount(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Concepto / Motivo *</label>
                <input
                  type="text"
                  required
                  value={movConcept}
                  onChange={e => setMovConcept(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Cash Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-400" />
              Apertura de Sesión de Caja
            </h3>

            <form onSubmit={handleOpenCash} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Cajero Responsable *</label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={e => setCashierName(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Fondo Inicial de Cambio ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialFloat}
                  onChange={e => setInitialFloat(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-base text-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
