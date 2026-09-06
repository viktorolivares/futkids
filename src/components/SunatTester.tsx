import React, { useState } from 'react';
import {
  FileCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  FileArchive,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Bug,
} from 'lucide-react';

export const SunatTester: React.FC = () => {
  const [docType, setDocType] = useState<'01' | '03' | '07' | '08'>('03');
  const [series, setSeries] = useState('B001');
  const [correlative, setCorrelative] = useState(105);
  const [clientDocNum, setClientDocNum] = useState('72345678');
  const [clientName, setClientName] = useState('JUAN CARLOS PEREZ GOMEZ');
  const [concept, setConcept] = useState('Matrícula Mensual Fútbol Formativo - Verano 2026');
  const [priceTotal, setPriceTotal] = useState(118.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'result' | 'signedXml' | 'soap' | 'faults'>('result');
  const [copied, setCopied] = useState<string | null>(null);

  // NC/ND References
  const [refDoc, setRefDoc] = useState('F001-00000042');
  const [refReason, setRefReason] = useState('Anulación total de la operación');

  const handleDocTypeChange = (type: '01' | '03' | '07' | '08') => {
    setDocType(type);
    if (type === '01') {
      setSeries('F001');
      setClientDocNum('20555555551');
      setClientName('SPONSOR DEPORTIVO DEL PERU S.A.C.');
      setPriceTotal(1180.0);
    } else if (type === '03') {
      setSeries('B001');
      setClientDocNum('72345678');
      setClientName('JUAN CARLOS PEREZ GOMEZ');
      setPriceTotal(118.0);
    } else if (type === '07') {
      setSeries('FC01');
      setClientDocNum('20555555551');
      setClientName('SPONSOR DEPORTIVO DEL PERU S.A.C.');
      setPriceTotal(1180.0);
    } else {
      setSeries('FD01');
      setClientDocNum('20555555551');
      setClientName('SPONSOR DEPORTIVO DEL PERU S.A.C.');
      setPriceTotal(59.0);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // Cálculos matemáticos tributarios
  const subtotal = +(priceTotal / 1.18).toFixed(2);
  const igv = +(priceTotal - subtotal).toFixed(2);
  const formattedCorrelative = correlative.toString().padStart(8, '0');
  const documentId = `${series}-${formattedCorrelative}`;
  const zipFileName = `20000000001-${docType}-${documentId}.zip`;

  // Datos simulados en vivo de respuesta
  const [responseState, setResponseState] = useState<{
    executed: boolean;
    status: 'ACCEPTED' | 'REJECTED' | 'WARNING';
    sunatCode: string;
    sunatMessage: string;
    digestValue: string;
    signatureValue: string;
    notes: string[];
    sentAt: string;
  }>({
    executed: true,
    status: 'ACCEPTED',
    sunatCode: '0',
    sunatMessage: `El comprobante número ${documentId}, ha sido aceptado por SUNAT.`,
    digestValue: 'r48B3F2oJ0z2Hq4b7A9g==',
    signatureValue: 'c7qX3N2eL1w9...[RSA-SHA256 SIGNED]',
    notes: [
      'La numeración correlativa se validó de acuerdo al rango autorizado.',
      'Constancia de Recepción (CDR) procesada y archivada con éxito.',
    ],
    sentAt: new Date().toLocaleTimeString(),
  });

  const handleEmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setResponseState({
        executed: true,
        status: 'ACCEPTED',
        sunatCode: '0',
        sunatMessage: `El comprobante número ${series}-${formattedCorrelative}, ha sido aceptado por el servicio Beta de SUNAT.`,
        digestValue: 'a9Kx84LmQ0w1Zp==',
        signatureValue: 'd2M4N7v8P1...[RSA-SHA256 SIGNED BY ACADEMY]',
        notes: [
          'Catálogo 07: Operación Gravada - Afectación IGV código 10.',
          'El archivo CDR R-' + zipFileName.replace('.zip', '') + ' fue validado satisfactoriamente.',
        ],
        sentAt: new Date().toLocaleTimeString(),
      });
      setCorrelative((prev) => prev + 1);
    }, 900);
  };

  const sampleXmlOutput = `<?xml version="1.0" encoding="ISO-8859-1"?>
<${docType === '07' ? 'CreditNote' : docType === '08' ? 'DebitNote' : 'Invoice'} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${
    docType === '07' ? 'CreditNote-2' : docType === '08' ? 'DebitNote-2' : 'Invoice-2'
  }"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <ds:Signature Id="SignatureSP">
          <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
            <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
            <ds:Reference URI="">
              <ds:Transforms>
                <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
              </ds:Transforms>
              <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue>${responseState.digestValue}</ds:DigestValue>
            </ds:Reference>
          </ds:SignedInfo>
          <ds:SignatureValue>${responseState.signatureValue}</ds:SignatureValue>
          <ds:KeyInfo>
            <ds:X509Data>
              <ds:X509Certificate>MIIE/TCCAuWgAwIBAgIU...[X.509 CERTIFICATE]</ds:X509Certificate>
            </ds:X509Data>
          </ds:KeyInfo>
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${documentId}</cbc:ID>
  <cbc:IssueDate>2026-03-05</cbc:IssueDate>
  <cbc:IssueTime>${responseState.sentAt}</cbc:IssueTime>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:Signature>
    <cbc:ID>20000000001</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification><cbc:ID>20000000001</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name><![CDATA[ACADEMIA DEPORTIVA DEMO S.A.C.]]></cbc:Name></cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference><cbc:URI>#SignatureSP</cbc:URI></cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6">20000000001</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[ACADEMIA DEPORTIVA DEMO S.A.C.]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="${docType === '01' ? '6' : '1'}">${clientDocNum}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${clientName}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${igv.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${igv.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>18.00</cbc:Percent>
        <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${priceTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${priceTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</${docType === '07' ? 'CreditNote' : docType === '08' ? 'DebitNote' : 'Invoice'}>`;

  const sampleSoapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ser="http://service.sunat.gob.pe"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>20000000001MODDATOS</wsse:Username>
        <wsse:Password>moddatos</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${zipFileName}</fileName>
      <contentFile>UEsDBBQAAAAIAKBmV1cAAAAAA...[ZIP BASE64]</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-50 text-amber-800 text-xs px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                Servidor SUNAT Beta
              </span>
              <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                Estándar UBL 2.1
              </span>
              <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
                Firma Digital RSA-SHA256
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Emisión y Transmisión de Comprobantes SUNAT
            </h2>
            <p className="text-slate-600 mt-1 max-w-3xl leading-relaxed text-sm">
              Genera facturas, boletas y notas de crédito en formato XML UBL 2.1, aplica firma digital con certificado
              X.509, comprime en ZIP y transmite a los WebServices oficiales de SUNAT sin intermediarios.
            </p>
          </div>

          <div className="shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600">
              <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mb-0.5">Punto de Enlace</div>
              <div className="font-mono text-slate-700 truncate max-w-[260px]">
                e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form / Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                1. Datos del Comprobante
              </h3>
              <span className="text-xs text-slate-500 font-medium">RUC Emisor: 20000000001</span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '03', label: 'Boleta de Venta (03)', sub: 'B001 - Para personas' },
                  { id: '01', label: 'Factura Electrónica (01)', sub: 'F001 - Para empresas' },
                  { id: '07', label: 'Nota de Crédito (07)', sub: 'FC01 - Anulaciones' },
                  { id: '08', label: 'Nota de Débito (08)', sub: 'FD01 - Ajustes' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDocTypeChange(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      docType === item.id
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Serie y Correlativo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Serie
                </label>
                <input
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Correlativo
                </label>
                <input
                  type="number"
                  value={correlative}
                  onChange={(e) => setCorrelative(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tipo Doc
                  </label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-semibold">
                    {docType === '01' ? '6 (RUC)' : '1 (DNI)'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={clientDocNum}
                    onChange={(e) => setClientDocNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre o Razón Social del Cliente
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Referencia si es NC o ND */}
            {(docType === '07' || docType === '08') && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-amber-900">
                  Comprobante que se modifica
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-amber-800 font-medium block mb-0.5">Doc. Modificado</label>
                    <input
                      type="text"
                      value={refDoc}
                      onChange={(e) => setRefDoc(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-800 font-medium block mb-0.5">Motivo</label>
                    <input
                      type="text"
                      value={refReason}
                      onChange={(e) => setRefReason(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Concepto & Importes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Concepto de Pago / Mensualidad
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            {/* Cálculo Tributario */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">Total a Cobrar (S/):</span>
                <input
                  type="number"
                  value={priceTotal}
                  onChange={(e) => setPriceTotal(Number(e.target.value))}
                  className="w-28 text-right bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 font-bold text-sm"
                />
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Subtotal (sin IGV):</span>
                <span className="font-mono text-slate-700">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>IGV (18%):</span>
                <span className="font-mono text-slate-700">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Total Final:</span>
                <span className="text-emerald-700 font-mono text-base">S/ {priceTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleEmit}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transmitiendo a SUNAT...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Emitir y Enviar a SUNAT Beta</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-xs">
            {/* Top Sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
              <div className="flex space-x-1 overflow-x-auto">
                {[
                  { id: 'result', label: 'Respuesta SUNAT & CDR', icon: CheckCircle2 },
                  { id: 'signedXml', label: 'XML UBL 2.1 Firmado', icon: FileCode },
                  { id: 'soap', label: 'Sobre SOAP', icon: ShieldCheck },
                  { id: 'faults', label: 'Catálogo de Errores', icon: Bug },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeSubTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveSubTab(t.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-slate-400 font-mono self-end sm:self-auto">
                {zipFileName}
              </span>
            </div>

            {/* TAB 1: RESULT & CDR */}
            {activeSubTab === 'result' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950 text-sm">
                        ESTADO SUNAT: ACEPTADO (CÓDIGO {responseState.sunatCode})
                      </span>
                      <span className="text-xs bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                        200 OK
                      </span>
                    </div>
                    <div className="text-emerald-900 text-sm mt-1">
                      {responseState.sunatMessage}
                    </div>
                    <div className="text-xs text-emerald-700/80 mt-1">
                      Hora de recepción en servidor SUNAT: {responseState.sentAt}
                    </div>
                  </div>
                </div>

                {/* Technical Meta Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Identificador</div>
                    <div className="text-slate-900 font-bold text-base mt-0.5">{documentId}</div>
                    <div className="text-slate-600 text-xs mt-1">
                      Comprobante: {docType === '01' ? 'Factura Electrónica' : docType === '03' ? 'Boleta de Venta' : docType === '07' ? 'Nota de Crédito' : 'Nota de Débito'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Firma Digital (Hash)</div>
                    <div className="text-emerald-700 font-mono text-xs truncate mt-0.5">{responseState.digestValue}</div>
                    <div className="text-slate-600 text-xs mt-1">Algoritmo: RSA-SHA256 (XML-DSig)</div>
                  </div>
                </div>

                {/* CDR Notes */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Observaciones en Constancia de Recepción (CDR):
                  </div>
                  {responseState.notes.map((note, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                {/* Database Storage Preview */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    Registro persistido en base de datos PostgreSQL:
                  </div>
                  <pre className="text-xs text-emerald-400 font-mono overflow-x-auto p-2 bg-slate-950/70 rounded-lg">
{`{
  id: "inv-${formattedCorrelative}",
  series: "${series}",
  correlative: ${correlative - 1},
  status: "ACCEPTED",
  sunatCode: "0",
  sunatMessage: "${responseState.sunatMessage}",
  ublXml: "<Invoice>...</Invoice>",
  signedXml: "<Invoice><ds:Signature/>...</Invoice>",
  sunatCdr: "<ApplicationResponse>...</ApplicationResponse>",
  sentAt: "${new Date().toISOString()}"
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: SIGNED XML */}
            {activeSubTab === 'signedXml' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    Estructura OASIS UBL 2.1 con bloque de firma incrustado:
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleXmlOutput, 'xml')}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition font-medium cursor-pointer"
                  >
                    {copied === 'xml' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'xml' ? 'Copiado' : 'Copiar XML'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-[420px] leading-relaxed">
                  {sampleXmlOutput}
                </pre>
              </div>
            )}

            {/* TAB 3: SOAP & WS-SECURITY */}
            {activeSubTab === 'soap' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    Sobre SOAP 1.1 con credenciales WS-Security enviadas a SUNAT:
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleSoapEnvelope, 'soap')}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition font-medium cursor-pointer"
                  >
                    {copied === 'soap' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'soap' ? 'Copiado' : 'Copiar SOAP'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-[420px] leading-relaxed">
                  {sampleSoapEnvelope}
                </pre>
              </div>
            )}

            {/* TAB 4: ERROR SIMULATOR */}
            {activeSubTab === 'faults' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed">
                  Excepciones y códigos de respuesta contemplados para garantizar alta disponibilidad ante SUNAT:
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      code: '1033',
                      name: 'Comprobante Duplicado',
                      fault: 'soapenv:Client.1033',
                      msg: 'El comprobante fue registrado previamente con otros datos.',
                      action: 'Idempotencia: se detecta comprobante existente sin emitir duplicado.',
                    },
                    {
                      code: '0100',
                      name: 'Autenticación Fallida',
                      fault: 'soapenv:Client.0100',
                      msg: 'El RUC no coincide con el usuario SOL ingresado.',
                      action: 'Valida credenciales SOL antes del reintento automático.',
                    },
                    {
                      code: '2015',
                      name: 'RUC Inactivo',
                      fault: 'soapenv:Client.2015',
                      msg: 'El RUC del receptor no está activo en el padrón de SUNAT.',
                      action: 'Informa al usuario el estado del contribuyente en SUNAT.',
                    },
                    {
                      code: 'TIMEOUT',
                      name: 'Demora en Servidor SUNAT',
                      fault: 'Network Timeout > 30s',
                      msg: 'El servidor de SUNAT tardó más de lo esperado en responder.',
                      action: 'Encola reintento automático en segundo plano con Redis/BullMQ.',
                    },
                  ].map((fault, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          [{fault.code}] {fault.name}
                        </span>
                        <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                          {fault.fault}
                        </span>
                      </div>
                      <div className="text-slate-700 mt-1">{fault.msg}</div>
                      <div className="text-slate-500 mt-0.5">{fault.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
