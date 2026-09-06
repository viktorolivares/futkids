export type SunatDocumentType = '01' | '03' | '07' | '08';

export const SUNAT_DOC_TYPES = {
  FACTURA: '01' as const,
  BOLETA: '03' as const,
  NOTA_CREDITO: '07' as const,
  NOTA_DEBITO: '08' as const,
};

export type SunatIdentityDocType =
  | '1' // DNI
  | '6' // RUC
  | '4' // Carnet de Extranjería
  | '7' // Pasaporte
  | '0'; // Sin documento / Documento extranjero

export interface InvoiceItem {
  id: number | string;
  description: string;
  unitCode: string; // 'NIU' (Unidad/Bienes), 'ZZ' (Servicio)
  quantity: number;
  unitPrice: number; // Con IGV
  unitPriceWithoutIgv: number; // Sin IGV
  subtotal: number; // Valor de venta (quantity * unitPriceWithoutIgv)
  igv: number; // IGV total de la línea
  total: number; // Precio total de la línea
  discountAmount?: number;
  igvType?: string; // Catálogo 07: '10' (Gravado - Operación Onerosa)
}

export interface DiscrepancyResponse {
  referenceId: string; // e.g. "F001-00000042"
  responseCode: string; // Catálogo 09 (NC) o 10 (ND)
  description: string; // Motivo o sustento
}

export interface BillingReference {
  documentId: string; // e.g. "F001-00000042"
  documentTypeCode: SunatDocumentType; // "01" o "03"
}

export interface UblInvoiceData {
  documentType: SunatDocumentType;
  series: string; // e.g. "F001", "B001", "FC01", "FD01"
  correlative: number; // e.g. 42
  issueDate: string; // YYYY-MM-DD
  issueTime?: string; // HH:mm:ss
  currency?: 'PEN' | 'USD';
  company: {
    ruc: string;
    legalName: string;
    commercialName?: string;
    address?: string;
    district?: string;
    province?: string;
    department?: string;
    ubigeo?: string; // e.g. "150101"
  };
  client: {
    docType: SunatIdentityDocType;
    docNumber: string;
    name: string;
    address?: string;
    email?: string;
  };
  items: InvoiceItem[];
  subtotal: number; // Total valor de venta (gravado)
  igv: number; // Total IGV (18%)
  total: number; // Total a pagar
  discountAmount?: number;
  legends?: Array<{ code: string; value: string }>;
  // Campos específicos para Notas de Crédito y Débito
  discrepancyResponse?: DiscrepancyResponse;
  billingReference?: BillingReference;
}

export interface CdrResult {
  rawXml: string;
  responseCode: string; // "0" = Aceptado, != 0 = Rechazado / Error
  description: string; // Mensaje oficial de SUNAT
  id: string; // e.g. "R-20000000001-01-F001-00000042"
  referenceId: string; // e.g. "F001-00000042"
  notes: string[]; // Observaciones de SUNAT
  responseDate?: string;
  responseTime?: string;
  isAccepted: boolean;
}

export interface SunatSendResult {
  success: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'EXCEPTIONAL';
  sunatCode: string;
  sunatMessage: string;
  fileName: string;
  zipBase64: string;
  cdrBase64?: string;
  cdr?: CdrResult;
  digestValue?: string;
  sentAt: Date;
  rawSoapResponse?: string;
  errorDetails?: string;
}
