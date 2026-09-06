import { Injectable } from '@nestjs/common';
import {
  UblInvoiceData,
  InvoiceItem,
  SunatDocumentType,
} from '../types/sunat.types';
import { SunatInvalidXmlException } from '../exceptions/sunat.exceptions';

@Injectable()
export class UblGeneratorService {
  /**
   * Genera el XML UBL 2.1 completo para Factura, Boleta, Nota de Crédito o Nota de Débito.
   */
  generateXml(data: UblInvoiceData): string {
    this.validateData(data);

    switch (data.documentType) {
      case '01': // Factura
      case '03': // Boleta
        return this.generateInvoiceXml(data);
      case '07': // Nota de Crédito
        return this.generateCreditNoteXml(data);
      case '08': // Nota de Débito
        return this.generateDebitNoteXml(data);
      default:
        throw new SunatInvalidXmlException(
          `Tipo de comprobante no soportado: ${data.documentType}`,
        );
    }
  }

  /**
   * Valida los campos obligatorios del comprobante antes de la generación.
   */
  private validateData(data: UblInvoiceData): void {
    if (!data.company?.ruc || data.company.ruc.length !== 11) {
      throw new SunatInvalidXmlException(
        'El RUC del emisor es obligatorio y debe tener 11 dígitos.',
      );
    }
    if (!data.company?.legalName) {
      throw new SunatInvalidXmlException(
        'La razón social del emisor es obligatoria.',
      );
    }
    if (!data.series || data.series.length < 4) {
      throw new SunatInvalidXmlException(
        'La serie del comprobante debe tener al menos 4 caracteres (ej: F001, B001).',
      );
    }
    if (!data.correlative || data.correlative <= 0) {
      throw new SunatInvalidXmlException(
        'El correlativo del comprobante debe ser un entero positivo.',
      );
    }
    if (!data.client?.docNumber || !data.client?.name) {
      throw new SunatInvalidXmlException(
        'Los datos del cliente (número de documento y nombre) son obligatorios.',
      );
    }
    if (data.documentType === '01' && data.client.docType !== '6') {
      throw new SunatInvalidXmlException(
        'Para Facturas (tipo 01), el cliente debe tener RUC (tipo documento 6).',
      );
    }
    if (!data.items || data.items.length === 0) {
      throw new SunatInvalidXmlException(
        'El comprobante debe contener al menos una línea de detalle.',
      );
    }
    if (
      (data.documentType === '07' || data.documentType === '08') &&
      (!data.discrepancyResponse || !data.billingReference)
    ) {
      throw new SunatInvalidXmlException(
        'Las notas de crédito y débito requieren información de referencia y discrepancia.',
      );
    }
  }

  /**
   * Formatea un número a 2 decimales string
   */
  private formatDecimal(val: number | string): string {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (isNaN(num) ? 0 : num).toFixed(2);
  }

  /**
   * Formatea el correlativo a 8 dígitos (ej: 42 -> "00000042")
   */
  formatCorrelative(correlative: number): string {
    return correlative.toString().padStart(8, '0');
  }

  /**
   * Obtiene el identificador completo del comprobante (ej: F001-00000042)
   */
  getDocumentId(series: string, correlative: number): string {
    return `${series}-${this.formatCorrelative(correlative)}`;
  }

  /**
   * Convierte un monto numérico a letras en español (Catálogo 52, código 1000)
   */
  montoALetras(monto: number, moneda: 'PEN' | 'USD' = 'PEN'): string {
    const enteros = Math.floor(monto);
    const centavos = Math.round((monto - enteros) * 100);
    const centavosStr = centavos.toString().padStart(2, '0');
    const monedaNombre = moneda === 'PEN' ? 'SOLES' : 'DÓLARES AMERICANOS';

    const textoEnteros = this.numeroALetras(enteros);
    return `SON ${textoEnteros} CON ${centavosStr}/100 ${monedaNombre}`;
  }

