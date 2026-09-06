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
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-bold uppercase">
                SUNAT BETA ACTIVE
              </span>
              <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded border border-sky-500/30 font-bold uppercase">
                UBL 2.1 COMPLIANT
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
                XML-DSIG SHA-256 SIGNED
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1.5 font-mono uppercase tracking-wide">
              Integración Nativa con SUNAT Beta (Facturación Electrónica Perú)
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Generación de comprobantes bajo estándar OASIS UBL 2.1, firma digital con clave RSA 2048 y certificado X.509, empaquetado ZIP con nomenclatura SUNAT, y transmisión SOAP con autenticación WS-Security hacia <code className="text-sky-400 font-mono">e-beta.sunat.gob.pe</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#161B22] border border-slate-700/60 rounded px-3 py-1.5 text-right font-mono text-[11px]">
              <div className="text-slate-500 text-[9px] uppercase">WebService Beta URL</div>
              <div className="text-slate-300 truncate max-w-[220px]">
                https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form / Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                1. Configuración del Comprobante
              </span>
              <span className="text-[10px] text-slate-400">RUC: 20000000001 (BETA)</span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Tipo de Comprobante
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: '03', label: 'Boleta de Venta (03)', sub: 'B001 - DNI' },
                  { id: '01', label: 'Factura Electrónica (01)', sub: 'F001 - RUC' },
                  { id: '07', label: 'Nota de Crédito (07)', sub: 'FC01 - Anulación' },
                  { id: '08', label: 'Nota de Débito (08)', sub: 'FD01 - Ajuste/Mora' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDocTypeChange(item.id as any)}
                    className={`p-2 rounded border text-left transition ${
                      docType === item.id
                        ? 'border-sky-500 bg-sky-500/10 text-white'
                        : 'border-slate-800 bg-[#161B22] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{item.label}</div>
                    <div className="text-[9px] text-slate-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Serie y Correlativo */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Serie
                </label>
                <input
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  className="w-full bg-[#161B22] border border-slate-700/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Correlativo
                </label>
                <input
                  type="number"
                  value={correlative}
                  onChange={(e) => setCorrelative(Number(e.target.value))}
                  className="w-full bg-[#161B22] border border-slate-700/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Tipo Doc
                  </label>
                  <div className="bg-[#161B22] border border-slate-700/60 rounded px-2 py-1.5 text-slate-300 text-xs">
                    {docType === '01' ? '6 (RUC)' : '1 (DNI)'}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={clientDocNum}
                    onChange={(e) => setClientDocNum(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-700/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Razón Social / Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#161B22] border border-slate-700/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Referencia si es NC o ND */}
            {(docType === '07' || docType === '08') && (
              <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase">
                  Datos de Referencia ({docType === '07' ? 'Catálogo 09' : 'Catálogo 10'})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-0.5">Doc. Modificado</label>
                    <input
                      type="text"
                      value={refDoc}
                      onChange={(e) => setRefDoc(e.target.value)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-0.5">Motivo / Sustento</label>
                    <input
                      type="text"
                      value={refReason}
                      onChange={(e) => setRefReason(e.target.value)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Concepto & Importes */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Descripción / Concepto Deportivo
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-[#161B22] border border-slate-700/60 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Cálculo Tributario */}
            <div className="p-3 bg-[#161B22] border border-slate-800 rounded space-y-1.5">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Total a Cobrar (PEN):</span>
                <input
                  type="number"
                  value={priceTotal}
                  onChange={(e) => setPriceTotal(Number(e.target.value))}
                  className="w-24 text-right bg-[#0F1219] border border-slate-700 rounded px-2 py-0.5 text-white font-bold"
                />
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Valor Venta (Subtotal sin IGV):</span>
                <span className="font-mono text-slate-300">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>IGV (18% Catálogo 07 Código 10):</span>
                <span className="font-mono text-slate-300">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-xs text-white">
                <span>Importe Total:</span>
                <span className="text-emerald-400 font-mono">S/ {priceTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleEmit}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Firmando y Transmitiendo a SUNAT...</span>
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
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#0F1219] border border-slate-800 rounded p-4 flex flex-col font-mono text-xs">
            {/* Top Sub-tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex space-x-1">
                {[
                  { id: 'result', label: 'Respuesta SUNAT & CDR', icon: CheckCircle2 },
                  { id: 'signedXml', label: 'XML UBL 2.1 Firmado', icon: FileCode },
                  { id: 'soap', label: 'SOAP & WS-Security', icon: ShieldCheck },
                  { id: 'faults', label: 'Simulador de Errores', icon: Bug },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveSubTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        activeSubTab === t.id
                          ? 'bg-slate-800 text-sky-400 border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="text-[10px] text-slate-500">
                Archivo: {zipFileName}
              </span>
            </div>

            {/* TAB 1: RESULT & CDR */}
            {activeSubTab === 'result' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-300 text-xs">
                        ESTADO SUNAT: ACEPTADO (CÓDIGO {responseState.sunatCode})
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                        200 OK
                      </span>
                    </div>
                    <div className="text-slate-300 text-xs mt-1">
                      {responseState.sunatMessage}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Hora de recepción en servidor SUNAT: {responseState.sentAt}
                    </div>
                  </div>
                </div>

                {/* Technical Meta Card */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#161B22] p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase">Documento Identificador</div>
                    <div className="text-white font-bold">{documentId}</div>
                    <div className="text-slate-400 text-[10px] mt-1">
                      Tipo SUNAT: {docType} ({docType === '01' ? 'Factura' : docType === '03' ? 'Boleta' : docType === '07' ? 'Nota Crédito' : 'Nota Débito'})
                    </div>
                  </div>
                  <div className="bg-[#161B22] p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px] uppercase">Firma Digital (Hash Digest)</div>
                    <div className="text-sky-400 font-mono text-[10px] truncate">{responseState.digestValue}</div>
                    <div className="text-slate-400 text-[10px] mt-1">Algoritmo: RSA-SHA256 (XML-DSig)</div>
                  </div>
                </div>

                {/* CDR Notes */}
                <div className="bg-[#161B22] p-3 rounded border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Observaciones y Trazas en Constancia de Recepción (CDR):
                  </div>
                  {responseState.notes.map((note, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-sky-400" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                {/* Prisma Database Storage Preview */}
                <div className="bg-[#161B22] p-3 rounded border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Persistencia en Modelo Prisma <code className="text-sky-400">Invoice</code>:
                  </div>
                  <pre className="text-[10px] text-slate-400 bg-[#0B0E14] p-2 rounded overflow-x-auto">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Estructura OASIS UBL 2.1 con bloque <code className="text-sky-400">&lt;ds:Signature&gt;</code> incrustado:
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleXmlOutput, 'xml')}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
                  >
                    {copied === 'xml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'xml' ? 'Copiado' : 'Copiar XML'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#0B0E14] border border-slate-800 rounded text-[10px] text-slate-300 font-mono overflow-x-auto max-h-[380px] leading-relaxed">
                  {sampleXmlOutput}
                </pre>
              </div>
            )}

            {/* TAB 3: SOAP & WS-SECURITY */}
            {activeSubTab === 'soap' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Sobre SOAP 1.1 con cabecera <code className="text-sky-400">wsse:UsernameToken</code> enviada a SUNAT:
                  </span>
                  <button
                    onClick={() => copyToClipboard(sampleSoapEnvelope, 'soap')}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700"
                  >
                    {copied === 'soap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'soap' ? 'Copiado' : 'Copiar SOAP'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#0B0E14] border border-slate-800 rounded text-[10px] text-slate-300 font-mono overflow-x-auto max-h-[380px] leading-relaxed">
                  {sampleSoapEnvelope}
                </pre>
              </div>
            )}

            {/* TAB 4: ERROR SIMULATOR */}
            {activeSubTab === 'faults' && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  Prueba de resiliencia: Excepciones de dominio mapeadas a los códigos de rechazo y SOAP Faults oficiales de SUNAT:
                </div>

                <div className="space-y-2">
                  {[
                    {
                      code: '1033',
                      name: 'SunatDuplicateException',
                      fault: 'soapenv:Client.1033',
                      msg: 'El comprobante fue registrado previamente con otros datos.',
                      action: 'Idempotencia: se detecta comprobante existente y no se vuelve a crear.',
                    },
                    {
                      code: '0100',
                      name: 'SunatAuthenticationException',
                      fault: 'soapenv:Client.0100',
                      msg: 'El RUC no coincide con el usuario SOL ingresado.',
                      action: 'Valida credenciales SOL en BillingSetting antes del reintento.',
                    },
                    {
                      code: '2015',
                      name: 'SunatRejectionException',
                      fault: 'soapenv:Client.2015',
                      msg: 'El RUC del receptor no está activo en el padrón de SUNAT.',
                      action: 'Marca invoice como REJECTED e informa el motivo legal al usuario.',
                    },
                    {
                      code: 'TIMEOUT',
                      name: 'SunatTimeoutException',
                      fault: 'Network Timeout > 30000ms',
                      msg: 'El servicio de SUNAT Beta no respondió a tiempo.',
                      action: 'Encola reintento automático con backoff exponencial en BullMQ.',
                    },
                  ].map((fault, idx) => (
                    <div key={idx} className="p-2.5 bg-[#161B22] border border-slate-800 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-400 text-[11px]">
                          [{fault.code}] {fault.name}
                        </span>
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.2 rounded font-mono">
                          {fault.fault}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] mt-1">{fault.msg}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{fault.action}</div>
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
