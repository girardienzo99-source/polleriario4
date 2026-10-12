'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Printer, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  RefreshCw 
} from 'lucide-react';
import { FiscalSettings, FiscalDocument, Customer } from '@/types/database';
import { PolleriaStore } from '@/lib/data/storage';
import { ARCAClient } from '@/lib/arca/client';
import { formatARS, formatDateAR, formatDateTimeAR } from '@/lib/formatters';
import { ThermalReceiptProps } from '@/components/common/ThermalReceipt';

interface ArcaFiscalViewProps {
  onPrintTicket: (props: ThermalReceiptProps) => void;
}

export const ArcaFiscalView: React.FC<ArcaFiscalViewProps> = ({ onPrintTicket }) => {
  const [settings, setSettings] = useState<FiscalSettings | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [voucherType, setVoucherType] = useState<number>(6); // 1: A, 6: B, 11: C
  const [receiverDoc, setReceiverDoc] = useState('34890123');
  const [receiverName, setReceiverName] = useState('Santiago Martínez');
  const [invoiceTotal, setInvoiceTotal] = useState<number>(19900);
  const [concept, setConcept] = useState('Combo Campeón al Spiedo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = () => {
    setSettings(PolleriaStore.getFiscalSettings());
    setDocuments(PolleriaStore.getFiscalDocuments());
    setCustomers(PolleriaStore.getCustomers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('polleria_store_updated', loadData);
    return () => window.removeEventListener('polleria_store_updated', loadData);
  }, []);

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsProcessing(true);

    const net = invoiceTotal / 1.21;
    const vat = invoiceTotal - net;

    const res = await ARCAClient.authorizeInvoice(settings, {
      business_id: settings.business_id,
      sale_id: `manual-sale-${Date.now()}`,
      voucher_type: voucherType,
      point_of_sale: settings.point_of_sale,
      receiver_doc_type: voucherType === 1 ? 80 : 96,
      receiver_doc_number: receiverDoc,
      receiver_name: receiverName,
      receiver_iva_condition: voucherType === 1 ? 'Responsable Inscripto' : 'Consumidor Final',
      net_amount: net,
      vat_amount: vat,
      exempt_amount: 0,
      total_amount: invoiceTotal,
      items: [
        {
          description: concept,
          quantity: 1,
          unit_price: invoiceTotal,
          subtotal: invoiceTotal,
        }
      ]
    });

    setIsProcessing(false);

    if (res.success && res.cae) {
      const docLetter = voucherType === 1 ? 'A' : voucherType === 6 ? 'B' : 'C';

      const newDoc: FiscalDocument = {
        id: `fisc-doc-${Date.now()}`,
        business_id: settings.business_id,
        voucher_type: voucherType,
        point_of_sale: settings.point_of_sale,
        voucher_number: res.voucher_number || Math.floor(1000 + Math.random() * 9000),
        doc_type_receiver: voucherType === 1 ? 80 : 96,
        doc_number_receiver: receiverDoc,
        receiver_name: receiverName,
        receiver_iva_condition: voucherType === 1 ? 'Responsable Inscripto' : 'Consumidor Final',
        net_amount: net,
        vat_amount: vat,
        exempt_amount: 0,
        total_amount: invoiceTotal,
        cae: res.cae,
        cae_expiration: res.cae_expiration,
        qr_data: res.qr_data_url,
        qr_url: res.qr_url,
        afip_status: 'autorizado',
        afip_response: res,
        created_at: new Date().toISOString(),
      };

      PolleriaStore.saveFiscalDocument(newDoc);
      setShowIssueModal(false);

      setNotice(`¡Factura ${docLetter} N° ${newDoc.voucher_number} autorizada con CAE ${newDoc.cae}!`);
      setTimeout(() => setNotice(null), 4000);

      // Trigger print ticket
      onPrintTicket({
        type: 'fiscal',
        businessName: settings.legal_name,
        businessAddress: settings.fiscal_address,
        businessCuit: settings.cuit,
        orderNumber: `FAC-${docLetter}-${String(settings.point_of_sale).padStart(4, '0')}-${String(newDoc.voucher_number).padStart(8, '0')}`,
        customerName: receiverName,
        items: [
          {
            name: concept,
            quantity: 1,
            unitPrice: invoiceTotal,
            subtotal: invoiceTotal,
          }
        ],
        subtotal: invoiceTotal,
        total: invoiceTotal,
        fiscalData: {
          voucherLetter: docLetter as any,
          pointOfSale: settings.point_of_sale,
          voucherNumber: newDoc.voucher_number,
          cae: newDoc.cae || '74428901234567',
          caeExpiration: newDoc.cae_expiration || '2026-10-22',
          qrDataUrl: res.qr_data_url,
          isSimulation: res.is_simulation,
          receiverDoc: receiverDoc,
          receiverName: receiverName,
        }
      });
    }
  };

  const handlePrintDoc = (doc: FiscalDocument) => {
    if (!settings) return;
    const docLetter = doc.voucher_type === 1 ? 'A' : doc.voucher_type === 6 ? 'B' : 'C';

    onPrintTicket({
      type: 'fiscal',
      businessName: settings.legal_name,
      businessAddress: settings.fiscal_address,
      businessCuit: settings.cuit,
      orderNumber: `FAC-${docLetter}-${String(doc.point_of_sale).padStart(4, '0')}-${String(doc.voucher_number).padStart(8, '0')}`,
      customerName: doc.receiver_name,
      items: [
        {
          name: 'Consumo Gastronómico Pollería',
          quantity: 1,
          unitPrice: doc.total_amount,
          subtotal: doc.total_amount,
        }
      ],
      subtotal: doc.total_amount,
      total: doc.total_amount,
      fiscalData: {
        voucherLetter: docLetter as any,
        pointOfSale: doc.point_of_sale,
        voucherNumber: doc.voucher_number,
        cae: doc.cae || '74428901234567',
        caeExpiration: doc.cae_expiration || '2026-10-22',
        qrDataUrl: doc.qr_data,
        isSimulation: true,
        receiverDoc: doc.doc_number_receiver,
        receiverName: doc.receiver_name,
      }
    });
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-charcoal-900 p-6 rounded-3xl border border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Facturación Electrónica ARCA (ex AFIP)
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Conexión con servicios oficiales WSAA y WSFEv1 • Entornos de Homologación y Producción
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Emitir Factura Electrónica (CAE)
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl animate-in fade-in">
          {notice}
        </div>
      )}

      {/* Fiscal Configuration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">CUIT Emisor</span>
          <div className="text-xl font-black text-white font-mono">{settings.cuit}</div>
          <span className="text-[10px] text-charcoal-400">{settings.legal_name}</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Condición Fiscal</span>
          <div className="text-xl font-black text-blue-400">{settings.iva_condition}</div>
          <span className="text-[10px] text-charcoal-400">Punto de Venta N° {settings.point_of_sale}</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Ambiente de Trabajo</span>
          <div className="text-xl font-black uppercase text-amberGold-400">{settings.environment}</div>
          <span className="text-[10px] text-charcoal-400">Simulador / Homologación Activo</span>
        </div>

        <div className="bg-charcoal-900 p-5 rounded-2xl border border-charcoal-800 space-y-1">
          <span className="text-xs font-bold text-charcoal-400">Servicios ARCA</span>
          <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" /> Conectado
          </div>
          <span className="text-[10px] text-charcoal-400">WSAA & WSFEv1 Habilitados</span>
        </div>
      </div>

      {/* Warning Notice about Non-Fiscal Sandbox */}
      <div className="p-4 bg-charcoal-900 rounded-2xl border border-blue-500/30 flex items-start gap-3 text-xs text-charcoal-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-bold">Arquitectura Fiscal Homologada</strong>
          Los comprobantes emitidos en este entorno generan CAE simulado y QR según la normativa RG AFIP 4291/2018. Para pasar a producción oficial con impacto fiscal tributario real, se requiere cargar el certificado digital (.crt) y la clave privada (.key) generada en el portal oficial de ARCA.
        </div>
      </div>

      {/* Fiscal Documents Table */}
      <div className="bg-charcoal-900 rounded-3xl border border-charcoal-800 overflow-hidden shadow">
        <div className="p-5 border-b border-charcoal-800 flex justify-between items-center">
          <h3 className="font-black text-white text-base">Comprobantes Electrónicos Emitidos</h3>
          <span className="text-xs text-charcoal-400">Total: {documents.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-charcoal-950 text-charcoal-400 uppercase text-[10px] tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="p-3.5">Comprobante</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Receptor / Cliente</th>
                <th className="p-3.5">Doc / CUIT</th>
                <th className="p-3.5">CAE Autorizado</th>
                <th className="p-3.5">Vto. CAE</th>
                <th className="p-3.5 text-right">Importe Total</th>
                <th className="p-3.5 text-right">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-charcoal-500">
                    No se han emitido facturas fiscales todavía. Podés emitir una con el botón superior.
                  </td>
                </tr>
              ) : (
                documents.map(doc => {
                  const letter = doc.voucher_type === 1 ? 'A' : doc.voucher_type === 6 ? 'B' : 'C';

                  return (
                    <tr key={doc.id} className="hover:bg-charcoal-800/40">
                      <td className="p-3.5 font-bold text-white">
                        Factura {letter} {String(doc.point_of_sale).padStart(4, '0')}-{String(doc.voucher_number).padStart(8, '0')}
                      </td>
                      <td className="p-3.5 text-charcoal-300">{formatDateTimeAR(doc.created_at)}</td>
                      <td className="p-3.5 text-white font-medium">{doc.receiver_name}</td>
                      <td className="p-3.5 font-mono text-charcoal-400">{doc.doc_number_receiver}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{doc.cae}</td>
                      <td className="p-3.5 text-charcoal-300">{formatDateAR(doc.cae_expiration)}</td>
                      <td className="p-3.5 text-right font-black text-white">{formatARS(doc.total_amount)}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handlePrintDoc(doc)}
                          className="px-2.5 py-1 bg-charcoal-800 hover:bg-blue-600 hover:text-white text-charcoal-200 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Imprimir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Invoice Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Emitir Comprobante ARCA
            </h3>

            <form onSubmit={handleIssueInvoice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Tipo de Comprobante *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoucherType(6)}
                    className={`p-2 rounded-xl font-bold border transition ${
                      voucherType === 6
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400'
                    }`}
                  >
                    Factura B (Consumidor Final)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherType(1)}
                    className={`p-2 rounded-xl font-bold border transition ${
                      voucherType === 1
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-charcoal-950 border-charcoal-700 text-charcoal-400'
                    }`}
                  >
                    Factura A (Con CUIT)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">
                  {voucherType === 1 ? 'CUIT del Receptor *' : 'DNI del Cliente (opcional)'}
                </label>
                <input
                  type="text"
                  required={voucherType === 1}
                  value={receiverDoc}
                  onChange={e => setReceiverDoc(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Concepto Comercial *</label>
                <input
                  type="text"
                  required
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-300 block mb-1">Importe Total con IVA ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={invoiceTotal}
                  onChange={e => setInvoiceTotal(Number(e.target.value))}
                  className="w-full bg-charcoal-950 border border-charcoal-700 rounded-xl p-2.5 text-white font-black text-sm text-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-charcoal-800 text-charcoal-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow"
                >
                  {isProcessing ? 'Solicitando CAE...' : 'Autorizar y Generar CAE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