  private numeroALetras(num: number): string {
    if (num === 0) return 'CERO';
    if (num === 100) return 'CIEN';

    const unidades = [
      '',
      'UN',
      'DOS',
      'TRES',
      'CUATRO',
      'CINCO',
      'SEIS',
      'SIETE',
      'OCHO',
      'NUEVE',
    ];
    const decenas = [
      '',
      'DIEZ',
      'VEINTE',
      'TREINTA',
      'CUARENTA',
      'CINCUENTA',
      'SESENTA',
      'SETENTA',
      'OCHENTA',
      'NOVENTA',
    ];
    const especiales = [
      'ONCE',
      'DOCE',
      'TRECE',
      'CATORCE',
      'QUINCE',
      'DIECISEIS',
      'DIECISIETE',
      'DIECIOCHO',
      'DIECINUEVE',
    ];
    const centenas = [
      '',
      'CIENTO',
      'DOSCIENTOS',
      'TRESCIENTOS',
      'CUATROCIENTOS',
      'QUINIENTOS',
      'SEISCIENTOS',
      'SETECIENTOS',
      'OCHOCIENTOS',
      'NOVECIENTOS',
    ];

    if (num < 10) return unidades[num];
    if (num > 10 && num < 20) return especiales[num - 11];
    if (num < 100) {
      const d = Math.floor(num / 10);
      const u = num % 10;
      if (u === 0) return decenas[d];
      if (d === 2) return `VEINTI${unidades[u]}`;
      return `${decenas[d]} Y ${unidades[u]}`;
    }
    if (num < 1000) {
      const c = Math.floor(num / 100);
      const resto = num % 100;
      if (resto === 0) return centenas[c];
      return `${centenas[c]} ${this.numeroALetras(resto)}`;
    }
    if (num < 1000000) {
      const miles = Math.floor(num / 1000);
      const resto = num % 1000;
      const milesTexto = miles === 1 ? 'MIL' : `${this.numeroALetras(miles)} MIL`;
      if (resto === 0) return milesTexto;
      return `${milesTexto} ${this.numeroALetras(resto)}`;
    }
    return num.toString();
  }

  /**
   * Genera el XML para Factura (01) o Boleta (03)
   */
  private generateInvoiceXml(data: UblInvoiceData): string {
    const documentId = this.getDocumentId(data.series, data.correlative);
    const issueDate = data.issueDate;
    const issueTime = data.issueTime || '08:00:00';
    const currency = data.currency || 'PEN';
    const totalWords = this.montoALetras(data.total, currency);

    const subtotalStr = this.formatDecimal(data.subtotal);
    const igvStr = this.formatDecimal(data.igv);
    const totalStr = this.formatDecimal(data.total);

    const linesXml = data.items
      .map((item, index) => this.generateInvoiceLineXml(item, index + 1, currency))
      .join('\n');

    return `<?xml version="1.0" encoding="ISO-8859-1"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ccts="urn:un:unece:uncefact:documentation:2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
  xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${documentId}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listID="0101" listName="Tipo de Documento" listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${data.documentType}</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000"><![CDATA[${totalWords}]]></cbc:Note>
  <cbc:DocumentCurrencyCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 4217 Alpha" listName="Currency">${currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.company.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${data.company.commercialName || data.company.legalName}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.company.legalName}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
          <cbc:CityName>${data.company.province || 'LIMA'}</cbc:CityName>
          <cbc:CountrySubentity>${data.company.department || 'LIMA'}</cbc:CountrySubentity>
          <cbc:District>${data.company.district || 'MIRAFLORES'}</cbc:District>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${data.company.address || 'CALLE LOS DEPORTISTAS 123'}]]></cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 3166-1" listName="Country">PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="${data.client.docType}" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.client.docNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.client.name}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${subtotalStr}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
        <cbc:Percent>18.00</cbc:Percent>
        <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
        <cac:TaxScheme>
          <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotalStr}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totalStr}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${totalStr}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${linesXml}
</Invoice>`;
  }

