import React, { useState } from 'react';
import {
  Printer,
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Receipt,
  FileCheck,
  Building,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { WebBillingInvoice } from '../types';

interface VoucherTicketModalProps {
  invoice: WebBillingInvoice | null;
  academyName?: string;
  academyRuc?: string;
  academyAddress?: string;
  onClose: () => void;
}

export const VoucherTicketModal: React.FC<VoucherTicketModalProps> = ({
  invoice,
  academyName = 'CLUB ALIANZA LIMA - ESCUELA FORMATIVA',
  academyRuc = '20100123456',
  academyAddress = 'Jr. Isabel La Católica 840, La Victoria, Lima',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const isRecibo = invoice.type === 'RECIBO' || invoice.isInternalReceipt;
  const isBoleta = invoice.type === 'BOLETA';
  const isFactura = invoice.type === 'FACTURA';
  const isNotaCredito = invoice.type === 'NOTA_CREDITO';

  const docNumber = `${invoice.series}-${invoice.correlative.toString().padStart(8, '0')}`;

  const titleText = isNotaCredito
    ? 'NOTA DE CRÉDITO ELECTRÓNICA'
    : isRecibo
    ? 'RECIBO DE CAJA / NOTA DE VENTA'
    : isBoleta
    ? 'BOLETA DE VENTA ELECTRÓNICA'
    : 'FACTURA ELECTRÓNICA';

  const generateWhatsAppMessage = () => {
    let msg = `⚽ *${academyName}*\n`;
    msg += `📄 *${titleText}*: ${docNumber}\n`;
    msg += `📅 *Fecha*: ${invoice.issuedAt}\n`;
    msg += `👤 *Alumno / Cliente*: ${invoice.clientName}\n`;
    msg += `🆔 *Doc*: ${invoice.clientDoc}\n`;
    if (invoice.items && invoice.items.length > 0) {
      msg += `📝 *Detalle de Conceptos*:\n`;
      invoice.items.forEach((it) => {
        msg += `  • ${it.description}: S/ ${it.total.toFixed(2)}\n`;
      });
    } else if (invoice.concept) {
      msg += `📝 *Concepto*: ${invoice.concept}\n`;
    }
    if (invoice.paymentMethod) {
      msg += `💳 *Medio de Pago*: ${invoice.paymentMethod}\n`;
    }
    msg += `💰 *Total Pagado*: S/ ${invoice.total.toFixed(2)}\n`;

    if (isRecibo) {
      msg += `\n✅ _Comprobante de control interno emitido por caja._\n¡Gracias por confiar en la formación deportiva de su hijo!`;
    } else {
      msg += `\n🏛️ _Comprobante electrónico aceptado por SUNAT (CDR Código 0)._`;
    }

    return encodeURIComponent(msg);
  };

  const handleCopyText = () => {
    const rawText = `⚽ ${academyName}\n${titleText}: ${docNumber}\nFecha: ${invoice.issuedAt}\nCliente: ${invoice.clientName} (Doc: ${invoice.clientDoc})\nConcepto: ${invoice.concept || 'Cuota formativa'}\nTotal: S/ ${invoice.total.toFixed(2)}`;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = invoice.clientPhone?.replace(/\D/g, '') || '';
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${generateWhatsAppMessage()}`
    : `https://wa.me/?text=${generateWhatsAppMessage()}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black max-w-sm w-full p-5 rounded-lg shadow-2xl font-mono text-xs space-y-3 my-auto border border-gray-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Close */}
        <div className="flex justify-between items-start border-b border-gray-300 pb-2 relative">
          <div className="text-center w-full pr-4">
            <div className="font-extrabold text-sm uppercase tracking-tight text-slate-900">
              {academyName}
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">
              {isRecibo ? 'Control Administrativo de Academia' : `RUC: ${academyRuc}`}
            </div>
            <div className="text-[9px] text-gray-500 leading-tight mt-0.5">
              {academyAddress}
            </div>

            {/* Document Box Header */}
            <div
              className={`text-xs font-bold mt-2 uppercase border py-1 px-2 rounded-sm ${
                isRecibo
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                  : 'border-slate-800 bg-slate-50 text-slate-900'
              }`}
            >
              <div className="text-[10px] tracking-wider">{titleText}</div>
              <div className="text-sm font-black tracking-widest">{docNumber}</div>
              {isRecibo && (
                <div className="text-[8px] text-emerald-700 uppercase font-semibold">
                  * Comprobante No Tributario / Control Interno *
                </div>
              )}
              {isNotaCredito && (
                <div className="text-[9px] text-purple-800 bg-purple-100/70 p-1.5 rounded mt-1 text-left border border-purple-200">
                  <div><strong>DOC. MODIFICADO:</strong> {invoice.referenceVoucherType || 'COMPROBANTE'} {invoice.referenceVoucherNumber}</div>
                  <div><strong>MOTIVO SUNAT [{invoice.creditNoteReasonCode || '01'}]:</strong> {invoice.creditNoteReasonDesc || 'Anulación de la operación'}</div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black absolute right-0 top-0 p-1 rounded transition"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client & Date Details */}
        <div className="text-[11px] space-y-1 bg-gray-50 p-2 rounded border border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha de Emisión:</span>
            <span className="font-bold text-gray-800">{invoice.issuedAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cliente / Alumno:</span>
            <span className="font-bold text-gray-900 text-right truncate max-w-[180px]">
              {invoice.clientName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">
              {isFactura ? 'RUC:' : 'DNI / Doc:'}
            </span>
            <span className="font-mono font-bold text-gray-800">{invoice.clientDoc}</span>
          </div>
          {invoice.clientPhone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Teléfono / WhatsApp:</span>
              <span className="font-mono text-gray-700">{invoice.clientPhone}</span>
            </div>
          )}
          {invoice.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-500">Medio de Pago:</span>
              <span className="font-bold text-emerald-800 uppercase">{invoice.paymentMethod}</span>
            </div>
          )}
          {invoice.receivedBy && (
            <div className="flex justify-between">
              <span className="text-gray-500">Atendido por:</span>
              <span className="text-gray-700">{invoice.receivedBy}</span>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="border-t border-b border-dashed border-gray-400 py-2 space-y-1.5 text-[11px]">
          <div className="flex justify-between font-bold text-[10px] text-gray-600 uppercase border-b border-gray-200 pb-1">
            <span>CANT / DESCRIPCIÓN</span>
            <span>TOTAL</span>
          </div>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start pt-1 text-[10px] leading-tight">
                <div className="text-gray-800 pr-2">
                  <span className="font-bold">{item.quantity}x </span>
                  <span>{item.description}</span>
                  {item.studentName && (
                    <span className="block text-[9px] text-gray-500 italic">Alumno: {item.studentName}</span>
                  )}
                </div>
                <span className="font-bold font-mono whitespace-nowrap">
                  S/ {item.total.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex justify-between pt-1">
              <span className="text-gray-800 leading-tight pr-2">
                1 {invoice.concept || 'Cuota formativa mensual'}
              </span>
              <span className="font-bold font-mono whitespace-nowrap">
                S/ {invoice.total.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="text-right text-[11px] space-y-0.5">
          {isRecibo ? (
            <div className="flex justify-between text-gray-600 text-[10px]">
              <span>Régimen / Impuesto:</span>
              <span>Exento / No afecto a IGV</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-gray-600 text-[10px]">
                <span>Op. Gravada:</span>
                <span>S/ {invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[10px]">
                <span>I.G.V. (18%):</span>
                <span>S/ {invoice.igv.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-extrabold text-sm pt-1.5 border-t border-gray-400 text-black">
            <span>TOTAL A PAGAR:</span>
            <span className="text-base text-emerald-700">S/ {invoice.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer info: Receipt vs SUNAT Boleta/Factura */}
        {isRecibo ? (
          <div className="text-center text-[9px] text-gray-600 border-t border-dashed border-gray-400 pt-2 space-y-1">
            <div className="font-bold text-gray-700 uppercase">
              Constancia de Ingreso a Caja de Academia
            </div>
            <div className="text-gray-500">
              Este recibo acredita el pago de cuota o arancel deportivo ante la administración. No requiere declaración ante SUNAT.
            </div>
            <div className="bg-emerald-50 text-emerald-900 py-1 px-2 rounded font-bold border border-emerald-300 flex items-center justify-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>REGISTRO EN CAJA CONFIRMADO</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-[9px] text-gray-600 border-t border-dashed border-gray-400 pt-2 space-y-1">
            <div>Representación impresa de la {titleText}</div>
            <div>Autorizado mediante Resolución de SUNAT</div>
            {invoice.digestValue && (
              <div className="font-mono text-[8px] text-gray-500 truncate">
                Hash: {invoice.digestValue}
              </div>
            )}
            <div className="bg-sky-50 text-sky-900 py-1 px-2 rounded font-bold border border-sky-200 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>SUNAT: CONSTANCIA DE RECEPCIÓN (CDR) ACEPTADO (0)</span>
            </div>
          </div>
        )}

        {/* Actions buttons */}
        <div className="pt-2 border-t border-gray-300 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm text-center"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              onClick={handleCopyText}
              className="text-[10px] text-gray-600 hover:text-black flex items-center gap-1 py-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar resumen de constancia</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1 text-[10px] text-gray-500 hover:text-black font-semibold rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
