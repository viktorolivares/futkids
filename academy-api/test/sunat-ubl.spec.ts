import { describe, it, expect, beforeEach } from 'vitest';
import { UblGeneratorService } from '../src/sunat/ubl/ubl-generator.service';
import { UblInvoiceData } from '../src/sunat/types/sunat.types';
import { SunatInvalidXmlException } from '../src/sunat/exceptions/sunat.exceptions';

describe('UblGeneratorService (UBL 2.1 SUNAT)', () => {
  let generator: UblGeneratorService;

  beforeEach(() => {
    generator = new UblGeneratorService();
  });

  const baseCompany = {
    ruc: '20601234567',
    legalName: 'ACADEMIA DEPORTIVA LOS CRACKS S.A.C.',
    commercialName: 'LOS CRACKS ACADEMY',
    address: 'AV. DEL DEPORTE 789',
    district: 'MIRAFLORES',
    province: 'LIMA',
    department: 'LIMA',
  };

  it('debe generar un XML UBL 2.1 válido para FACTURA (tipo 01)', () => {
    const data: UblInvoiceData = {
      documentType: '01',
      series: 'F001',
      correlative: 42,
      issueDate: '2026-03-01',
      issueTime: '10:30:00',
      currency: 'PEN',
      company: baseCompany,
      client: {
        docType: '6',
        docNumber: '20555555551',
        name: 'SPONSOR CORP S.A.C.',
        address: 'AV. EMPRESARIAL 100',
      },
      items: [
        {
          id: 1,
          description: 'Auspicio Torneo Infantil Sub-12',
          unitCode: 'ZZ',
          quantity: 1,
          unitPrice: 1180.0,
          unitPriceWithoutIgv: 1000.0,
          subtotal: 1000.0,
          igv: 180.0,
          total: 1180.0,
        },
      ],
      subtotal: 1000.0,
      igv: 180.0,
      total: 1180.0,
    };

    const xml = generator.generateXml(data);

    // Verificaciones de estructura XML
    expect(xml).toContain('<?xml version="1.0" encoding="ISO-8859-1"?>');
    expect(xml).toContain('<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"');
    expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    expect(xml).toContain('<cbc:CustomizationID>2.0</cbc:CustomizationID>');
    expect(xml).toContain('<cbc:ID>F001-00000042</cbc:ID>');
    expect(xml).toContain('<cbc:IssueDate>2026-03-01</cbc:IssueDate>');
    expect(xml).toContain('<cbc:InvoiceTypeCode listAgencyName="PE:SUNAT"');
    expect(xml).toContain('>01</cbc:InvoiceTypeCode>');
    expect(xml).toContain('<cbc:DocumentCurrencyCode');
    expect(xml).toContain('>PEN</cbc:DocumentCurrencyCode>');

    // Verificaciones de Emisor y Receptor
    expect(xml).toContain('<cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">20601234567</cbc:ID>');
    expect(xml).toContain('ACADEMIA DEPORTIVA LOS CRACKS S.A.C.');
    expect(xml).toContain('<cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">20555555551</cbc:ID>');
    expect(xml).toContain('SPONSOR CORP S.A.C.');

    // Verificaciones tributarias (IGV 18%)
    expect(xml).toContain('<cbc:TaxAmount currencyID="PEN">180.00</cbc:TaxAmount>');
    expect(xml).toContain('<cbc:TaxableAmount currencyID="PEN">1000.00</cbc:TaxableAmount>');
    expect(xml).toContain('<cbc:Percent>18.00</cbc:Percent>');
    expect(xml).toContain('<cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>');
    expect(xml).toContain('<cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Codigo de tributos">1000</cbc:ID>');
    expect(xml).toContain('<cbc:Name>IGV</cbc:Name>');

    // Verificaciones de totales y leyendas (Catálogo 52)
    expect(xml).toContain('<cbc:PayableAmount currencyID="PEN">1180.00</cbc:PayableAmount>');
    expect(xml).toContain('<cbc:Note languageLocaleID="1000"><![CDATA[SON MIL CIENTO OCHENTA CON 00/100 SOLES]]></cbc:Note>');

    // Placeholder de firma
    expect(xml).toContain('<ext:ExtensionContent></ext:ExtensionContent>');
  });

  it('debe generar un XML UBL 2.1 válido para BOLETA DE VENTA (tipo 03)', () => {
    const data: UblInvoiceData = {
      documentType: '03',
      series: 'B001',
      correlative: 15,
      issueDate: '2026-03-02',
      currency: 'PEN',
      company: baseCompany,
      client: {
        docType: '1',
        docNumber: '73456789',
        name: 'CARLOS ALBERTO GOMEZ',
      },
      items: [
        {
          id: 1,
          description: 'Mensualidad Fútbol Formativo - Marzo 2026',
          unitCode: 'ZZ',
          quantity: 1,
          unitPrice: 236.0,
          unitPriceWithoutIgv: 200.0,
          subtotal: 200.0,
          igv: 36.0,
          total: 236.0,
        },
      ],
      subtotal: 200.0,
      igv: 36.0,
      total: 236.0,
    };

    const xml = generator.generateXml(data);

    expect(xml).toContain('<cbc:ID>B001-00000015</cbc:ID>');
    expect(xml).toContain('>03</cbc:InvoiceTypeCode>');
    expect(xml).toContain('schemeID="1"');
    expect(xml).toContain('73456789');
    expect(xml).toContain('CARLOS ALBERTO GOMEZ');
    expect(xml).toContain('<cbc:PayableAmount currencyID="PEN">236.00</cbc:PayableAmount>');
    expect(xml).toContain('SON DOSCIENTOS TREINTA Y SEIS CON 00/100 SOLES');
  });

  it('debe generar un XML UBL 2.1 para NOTA DE CRÉDITO (tipo 07) con referencia y discrepancia', () => {
    const data: UblInvoiceData = {
      documentType: '07',
      series: 'FC01',
      correlative: 3,
      issueDate: '2026-03-03',
      currency: 'PEN',
      company: baseCompany,
      client: {
        docType: '6',
        docNumber: '20555555551',
        name: 'SPONSOR CORP S.A.C.',
      },
      items: [
        {
          id: 1,
          description: 'Anulación de servicio de auspicio',
          unitCode: 'ZZ',
          quantity: 1,
          unitPrice: 1180.0,
          unitPriceWithoutIgv: 1000.0,
          subtotal: 1000.0,
          igv: 180.0,
          total: 1180.0,
        },
      ],
      subtotal: 1000.0,
      igv: 180.0,
      total: 1180.0,
      discrepancyResponse: {
        referenceId: 'F001-00000042',
        responseCode: '01', // Anulación de la operación
        description: 'Anulación total por cambio de fecha del evento',
      },
      billingReference: {
        documentId: 'F001-00000042',
        documentTypeCode: '01',
      },
    };

    const xml = generator.generateXml(data);

    expect(xml).toContain('<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"');
    expect(xml).toContain('<cbc:ID>FC01-00000003</cbc:ID>');
    expect(xml).toContain('<cac:DiscrepancyResponse>');
    expect(xml).toContain('<cbc:ReferenceID>F001-00000042</cbc:ReferenceID>');
    expect(xml).toContain('<cbc:ResponseCode listAgencyName="PE:SUNAT" listName="Tipo de nota de credito" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo09">01</cbc:ResponseCode>');
    expect(xml).toContain('Anulación total por cambio de fecha del evento');
    expect(xml).toContain('<cac:BillingReference>');
    expect(xml).toContain('<cbc:ID>F001-00000042</cbc:ID>');
    expect(xml).toContain('<cbc:DocumentTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">01</cbc:DocumentTypeCode>');
    expect(xml).toContain('<cac:CreditNoteLine>');
  });

  it('debe generar un XML UBL 2.1 para NOTA DE DÉBITO (tipo 08)', () => {
    const data: UblInvoiceData = {
      documentType: '08',
      series: 'FD01',
      correlative: 5,
      issueDate: '2026-03-04',
      currency: 'PEN',
      company: baseCompany,
      client: {
        docType: '6',
        docNumber: '20555555551',
        name: 'SPONSOR CORP S.A.C.',
      },
      items: [
        {
          id: 1,
          description: 'Intereses moratorios por pago extemporáneo',
          unitCode: 'ZZ',
          quantity: 1,
          unitPrice: 59.0,
          unitPriceWithoutIgv: 50.0,
          subtotal: 50.0,
          igv: 9.0,
          total: 59.0,
        },
      ],
      subtotal: 50.0,
      igv: 9.0,
      total: 59.0,
      discrepancyResponse: {
        referenceId: 'F001-00000042',
        responseCode: '01', // Intereses por mora
        description: 'Intereses compensatorios y moratorios',
      },
      billingReference: {
        documentId: 'F001-00000042',
        documentTypeCode: '01',
      },
    };

    const xml = generator.generateXml(data);

    expect(xml).toContain('<DebitNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2"');
    expect(xml).toContain('<cbc:ID>FD01-00000005</cbc:ID>');
    expect(xml).toContain('<cac:DiscrepancyResponse>');
    expect(xml).toContain('<cbc:ResponseCode listAgencyName="PE:SUNAT" listName="Tipo de nota de debito" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo10">01</cbc:ResponseCode>');
    expect(xml).toContain('<cac:DebitNoteLine>');
    expect(xml).toContain('<cac:RequestedMonetaryTotal>');
  });

  it('debe lanzar SunatInvalidXmlException si faltan datos requeridos', () => {
    // Caso 1: RUC inválido
    expect(() => {
      generator.generateXml({
        documentType: '01',
        series: 'F001',
        correlative: 1,
        issueDate: '2026-03-01',
        company: { ...baseCompany, ruc: '123' },
        client: { docType: '6', docNumber: '20555555551', name: 'CLIENTE' },
        items: [],
        subtotal: 0,
        igv: 0,
        total: 0,
      });
    }).toThrow(SunatInvalidXmlException);

    // Caso 2: Factura con cliente sin RUC
    expect(() => {
      generator.generateXml({
        documentType: '01',
        series: 'F001',
        correlative: 1,
        issueDate: '2026-03-01',
        company: baseCompany,
        client: { docType: '1', docNumber: '72345678', name: 'CLIENTE DNI' },
        items: [
          {
            id: 1,
            description: 'Item',
            unitCode: 'ZZ',
            quantity: 1,
            unitPrice: 118,
            unitPriceWithoutIgv: 100,
            subtotal: 100,
            igv: 18,
            total: 118,
          },
        ],
        subtotal: 100,
        igv: 18,
        total: 118,
      });
    }).toThrow('Para Facturas (tipo 01), el cliente debe tener RUC');
  });

  it('debe convertir correctamente montos a letras en español', () => {
    expect(generator.montoALetras(100.0, 'PEN')).toBe('SON CIEN CON 00/100 SOLES');
    expect(generator.montoALetras(118.0, 'PEN')).toBe('SON CIENTO DIECIOCHO CON 00/100 SOLES');
    expect(generator.montoALetras(250.5, 'PEN')).toBe('SON DOSCIENTOS CINCUENTA CON 50/100 SOLES');
    expect(generator.montoALetras(1500.0, 'PEN')).toBe('SON MIL QUINIENTOS CON 00/100 SOLES');
  });
});
