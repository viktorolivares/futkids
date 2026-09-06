import { describe, it, expect } from 'vitest';
import { XmlSignerService } from '../src/sunat/signer/xml-signer.service';
import { ZipPackagerService } from '../src/sunat/packager/zip-packager.service';
import AdmZip from 'adm-zip';

describe('XmlSignerService & ZipPackagerService (Firma y Empaquetado SUNAT)', () => {
  const signer = new XmlSignerService();
  const packager = new ZipPackagerService();

  const sampleXml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ID>B001-00000042</cbc:ID>
</Invoice>`;

  describe('XmlSignerService', () => {
    it('debe firmar el XML con XML-DSig y generar DigestValue y SignatureValue', () => {
      const result = signer.signXml(sampleXml);

      expect(result.signedXml).toBeDefined();
      expect(result.digestValue).toBeDefined();
      expect(result.signatureValue).toBeDefined();
      expect(result.certificateUsed).toBeDefined();

      // Verificar elementos de XMLDSig en el XML resultante
      expect(result.signedXml).toContain('<ds:Signature');
      expect(result.signedXml).toContain('Id="SignatureSP"');
      expect(result.signedXml).toContain('<ds:SignedInfo>');
      expect(result.signedXml).toContain('Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"');
      expect(result.signedXml).toContain('Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"');
      expect(result.signedXml).toContain('<ds:DigestValue>');
      expect(result.signedXml).toContain(result.digestValue);
      expect(result.signedXml).toContain('<ds:SignatureValue>');
      expect(result.signedXml).toContain(result.signatureValue);
      expect(result.signedXml).toContain('<ds:KeyInfo>');
      expect(result.signedXml).toContain('<ds:X509Certificate>');
    });

    it('debe lanzar excepción si el XML está vacío', () => {
      expect(() => signer.signXml('')).toThrow('El XML proporcionado para firma está vacío');
    });
  });

  describe('ZipPackagerService', () => {
    it('debe generar el nombre estándar según especificación SUNAT {RUC}-{TIPO}-{SERIE}-{CORRELATIVO}', () => {
      const name = packager.getStandardBaseName('20000000001', '01', 'F001', 42);
      expect(name).toBe('20000000001-01-F001-00000042');
    });

    it('debe empaquetar el XML firmado en un ZIP con base64 y buffer válidos', () => {
      const signed = signer.signXml(sampleXml);
      const pkg = packager.packageXml(signed.signedXml, '20000000001', '03', 'B001', 42);

      expect(pkg.fileName).toBe('20000000001-03-B001-00000042.zip');
      expect(pkg.xmlFileName).toBe('20000000001-03-B001-00000042.xml');
      expect(pkg.zipBuffer).toBeInstanceOf(Buffer);
      expect(pkg.zipBase64).toBeDefined();

      // Verificar que el ZIP contenga exactamente el archivo XML
      const unzipped = new AdmZip(pkg.zipBuffer);
      const entries = unzipped.getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].entryName).toBe('20000000001-03-B001-00000042.xml');

      const extractedXml = entries[0].getData().toString('utf-8');
      expect(extractedXml).toContain('<cbc:ID>B001-00000042</cbc:ID>');
      expect(extractedXml).toContain('<ds:Signature');
    });

    it('debe descomprimir y analizar correctamente un CDR de SUNAT (Aceptado código 0)', () => {
      // Simular un CDR devuelto por SUNAT
      const cdrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>R-20000000001-03-B001-00000042</cbc:ID>
  <cbc:ResponseDate>2026-03-01</cbc:ResponseDate>
  <cbc:ResponseTime>10:35:12</cbc:ResponseTime>
  <cbc:Note>Observación de prueba: advertencia en catalogos</cbc:Note>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>B001-00000042</cbc:ReferenceID>
      <cbc:ResponseCode>0</cbc:ResponseCode>
      <cbc:Description>La Boleta de Venta numero B001-00000042, ha sido aceptada</cbc:Description>
    </cac:Response>
  </cac:DocumentResponse>
</ApplicationResponse>`;

      // Comprimir en zip y codificar en base64
      const zip = new AdmZip();
      zip.addFile('R-20000000001-03-B001-00000042.xml', Buffer.from(cdrXml, 'utf-8'));
      const cdrBase64 = zip.toBuffer().toString('base64');

      const cdrResult = packager.extractCdr(cdrBase64);

      expect(cdrResult.isAccepted).toBe(true);
      expect(cdrResult.responseCode).toBe('0');
      expect(cdrResult.description).toContain('ha sido aceptada');
      expect(cdrResult.referenceId).toBe('B001-00000042');
      expect(cdrResult.notes).toHaveLength(1);
      expect(cdrResult.notes[0]).toContain('Observación de prueba');
    });
  });
});