  /**
   * Genera el XML para Nota de Crédito (07)
   */
  private generateCreditNoteXml(data: UblInvoiceData): string {
    const documentId = this.getDocumentId(data.series, data.correlative);
    const issueDate = data.issueDate;
    const issueTime = data.issueTime || '08:00:00';
    const currency = data.currency || 'PEN';
    const totalWords = this.montoALetras(data.total, currency);

    const subtotalStr = this.formatDecimal(data.subtotal);
    const igvStr = this.formatDecimal(data.igv);
    const totalStr = this.formatDecimal(data.total);

    const discrepancy = data.discrepancyResponse!;
    const billingRef = data.billingReference!;

    const linesXml = data.items
      .map((item, index) =>
        this.generateCreditNoteLineXml(item, index + 1, currency),
      )
      .join('\n');

    return `<?xml version="1.0" encoding="ISO-8859-1"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ccts="urn:un:unece:uncefact:documentation:2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
  xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${documentId}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:Note languageLocaleID="1000"><![CDATA[${totalWords}]]></cbc:Note>
  <cbc:DocumentCurrencyCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 4217 Alpha" listName="Currency">${currency}</cbc:DocumentCurrencyCode>
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>${discrepancy.referenceId}</cbc:ReferenceID>
    <cbc:ResponseCode listAgencyName="PE:SUNAT" listName="Tipo de nota de credito" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo09">${discrepancy.responseCode}</cbc:ResponseCode>
    <cbc:Description><![CDATA[${discrepancy.description}]]></cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${billingRef.documentId}</cbc:ID>
      <cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${billingRef.documentTypeCode}</cbc:DocumentTypeCode>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.company.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${data.company.commercialName || data.company.legalName}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.company.legalName}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
          <cbc:CityName>${data.company.province || 'LIMA'}</cbc:CityName>
          <cbc:CountrySubentity>${data.company.department || 'LIMA'}</cbc:CountrySubentity>
          <cbc:District>${data.company.district || 'MIRAFLORES'}</cbc:District>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${data.company.address || 'CALLE LOS DEPORTISTAS 123'}]]></cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 3166-1" listName="Country">PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="${data.client.docType}" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.client.docNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.client.name}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${subtotalStr}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
        <cbc:Percent>18.00</cbc:Percent>
        <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
        <cac:TaxScheme>
          <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotalStr}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totalStr}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${totalStr}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${linesXml}
</CreditNote>`;
  }

  /**
   * Genera el XML para Nota de Débito (08)
   */
  private generateDebitNoteXml(data: UblInvoiceData): string {
    const documentId = this.getDocumentId(data.series, data.correlative);
    const issueDate = data.issueDate;
    const issueTime = data.issueTime || '08:00:00';
    const currency = data.currency || 'PEN';
    const totalWords = this.montoALetras(data.total, currency);

    const subtotalStr = this.formatDecimal(data.subtotal);
    const igvStr = this.formatDecimal(data.igv);
    const totalStr = this.formatDecimal(data.total);

    const discrepancy = data.discrepancyResponse!;
    const billingRef = data.billingReference!;

    const linesXml = data.items
      .map((item, index) =>
        this.generateDebitNoteLineXml(item, index + 1, currency),
      )
      .join('\n');

    return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DebitNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ccts="urn:un:unece:uncefact:documentation:2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
  xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${documentId}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:Note languageLocaleID="1000"><![CDATA[${totalWords}]]></cbc:Note>
  <cbc:DocumentCurrencyCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 4217 Alpha" listName="Currency">${currency}</cbc:DocumentCurrencyCode>
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>${discrepancy.referenceId}</cbc:ReferenceID>
    <cbc:ResponseCode listAgencyName="PE:SUNAT" listName="Tipo de nota de debito" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo10">${discrepancy.responseCode}</cbc:ResponseCode>
    <cbc:Description><![CDATA[${discrepancy.description}]]></cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${billingRef.documentId}</cbc:ID>
      <cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">${billingRef.documentTypeCode}</cbc:DocumentTypeCode>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.company.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${data.company.commercialName || data.company.legalName}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.company.legalName}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
          <cbc:CityName>${data.company.province || 'LIMA'}</cbc:CityName>
          <cbc:CountrySubentity>${data.company.department || 'LIMA'}</cbc:CountrySubentity>
          <cbc:District>${data.company.district || 'MIRAFLORES'}</cbc:District>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${data.company.address || 'CALLE LOS DEPORTISTAS 123'}]]></cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 3166-1" listName="Country">PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="${data.client.docType}" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.client.docNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.client.name}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${subtotalStr}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
        <cbc:Percent>18.00</cbc:Percent>
        <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
        <cac:TaxScheme>
          <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:RequestedMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotalStr}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totalStr}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${totalStr}</cbc:PayableAmount>
  </cac:RequestedMonetaryTotal>
