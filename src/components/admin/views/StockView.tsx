'use client';

import React, { useMemo, useState } from 'react';
import { Boxes, Search, Plus, SlidersHorizontal, History, AlertTriangle, Package } from 'lucide-react';
import { Ingredient } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { formatARS, formatDateTimeAR } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { canDo } from '@/lib/domain/permissions';
import { PageHeader, Card, StatCard, Button, Badge, EmptyState, Modal, Field, inputCls, run, useStoreVersion, Table } from '../ui';

const REASONS_OUT = ['Merma', 'Rotura', 'Vencimiento', 'Consumo interno', 'Ajuste por inventario físico'];
const REASONS_IN = ['Ingreso sin factura', 'Devolución', 'Ajuste por inventario físico'];

type Adjust = { kind: 'ingredient' | 'product'; id: string; name: string; unit: string; current: number; direction: 'in' | 'out' | 'count'; qty: string; reason: string; reference: string };

export const StockView: React.FC = () => {
  const v = useStoreVersion();
  const { role } = useAuth();
  const canAdjust = canDo(role, 'adjust_stock');
  const [tab, setTab] = useState<'insumos' | 'productos' | 'movimientos'>('insumos');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjust, setAdjust] = useState<Adjust | null>(null);
  const [newIng, setNewIng] = useState<Ingredient | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { ingredients, products, movements } = useMemo(() => ({
    ingredients: PolleriaStore.getIngredients(),
    products: PolleriaStore.getProducts().filter(p => p.active && (p.stock_mode === 'batch' || p.stock_mode === 'simple')),
    movements: PolleriaStore.getInventoryMovements(),
  }), [v]);

  const q = search.trim().toLowerCase();
  const ingList = ingredients
    .filter(i => !lowStockOnly || i.current_stock <= i.min_stock)
    .filter(i => !q || i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q));
  const prodList = products
    .filter(p => !lowStockOnly || p.current_stock <= p.min_stock)
    .filter(p => !q || p.name.toLowerCase().includes(q));
  const low = ingredients.filter(i => i.current_stock <= i.min_stock).length + products.filter(p => p.current_stock <= p.min_stock).length;
  const value = ingredients.reduce((a, i) => a + i.current_stock * i.cost_price, 0);

  const submitAdjust = () => {
    if (!adjust) return;
    const n = Number(adjust.qty.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return;
    const delta = adjust.direction === 'in' ? n : adjust.direction === 'out' ? -n : Math.round((n - adjust.current) * 1000) / 1000;
    if (delta === 0) { setAdjust(null); return; }
    const reason = adjust.direction === 'count' ? 'Ajuste por inventario físico' : adjust.reason;
    const fn = adjust.kind === 'ingredient' ? PolleriaStore.adjustIngredientStock.bind(PolleriaStore) : PolleriaStore.adjustProductStock.bind(PolleriaStore);
    if (run(() => fn(adjust.id, delta, reason, adjust.reference || undefined), 'Movimiento registrado')) setAdjust(null);
  };

  const open = (kind: Adjust['kind'], id: string, name: string, unit: string, current: number, direction: Adjust['direction']) =>
    setAdjust({ kind, id, name, unit, current, direction, qty: direction === 'count' ? String(current) : '', reason: direction === 'in' ? REASONS_IN[0] : REASONS_OUT[0], reference: '' });

  const row = (kind: Adjust['kind'], id: string, name: string, unit: string, current: number, min: number, extra?: React.ReactNode) => (
    <tr key={id} className="text-charcoal-200">
      <td className="px-5 py-2.5"><p className="font-bold text-white">{name}</p>{extra}</td>
      <td className="px-5 py-2.5 tabular-nums font-black text-white">{current} <span className="text-charcoal-500 font-normal">{unit}</span></td>
      <td className="px-5 py-2.5 tabular-nums">{min}</td>
      <td className="px-5 py-2.5">{current <= 0 ? <Badge tone="red">Sin stock</Badge> : current <= min ? <Badge tone="amber">Bajo mínimo</Badge> : <Badge tone="green">OK</Badge>}</td>
      <td className="px-5 py-2.5 text-right whitespace-nowrap">
        {canAdjust ? <div className="inline-flex gap-1">
          <Button variant="ghost" onClick={() => open(kind, id, name, unit, current, 'in')}>+ Entrada</Button>
          <Button variant="ghost" onClick={() => open(kind, id, name, unit, current, 'out')}>− Salida</Button>
          <Button variant="ghost" onClick={() => open(kind, id, name, unit, current, 'count')}><SlidersHorizontal className="w-3.5 h-3.5" /> Contar</Button>
        </div> : <span className="text-[10px] text-charcoal-500">Sólo lectura</span>}
      </td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <PageHeader icon={Boxes} title="Stock e inventario"
        subtitle="Cada movimiento queda registrado con motivo, usuario, fecha y referencia. No se permite stock negativo."
        actions={canAdjust ? <Button variant="primary" onClick={() => setNewIng({ id: '', business_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: '', sku: '', unit_measure: 'kg', current_stock: 0, min_stock: 0, cost_price: 0, is_alert_active: true })}><Plus className="w-4 h-4" /> Nuevo insumo</Button> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Insumos" value={ingredients.length} icon={Boxes} />
        <StatCard label="Productos con stock" value={products.length} icon={Package} />
        <StatCard label="Bajo mínimo" value={low} icon={AlertTriangle} tone={low ? 'amber' : 'green'} />
        <StatCard label="Valorizado (insumos)" value={formatARS(value)} tone="fire" hint="Stock × último costo" />
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex rounded-xl bg-charcoal-900 border border-charcoal-800 p-1">
          {([['insumos', 'Insumos'], ['productos', 'Productos terminados'], ['movimientos', 'Movimientos']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === k ? 'bg-fire-600 text-white' : 'text-charcoal-300 hover:text-white'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          {tab !== 'movimientos' && (
            <>
              <button
                type="button"
                onClick={() => setLowStockOnly(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  lowStockOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-charcoal-900 text-charcoal-400 border-charcoal-800 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Solo bajo mínimo</span>
                {low > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/30 text-[10px] font-black">{low}</span>}
              </button>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU" className={`${inputCls} pl-9`} />
              </div>
            </>
          )}
        </div>
      </div>

      {tab === 'insumos' && (
        <Card>
          <Table head={['Insumo', 'Stock', 'Mínimo', 'Estado', '']} empty={<EmptyState title="Sin insumos" />}>
            {ingList.map(i => row('ingredient', i.id, i.name, i.unit_measure, i.current_stock, i.min_stock, <p className="text-[10px] text-charcoal-500">{i.sku} · {formatARS(i.cost_price)}/{i.unit_measure}</p>))}
          </Table>
        </Card>
      )}
      {tab === 'productos' && (
        <Card>
          <p className="text-[11px] text-charcoal-400 mb-3">Productos que se venden desde stock terminado (tandas, elaborados por adelantado y bebidas). Los elaborados al momento consumen su receta en cada venta.</p>
          <Table head={['Producto', 'Stock', 'Mínimo', 'Estado', '']} empty={<EmptyState title="Sin productos con stock" />}>
            {prodList.map(p => row('product', p.id, p.name, p.unit_measure, p.current_stock, p.min_stock, <p className="text-[10px] text-charcoal-500">{p.stock_mode === 'batch' ? 'Producción propia' : 'Reventa'}</p>))}
          </Table>
        </Card>
      )}
      {tab === 'movimientos' && (
        <Card title="Historial de movimientos" action={<History className="w-4 h-4 text-charcoal-500" />}>
          <Table head={['Fecha', 'Ítem', 'Cantidad', 'Stock final', 'Motivo', 'Referencia', 'Usuario']} empty={<EmptyState title="Todavía no hay movimientos" text="Ventas, pedidos, tandas, compras y ajustes generan movimientos automáticamente." />}>
            {movements.slice(0, 300).map(m => (
              <tr key={m.id} className="text-charcoal-200">
                <td className="px-5 py-2 whitespace-nowrap">{formatDateTimeAR(m.created_at)}</td>
                <td className="px-5 py-2">{m.item_name}</td>
                <td className={`px-5 py-2 tabular-nums font-bold ${m.delta < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{m.delta > 0 ? '+' : ''}{m.delta}</td>
                <td className="px-5 py-2 tabular-nums">{m.stock_after}</td>
                <td className="px-5 py-2">{m.reason}</td>
                <td className="px-5 py-2 text-charcoal-400">{m.reference ?? '—'}</td>
                <td className="px-5 py-2 text-charcoal-400">{m.user_name}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal open={!!adjust} onClose={() => setAdjust(null)} title={adjust ? `${adjust.direction === 'in' ? 'Entrada' : adjust.direction === 'out' ? 'Salida' : 'Conteo físico'} — ${adjust.name}` : ''} size="sm"
        footer={<><Button variant="ghost" onClick={() => setAdjust(null)}>Cancelar</Button><Button variant="primary" onClick={submitAdjust}>Registrar</Button></>}>
        {adjust && <div className="space-y-3">
          <p className="text-xs text-charcoal-400">Stock actual: <b className="text-white">{adjust.current} {adjust.unit}</b></p>
          <Field label={adjust.direction === 'count' ? `Cantidad contada (${adjust.unit})` : `Cantidad (${adjust.unit})`}><input autoFocus inputMode="decimal" value={adjust.qty} onChange={e => setAdjust({ ...adjust, qty: e.target.value })} className={inputCls} /></Field>
          {adjust.direction !== 'count' && <Field label="Motivo"><select value={adjust.reason} onChange={e => setAdjust({ ...adjust, reason: e.target.value })} className={inputCls}>{(adjust.direction === 'in' ? REASONS_IN : REASONS_OUT).map(r => <option key={r}>{r}</option>)}</select></Field>}
          <Field label="Referencia (opcional)"><input value={adjust.reference} onChange={e => setAdjust({ ...adjust, reference: e.target.value })} className={inputCls} placeholder="N° de remito, lote, etc." /></Field>
        </div>}
      </Modal>

      <Modal open={!!newIng} onClose={() => setNewIng(null)} title="Nuevo insumo"
        footer={<><Button variant="ghost" onClick={() => setNewIng(null)}>Cancelar</Button><Button variant="primary" disabled={!newIng?.name.trim()} onClick={() => { if (newIng && run(() => PolleriaStore.saveIngredient({ ...newIng, id: `ing-${Date.now().toString(36)}` }), 'Insumo creado')) setNewIng(null); }}>Crear</Button></>}>
        {newIng && <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nombre"><input value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} className={inputCls} /></Field>
          <Field label="SKU"><input value={newIng.sku} onChange={e => setNewIng({ ...newIng, sku: e.target.value })} className={inputCls} /></Field>
          <Field label="Unidad"><select value={newIng.unit_measure} onChange={e => setNewIng({ ...newIng, unit_measure: e.target.value })} className={inputCls}>{['kg', 'l', 'unidad', 'g', 'ml'].map(u => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Stock mínimo"><input type="number" min={0} value={newIng.min_stock} onChange={e => setNewIng({ ...newIng, min_stock: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} /></Field>
          <Field label="Costo por unidad"><input type="number" min={0} value={newIng.cost_price} onChange={e => setNewIng({ ...newIng, cost_price: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} /></Field>
        </div>}
        <p className="text-[11px] text-charcoal-500 mt-3">El stock inicial se carga después con una entrada o compra, para que quede trazado.</p>
      </Modal>
    </div>
  );
};
