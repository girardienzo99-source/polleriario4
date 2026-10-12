'use client';

import React, { useMemo, useState } from 'react';
import { Wallet, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateTimeAR, formatTimeAR } from '@/lib/formatters';
import { closingDifference } from '@/lib/domain/cash';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, Card, StatCard, Button, Badge, EmptyState, Modal, Field, inputCls, run, useStoreVersion, Table } from '../ui';

const TYPE_LABEL: Record<string, string> = { venta: 'Venta', ingreso_manual: 'Ingreso', retiro: 'Retiro', gasto: 'Gasto', devolucion: 'Devolución' };

export const CashRegisterView: React.FC = () => {
  const v = useStoreVersion();
  const { user } = useAuth();
  const [initial, setInitial] = useState('');
  const [counted, setCounted] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);
  const [mov, setMov] = useState<{ type: 'ingreso_manual' | 'retiro'; amount: string; concept: string } | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { session, movements, history } = useMemo(() => {
    const s = PolleriaStore.getCashSession();
    return { session: s, movements: PolleriaStore.getCashMovements().filter(m => m.cash_session_id === s.id), history: PolleriaStore.getCashHistory() };
  }, [v]);

  const open = session.status === 'abierta';
  const countedNum = Number(counted.replace(',', '.'));
  const diff = counted !== '' && Number.isFinite(countedNum) && countedNum >= 0 ? closingDifference(session.expected_cash, countedNum) : null;

  return (
    <div className="space-y-5">
      <PageHeader icon={Wallet} title="Caja"
        subtitle="Los totales se recalculan a partir de cada movimiento registrado. Sin caja abierta no se puede cobrar."
        actions={open ? <>
          <Button onClick={() => setMov({ type: 'ingreso_manual', amount: '', concept: '' })}><ArrowDownCircle className="w-4 h-4 text-emerald-400" /> Ingreso</Button>
          <Button onClick={() => setMov({ type: 'retiro', amount: '', concept: '' })}><ArrowUpCircle className="w-4 h-4 text-red-400" /> Retiro</Button>
          <Button variant="danger" onClick={() => { setClosing(true); setCounted(''); setCloseNotes(''); }}><Lock className="w-4 h-4" /> Cerrar caja</Button>
        </> : undefined} />

      {!open ? (
        <Card>
          <div className="max-w-md mx-auto text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-charcoal-800 flex items-center justify-center mx-auto mb-4"><Unlock className="w-7 h-7 text-fire-400" /></div>
            <h2 className="text-lg font-black text-white">La caja está cerrada</h2>
            <p className="text-xs text-charcoal-400 mt-1 mb-5">Contá el fondo de cambio e ingresalo para abrir el turno.</p>
            <div className="flex gap-2">
              <input inputMode="decimal" value={initial} onChange={e => setInitial(e.target.value)} placeholder="Fondo inicial $" className={`${inputCls} py-3 text-sm`} />
              <Button variant="primary" className="px-6" disabled={initial === '' || !(Number(initial) >= 0)}
                onClick={() => { if (run(() => PolleriaStore.openCashSession(user?.full_name ?? 'Usuario', Number(initial)), 'Caja abierta')) setInitial(''); }}>
                Abrir caja
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Fondo inicial" value={formatARS(session.initial_cash)} />
            <StatCard label="Ventas efectivo" value={formatARS(session.total_sales_cash)} tone="green" icon={ArrowDownCircle} />
            <StatCard label="Ventas digitales" value={formatARS(session.total_sales_digital)} tone="blue" hint="Tarjetas, MP, transferencias" />
            <StatCard label="Gastos y retiros" value={formatARS(session.total_expenses + session.total_withdrawals)} tone="red" icon={ArrowUpCircle} />
            <StatCard label="Efectivo esperado" value={formatARS(session.expected_cash)} tone="fire" icon={Wallet} hint={`Abierta ${formatTimeAR(session.opened_at)} por ${session.user_name}`} />
          </div>

          <Card title={`Movimientos del turno (${movements.length})`}>
            <Table head={['Hora', 'Tipo', 'Concepto', 'Medio', 'Usuario', 'Importe']} empty={<EmptyState title="Sin movimientos todavía" />}>
              {movements.map(m => {
                const out = m.movement_type === 'retiro' || m.movement_type === 'gasto' || m.movement_type === 'devolucion';
                return (
                  <tr key={m.id} className="text-charcoal-200">
                    <td className="px-5 py-2.5 tabular-nums">{formatTimeAR(m.created_at)}</td>
                    <td className="px-5 py-2.5"><Badge tone={out ? 'red' : 'green'}>{TYPE_LABEL[m.movement_type]}</Badge></td>
                    <td className="px-5 py-2.5">{m.concept}</td>
                    <td className="px-5 py-2.5 capitalize">{m.payment_method}</td>
                    <td className="px-5 py-2.5 text-charcoal-400">{m.user_id}</td>
                    <td className={`px-5 py-2.5 text-right font-bold tabular-nums ${out ? 'text-red-300' : 'text-emerald-300'}`}>{out ? '−' : '+'}{formatARS(m.amount)}</td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        </>
      )}

      <Card title="Cierres anteriores" action={<History className="w-4 h-4 text-charcoal-500" />}>
        <Table head={['Apertura', 'Cierre', 'Responsable', 'Esperado', 'Contado', 'Diferencia']} empty={<EmptyState title="Todavía no hay cierres" />}>
          {history.map(h => (
            <tr key={h.id} className="text-charcoal-200">
              <td className="px-5 py-2.5 whitespace-nowrap">{formatDateTimeAR(h.opened_at)}</td>
              <td className="px-5 py-2.5 whitespace-nowrap">{formatDateTimeAR(h.closed_at)}</td>
              <td className="px-5 py-2.5">{h.user_name}</td>
              <td className="px-5 py-2.5 tabular-nums">{formatARS(h.expected_cash)}</td>
              <td className="px-5 py-2.5 tabular-nums">{formatARS(h.actual_cash ?? 0)}</td>
              <td className={`px-5 py-2.5 font-bold tabular-nums ${(h.difference ?? 0) === 0 ? 'text-charcoal-300' : (h.difference ?? 0) > 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatARS(h.difference ?? 0)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={!!mov} onClose={() => setMov(null)} title={mov?.type === 'retiro' ? 'Retiro de efectivo' : 'Ingreso de efectivo'} size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setMov(null)}>Cancelar</Button>
          <Button variant="primary" onClick={() => { if (mov && run(() => PolleriaStore.recordCashMovement({ movement_type: mov.type, amount: Number(mov.amount.replace(',', '.')), payment_method: 'efectivo', concept: mov.concept }), 'Movimiento registrado')) setMov(null); }}>Registrar</Button>
        </>}>
        {mov && <div className="space-y-3">
          <Field label="Importe"><input autoFocus inputMode="decimal" value={mov.amount} onChange={e => setMov({ ...mov, amount: e.target.value })} className={inputCls} /></Field>
          <Field label="Concepto (obligatorio)"><input value={mov.concept} onChange={e => setMov({ ...mov, concept: e.target.value })} className={inputCls} placeholder={mov.type === 'retiro' ? 'Ej.: depósito bancario' : 'Ej.: refuerzo de cambio'} /></Field>
        </div>}
      </Modal>

      <Modal open={closing} onClose={() => setClosing(false)} title="Cierre de caja (arqueo)" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setClosing(false)}>Cancelar</Button>
          <Button variant="danger" disabled={diff === null} onClick={() => { if (run(() => PolleriaStore.closeCashSession(countedNum, closeNotes), 'Caja cerrada')) setClosing(false); }}>Cerrar caja</Button>
        </>}>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-charcoal-400">Efectivo esperado</span><span className="font-black text-white">{formatARS(session.expected_cash)}</span></div>
          <Field label="Efectivo contado"><input autoFocus inputMode="decimal" value={counted} onChange={e => setCounted(e.target.value)} className={inputCls} /></Field>
          {diff !== null && (
            <div className={`rounded-xl px-3 py-2 text-sm font-bold ${diff === 0 ? 'bg-emerald-500/10 text-emerald-300' : diff > 0 ? 'bg-sky-500/10 text-sky-300' : 'bg-red-500/10 text-red-300'}`}>
              {diff === 0 ? 'Sin diferencias' : diff > 0 ? `Sobrante ${formatARS(diff)}` : `Faltante ${formatARS(-diff)}`}
            </div>
          )}
          <Field label="Observaciones"><textarea rows={2} value={closeNotes} onChange={e => setCloseNotes(e.target.value)} className={inputCls} /></Field>
        </div>
      </Modal>
    </div>
  );
};
