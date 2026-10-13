'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  MapPin, 
  Phone, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  Save 
} from 'lucide-react';
import { Business, DeliveryZone } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { INITIAL_BUSINESS } from '@/lib/data/mock-data';
import { formatARS } from '@/lib/formatters';

import { validateCuit } from '@/lib/domain/fiscal';

export const SettingsView: React.FC = () => {
  const [business, setBusiness] = useState<Business>(INITIAL_BUSINESS);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = () => {
    setBusiness(PolleriaStore.getBusiness());
    setZones(PolleriaStore.getDeliveryZones());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validateCuit(business.cuit)) {
      setErrorMessage('El CUIT ingresado no es válido según algoritmo Módulo 11 de AFIP/ARCA.');
      return;
    }
    try {
      PolleriaStore.saveBusiness(business);
      setSavedNotice('¡Configuración del comercio guardada con éxito en el sistema!');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la configuración');
    }
  };

  const handleResetDemoData = () => {
    if (confirm('¿Restaurar todos los datos iniciales de demostración de Pollería Los Campeones?')) {
      PolleriaStore.resetToDemo();
      setSavedNotice('¡Datos de demostración restaurados!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-4 sm:p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-fire-500 shrink-0" />
            Configuración General del Negocio
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Datos fiscales, horarios, zonas de delivery y parámetros del sistema
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 sm:py-2 bg-charcoal-800 hover:bg-red-500/20 text-charcoal-300 hover:text-red-400 rounded-xl text-xs font-bold border border-charcoal-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar Datos Demo
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl animate-in fade-in">
          {savedNotice}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Store identity */}
        <div className="lg:col-span-7 bg-charcoal-900 rounded-3xl border border-charcoal-800 p-4 sm:p-6 space-y-4">
          <h3 className="font-black text-base text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-fire-500 shrink-0" />
            Identidad del Comercio Gastronómico
          </h3>

          <form onSubmit={handleSaveStore} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-charcoal-300 block mb-1">Nombre Comercial *</label>
              <input
                type="text"
                value={business.trade_name}
                onChange={e => setBusiness({ ...business, trade_name: e.target.value })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-300 block mb-1">Razón Social *</label>
              <input
                type="text"
                value={business.name}
                onChange={e => setBusiness({ ...business, name: e.target.value })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">CUIT *</label>
                <input
                  type="text"
                  value={business.cuit}
                  onChange={e => setBusiness({ ...business, cuit: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Condición Frente al IVA</label>
                <input
                  type="text"
                  value={business.iva_condition}
                  onChange={e => setBusiness({ ...business, iva_condition: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-300 block mb-1">Dirección del Local</label>
              <input
                type="text"
                value={business.address}
                onChange={e => setBusiness({ ...business, address: e.target.value })}
                className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Teléfono Fijo / Local</label>
                <input
                  type="text"
                  value={business.phone}
                  onChange={e => setBusiness({ ...business, phone: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">WhatsApp para Pedidos</label>
                <input
                  type="text"
                  value={business.whatsapp}
                  onChange={e => setBusiness({ ...business, whatsapp: e.target.value })}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-base sm:text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-5 py-3 sm:py-2.5 bg-fire-600 hover:bg-fire-500 text-white font-black rounded-xl shadow-glow text-xs"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

        {/* Right: Delivery zones */}
        <div className="lg:col-span-5 bg-charcoal-900 rounded-3xl border border-charcoal-800 p-4 sm:p-6 space-y-4">
          <h3 className="font-black text-base text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            Zonas y Tarifas de Delivery
          </h3>
          <p className="text-xs text-charcoal-400">
            Tarifas aplicadas automáticamente al seleccionar la zona en la tienda online o en pedidos
          </p>

          <div className="space-y-3">
            {zones.map(z => (
              <div
                key={z.id}
                className="bg-charcoal-950 p-3.5 rounded-2xl border border-charcoal-800 flex justify-between items-center text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{z.name}</h4>
                  <span className="text-[10px] text-charcoal-400 block">
                    Tiempo estimado: {z.estimated_minutes} min
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-emerald-400 block">
                    {formatARS(z.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-charcoal-950 rounded-2xl border border-charcoal-800 text-[11px] text-charcoal-400">
            Desarrollador Comercial: <strong>Río Cuarto Web</strong> • Río Cuarto, Córdoba, Argentina.
          </div>
        </div>
      </div>
    </div>
  );
};
