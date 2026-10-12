import QRCode from 'qrcode';
import { FiscalSettings } from '@/types/database';
import { buildArcaQrUrl, validateCuit } from '@/lib/domain/fiscal';

export interface ARCAInvoiceRequest {
  business_id: string;
  sale_id: string;
  voucher_type: number; // 1: Fac A, 6: Fac B, 11: Fac C
  point_of_sale: number;
  receiver_doc_type: number; // 80: CUIT, 96: DNI, 99: Sin identificar
  receiver_doc_number: string;
  receiver_name: string;
  receiver_iva_condition: string;
  net_amount: number;
  vat_amount: number;
  exempt_amount: number;
  total_amount: number;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

export interface ARCAInvoiceResponse {
  success: boolean;
  /** true = documento generado localmente SIN validez fiscal. */
  is_simulation: boolean;
  cae?: string;
  cae_expiration?: string;
  voucher_number?: number;
  qr_data_url?: string;
  qr_url?: string;
  error?: string;
  observations?: string[];
}

/** Estado real de la integración. Mientras no exista backend WSAA/WSFEv1, siempre es 'no_configurado'. */
export type ArcaIntegrationStatus = 'no_configurado' | 'homologacion' | 'produccion';

export const ARCA_INTEGRATION_STATUS: ArcaIntegrationStatus = 'no_configurado';

export const ARCAClient = {
  status(): ArcaIntegrationStatus {
    return ARCA_INTEGRATION_STATUS;
  },

  /** Renderiza el QR fiscal. Sólo posible con un CAE real. */
  async renderQRCodeDataUrl(qrUrl: string): Promise<string> {
    return QRCode.toDataURL(qrUrl, { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
  },

  /**
   * Emite un comprobante.
   *
   * La autorización real requiere un backend (Route Handler) con el certificado
   * X.509 del contribuyente que firme el TRA para WSAA y llame a FECAESolicitar
   * de WSFEv1. Ese backend NO está implementado todavía porque necesita los
   * certificados de homologación del cliente.
   *
   * Por eso, este método genera un comprobante de SIMULACIÓN: sin CAE, sin QR
   * fiscal y marcado "NO VÁLIDO COMO FACTURA". Jamás se inventa un CAE.
   */
  async authorizeInvoice(settings: FiscalSettings, req: ARCAInvoiceRequest, simulationNumber: number): Promise<ARCAInvoiceResponse> {
    if (!validateCuit(settings.cuit)) {
      return { success: false, is_simulation: true, error: 'El CUIT del emisor no es válido. Revisá la configuración fiscal.' };
    }
    if (req.receiver_doc_type === 80 && !validateCuit(req.receiver_doc_number)) {
      return { success: false, is_simulation: true, error: 'El CUIT del receptor no es válido.' };
    }
    if (Math.abs(req.net_amount + req.vat_amount + req.exempt_amount - req.total_amount) > 0.011) {
      return { success: false, is_simulation: true, error: 'Neto + IVA + exento no coincide con el total.' };
    }

    if (ARCA_INTEGRATION_STATUS === 'no_configurado') {
      return {
        success: true,
        is_simulation: true,
        voucher_number: simulationNumber,
        observations: [
          'SIMULACIÓN LOCAL — NO VÁLIDO COMO FACTURA.',
          'No se envió a ARCA: falta configurar certificado y backend WSAA/WSFEv1.',
        ],
      };
    }

    return { success: false, is_simulation: false, error: 'Integración ARCA no disponible.' };
  },

  /** Arma el QR sólo cuando ya existe un CAE real devuelto por ARCA. */
  buildQrForAuthorized(settings: FiscalSettings, p: { voucherType: number; voucherNumber: number; total: number; docType: number; docNumber: string; cae: string; date: string }): string {
    return buildArcaQrUrl({
      date: p.date, cuit: settings.cuit, pointOfSale: settings.point_of_sale, voucherType: p.voucherType,
      voucherNumber: p.voucherNumber, total: p.total, docTypeReceiver: p.docType, docNumberReceiver: p.docNumber, cae: p.cae,
    });
  },
};