${linesXml}
</DebitNote>`;
  }

  /**
   * Genera el XML para una línea de factura o boleta
   */
  private generateInvoiceLineXml(
    item: InvoiceItem,
    index: number,
    currency: string,
  ): string {
    const qtyStr = item.quantity.toString();
    const unitCode = item.unitCode || 'NIU';
    const subtotalStr = this.formatDecimal(item.subtotal);
    const igvStr = this.formatDecimal(item.igv);
    const priceWithIgvStr = this.formatDecimal(item.unitPrice);
    const priceWithoutIgvStr = this.formatDecimal(item.unitPriceWithoutIgv);

    return `  <cac:InvoiceLine>
    <cbc:ID>${index}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${unitCode}" unitCodeListAgencyName="United Nations Economic Commission for Europe" unitCodeListID="UN/ECE rec 20">${qtyStr}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotalStr}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="${currency}">${priceWithIgvStr}</cbc:PriceAmount>
        <cbc:PriceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Precio" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${subtotalStr}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
          <cbc:Percent>18.00</cbc:Percent>
          <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${priceWithoutIgvStr}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }

  /**
   * Genera el XML para una línea de Nota de Crédito
   */
  private generateCreditNoteLineXml(
    item: InvoiceItem,
    index: number,
    currency: string,
  ): string {
    const qtyStr = item.quantity.toString();
    const unitCode = item.unitCode || 'NIU';
    const subtotalStr = this.formatDecimal(item.subtotal);
    const igvStr = this.formatDecimal(item.igv);
    const priceWithIgvStr = this.formatDecimal(item.unitPrice);
    const priceWithoutIgvStr = this.formatDecimal(item.unitPriceWithoutIgv);

    return `  <cac:CreditNoteLine>
    <cbc:ID>${index}</cbc:ID>
    <cbc:CreditedQuantity unitCode="${unitCode}" unitCodeListAgencyName="United Nations Economic Commission for Europe" unitCodeListID="UN/ECE rec 20">${qtyStr}</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotalStr}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="${currency}">${priceWithIgvStr}</cbc:PriceAmount>
        <cbc:PriceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Precio" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${subtotalStr}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
          <cbc:Percent>18.00</cbc:Percent>
          <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${priceWithoutIgvStr}</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>`;
  }

  /**
   * Genera el XML para una línea de Nota de Débito
   */
  private generateDebitNoteLineXml(
    item: InvoiceItem,
    index: number,
    currency: string,
  ): string {
    const qtyStr = item.quantity.toString();
    const unitCode = item.unitCode || 'NIU';
    const subtotalStr = this.formatDecimal(item.subtotal);
    const igvStr = this.formatDecimal(item.igv);
    const priceWithIgvStr = this.formatDecimal(item.unitPrice);
    const priceWithoutIgvStr = this.formatDecimal(item.unitPriceWithoutIgv);

    return `  <cac:DebitNoteLine>
    <cbc:ID>${index}</cbc:ID>
    <cbc:DebitedQuantity unitCode="${unitCode}" unitCodeListAgencyName="United Nations Economic Commission for Europe" unitCodeListID="UN/ECE rec 20">${qtyStr}</cbc:DebitedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${subtotalStr}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="${currency}">${priceWithIgvStr}</cbc:PriceAmount>
        <cbc:PriceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Precio" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${subtotalStr}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${igvStr}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
          <cbc:Percent>18.00</cbc:Percent>
          <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${priceWithoutIgvStr}</cbc:PriceAmount>
    </cac:Price>
  </cac:DebitNoteLine>`;
  }
}
