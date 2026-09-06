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
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-50 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                SUNAT BETA
              </span>
              <span className="bg-blue-50 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">
                UBL 2.1 COMPLIANT
              </span>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                XML-DSIG SHA-256
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-2 tracking-tight">
              Transmisor & Banco de Pruebas SUNAT
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Generación de comprobantes bajo estándar OASIS UBL 2.1, firma digital con clave RSA 2048 y certificado X.509, empaquetado ZIP con nomenclatura oficial y transmisión SOAP hacia <code className="text-blue-600 font-mono">e-beta.sunat.gob.pe</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-right text-xs">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">WebService Beta</div>
              <div className="text-slate-700 truncate max-w-[220px] font-mono text-[11px] mt-0.5">
                https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form / Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 text-sm">
                Configuración del Comprobante
              </span>
              <span className="text-[11px] text-slate-400 font-mono">RUC: 20000000001 (BETA)</span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '03', label: 'Boleta de Venta (03)', sub: 'B001 - DNI' },
                  { id: '01', label: 'Factura Electrónica (01)', sub: 'F001 - RUC' },
                  { id: '07', label: 'Nota de Crédito (07)', sub: 'FC01 - Anulación' },
                  { id: '08', label: 'Nota de Débito (08)', sub: 'FD01 - Ajuste' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDocTypeChange(item.id as any)}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      docType === item.id
                        ? 'border-blue-500 bg-blue-50/80 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-xs">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tipo Doc
                  </label>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-600 text-xs text-center font-medium">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Razón Social / Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Referencia si es NC o ND */}
            {(docType === '07' || docType === '08') && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="text-xs font-semibold text-amber-900">
                  Datos de Referencia ({docType === '07' ? 'Catálogo 09' : 'Catálogo 10'})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Doc. Modificado</label>
                    <input
                      type="text"
                      value={refDoc}
                      onChange={(e) => setRefDoc(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">Motivo</label>
                    <input
                      type="text"
                      value={refReason}
                      onChange={(e) => setRefReason(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Concepto & Importes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Descripción / Concepto
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Cálculo Tributario */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Total a Cobrar (PEN):</span>
                <input
                  type="number"
                  value={priceTotal}
                  onChange={(e) => setPriceTotal(Number(e.target.value))}
                  className="w-28 text-right bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-slate-900 font-bold shadow-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Valor Venta (sin IGV):</span>
                <span className="font-mono text-slate-700">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs">
                <span>IGV (18% Catálogo 07):</span>
                <span className="font-mono text-slate-700">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-slate-900">
                <span>Importe Total:</span>
                <span className="text-emerald-700 font-mono text-sm">S/ {priceTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleEmit}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transmitiendo a SUNAT...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmitir Comprobante a SUNAT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col text-xs shadow-xs">
            {/* Top Sub-tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {[
                  { id: 'result', label: 'Respuesta & CDR', icon: CheckCircle2 },
                  { id: 'signedXml', label: 'XML UBL 2.1', icon: FileCode },
                  { id: 'soap', label: 'Sobre SOAP', icon: ShieldCheck },
                  { id: 'faults', label: 'Errores', icon: Bug },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveSubTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeSubTab === t.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {zipFileName}
              </span>
            </div>

            {/* TAB 1: RESULT & CDR */}
            {activeSubTab === 'result' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-900 text-xs">
                        ESTADO SUNAT: ACEPTADO (CÓDIGO {responseState.sunatCode})
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        200 OK
                      </span>
                    </div>
                    <div className="text-emerald-800 text-xs mt-1">
                      {responseState.sunatMessage}
                    </div>
                    <div className="text-[11px] text-emerald-700/70 mt-1">
                      Hora de recepción en servidor SUNAT: {responseState.sentAt}
                    </div>
                  </div>
                </div>

                {/* Technical Meta Card */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Documento</div>
                    <div className="text-slate-900 font-bold font-mono mt-0.5">{documentId}</div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      Tipo SUNAT: {docType} ({docType === '01' ? 'Factura' : docType === '03' ? 'Boleta' : docType === '07' ? 'Nota Crédito' : 'Nota Débito'})
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Firma Digital (Hash)</div>
                    <div className="text-blue-600 font-mono text-[11px] truncate mt-0.5">{responseState.digestValue}</div>
                    <div className="text-slate-500 text-[11px] mt-1">Algoritmo: RSA-SHA256 (XML-DSig)</div>
                  </div>
                </div>

                {/* CDR Notes */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700">
                    Constancia de Recepción (CDR):
                  </div>
                  {responseState.notes.map((note, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                {/* Database Storage Preview */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Registro en Base de Datos:
                  </div>
                  <pre className="text-[11px] text-slate-700 bg-white border border-slate-200 p-3 rounded-xl overflow-x-auto font-mono">
{`{
  id: "inv-${formattedCorrelative}",
  series: "${series}",
  correlative: ${correlative - 1},
  status: "ACCEPTED",
  sunatCode: "0",
  sunatMessage: "${responseState.sunatMessage}",
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
                  <span className="text-xs text-slate-500">
                    Estructura OASIS UBL 2.1 con bloque <code className="text-blue-600 font-mono">&lt;ds:Signature&gt;</code>:
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleXmlOutput, 'xml')}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs cursor-pointer"
                  >
                    {copied === 'xml' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'xml' ? 'Copiado' : 'Copiar XML'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-[380px] leading-relaxed">
                  {sampleXmlOutput}
                </pre>
              </div>
            )}

            {/* TAB 3: SOAP & WS-SECURITY */}
            {activeSubTab === 'soap' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Sobre SOAP 1.1 con autenticación <code className="text-blue-600 font-mono">wsse:UsernameToken</code>:
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleSoapEnvelope, 'soap')}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-3 py-1 rounded-lg bg-white border border-slate-200 shadow-xs cursor-pointer"
                  >
                    {copied === 'soap' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'soap' ? 'Copiado' : 'Copiar SOAP'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] text-slate-300 font-mono overflow-x-auto max-h-[380px] leading-relaxed">
                  {sampleSoapEnvelope}
                </pre>
              </div>
            )}

            {/* TAB 4: ERROR SIMULATOR */}
            {activeSubTab === 'faults' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 leading-relaxed">
                  Códigos de rechazo y excepciones oficiales de SUNAT mapeadas en el sistema:
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      code: '1033',
                      name: 'SunatDuplicateException',
                      fault: 'Client.1033',
                      msg: 'El comprobante fue registrado previamente con otros datos.',
                      action: 'Idempotencia: se detecta comprobante existente y no se vuelve a emitir.',
                    },
                    {
                      code: '0100',
                      name: 'SunatAuthenticationException',
                      fault: 'Client.0100',
                      msg: 'El RUC no coincide con el usuario SOL ingresado.',
                      action: 'Valida credenciales SOL en Ajustes antes del reintento.',
                    },
                    {
                      code: '2015',
                      name: 'SunatRejectionException',
                      fault: 'Client.2015',
                      msg: 'El RUC del receptor no está activo en el padrón de SUNAT.',
                      action: 'Marca el comprobante como rechazado e informa al usuario.',
                    },
                    {
                      code: 'TIMEOUT',
                      name: 'SunatTimeoutException',
                      fault: 'Timeout > 30s',
                      msg: 'El servicio de SUNAT Beta no respondió a tiempo.',
                      action: 'Encola reintento automático con reenvío en segundo plano.',
                    },
                  ].map((fault, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 text-xs">
                          [{fault.code}] {fault.name}
                        </span>
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-mono font-medium">
                          {fault.fault}
                        </span>
                      </div>
                      <div className="text-slate-700 text-xs mt-1">{fault.msg}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{fault.action}</div>
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
