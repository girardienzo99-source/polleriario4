import QRCode from 'qrcode';
import { FiscalSettings, FiscalDocument, Sale } from '@/types/database';

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
  is_simulation: boolean;
  cae?: string;
  cae_expiration?: string;
  voucher_number?: number;
  qr_data_url?: string;
  qr_url?: string;
  error?: string;
  observations?: string[];
}

export const ARCAClient = {
  /**
   * Genera el payload oficial para el QR según especificación AFIP / ARCA
   * URL: https://www.afip.gob.ar/fe/qr/?p={BASE64_JSON}
   */
  generateQRCodeData(params: {
    cuit: string;
    point_of_sale: number;
    voucher_type: number;
    voucher_number: number;
    total: number;
    doc_type_receiver: number;
    doc_number_receiver: string;
    cae: string;
    date: string; // YYYY-MM-DD
  }): string {
    const jsonPayload = {
      ver: 1,
      fecha: params.date,
      cuit: parseInt(params.cuit.replace(/\D/g, ''), 10),
      ptoVta: params.point_of_sale,
      tipoCmp: params.voucher_type,
      nroCmp: params.voucher_number,
      importe: Number(params.total.toFixed(2)),
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: params.doc_type_receiver,
      nroDocRec: parseInt(params.doc_number_receiver.replace(/\D/g, '') || '0', 10),
      tipoCodAut: 'E',
      codAut: parseInt(params.cae, 10),
    };

    const base64 = typeof window !== 'undefined'
      ? btoa(JSON.stringify(jsonPayload))
      : Buffer.from(JSON.stringify(jsonPayload)).toString('base64');

    return `https://www.afip.gob.ar/fe/qr/?p=${base64}`;
  },

  /**
   * Renderiza el código QR en Base64 Data URL (PNG)
   */
  async renderQRCodeDataUrl(qrUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(qrUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.error('Error generating QR Code:', e);
      return '';
    }
  },

  /**
   * Emite comprobante fiscal.
   * Si no hay certificados configurados o está en modo 'homologacion' sin cert,
   * utiliza el Simulador Local Oficial marcado claramente como "NO FISCAL (MODO PRUEBA)".
   */
  async authorizeInvoice(
    settings: FiscalSettings,
    req: ARCAInvoiceRequest
  ): Promise<ARCAInvoiceResponse> {
    const isMock = !settings.cert_crt || !settings.cert_key || settings.environment === 'homologacion';

    // Fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Simulación controlada o llamada a API
    if (isMock) {
      const simulatedVoucherNumber = Math.floor(1000 + Math.random() * 9000);
      const simulatedCAE = `7442${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const qrUrl = this.generateQRCodeData({
        cuit: settings.cuit,
        point_of_sale: req.point_of_sale,
        voucher_type: req.voucher_type,
        voucher_number: simulatedVoucherNumber,
        total: req.total_amount,
        doc_type_receiver: req.receiver_doc_type,
        doc_number_receiver: req.receiver_doc_number,
        cae: simulatedCAE,
        date: today,
      });

      const qrDataUrl = await this.renderQRCodeDataUrl(qrUrl);

      return {
        success: true,
        is_simulation: true,
        cae: simulatedCAE,
        cae_expiration: expiryDate,
        voucher_number: simulatedVoucherNumber,
        qr_url: qrUrl,
        qr_data_url: qrDataUrl,
        observations: ['COMPROBANTE AUTORIZADO EN MODO SIMULACIÓN LOCAL (NO FISCAL)'],
      };
    }

    // Modo Producción con certificados reales
    return {
      success: false,
      is_simulation: false,
      error: 'Certificados de producción requieren autorización activa en AFIP/ARCA.',
    };
  }
};
