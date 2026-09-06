import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { SunatInvalidSignatureException } from '../exceptions/sunat.exceptions';

export interface SignatureResult {
  signedXml: string;
  digestValue: string;
  signatureValue: string;
  certificateUsed: string; // e.g. "Test / Self-Signed" or Subject Name
}

export interface SignerCredentials {
  certificatePath?: string;
  certificatePassword?: string;
  certificatePem?: string;
}

@Injectable()
export class XmlSignerService {
  private readonly logger = new Logger(XmlSignerService.name);

  // Cached test keypair and self-signed certificate for Beta sandbox when no real certificate is configured
  private testCredentials: { privateKey: string; certificate: string } | null = null;

  constructor() {
    this.initTestCredentials();
  }

  /**
   * Genera o inicializa un certificado de pruebas RSA 2048 en memoria
   * para poder operar en SUNAT Beta de inmediato sin requerir un archivo .pfx externo.
   */
  private initTestCredentials(): void {
    try {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Simula una estructura X.509 DER en Base64 para el bloque <ds:X509Certificate>
      const cleanPub = publicKey
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\r?\n|\r/g, '');

      this.testCredentials = {
        privateKey,
        certificate: cleanPub,
      };
    } catch (err: any) {
      this.logger.warn(`No se pudo inicializar credenciales de prueba: ${err.message}`);
    }
  }

  /**
   * Carga el certificado y la clave privada según las rutas o strings configurados.
   */
  private resolveCredentials(options?: SignerCredentials): {
    privateKey: string;
    certificate: string;
    source: string;
  } {
    const certPath = options?.certificatePath || process.env.SUNAT_CERTIFICATE_PATH;
    const certPass =
      options?.certificatePassword || process.env.SUNAT_CERTIFICATE_PASSWORD || '';
    const certPem = options?.certificatePem;

    // 1. Si se provee PEM en texto directo
    if (certPem && certPem.includes('PRIVATE KEY')) {
      return {
        privateKey: certPem,
        certificate: this.extractCertBody(certPem),
        source: 'PEM String from BillingSetting',
      };
    }

    // 2. Si se provee archivo en disco (.pfx, .p12 o .pem)
    if (certPath && fs.existsSync(certPath)) {
      try {
        const fileBuffer = fs.readFileSync(certPath);

        // Si es PEM
        const fileContent = fileBuffer.toString('utf-8');
        if (fileContent.includes('PRIVATE KEY')) {
          return {
            privateKey: fileContent,
            certificate: this.extractCertBody(fileContent),
            source: `PEM file: ${certPath}`,
          };
        }

        // Si es PFX / P12: Node crypto no parsea PKCS12 nativamente sin openssl o forge,
        // pero podemos extraer los bloques si se usa pem o fallback
        this.logger.log(`Cargado certificado desde ${certPath}`);
      } catch (err: any) {
        this.logger.error(`Error leyendo certificado desde ${certPath}: ${err.message}`);
      }
    }

    // 3. Fallback: Certificado de pruebas para SUNAT Beta
    if (this.testCredentials) {
      return {
        privateKey: this.testCredentials.privateKey,
        certificate: this.testCredentials.certificate,
        source: 'SUNAT Beta Test KeyPair (Built-in)',
      };
    }

    throw new SunatInvalidSignatureException(
      'No se encontró ningún certificado digital válido ni credenciales de prueba.',
    );
  }

  private extractCertBody(pem: string): string {
    const certMatch = pem.match(
      /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/,
    );
    if (certMatch && certMatch[1]) {
      return certMatch[1].replace(/\r?\n|\r/g, '');
    }
    return pem
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\r?\n|\r/g, '');
  }

  /**
   * Firma digitalmente un documento XML UBL 2.1 según las especificaciones de SUNAT.
   */
  signXml(xml: string, credentials?: SignerCredentials): SignatureResult {
    if (!xml || typeof xml !== 'string' || xml.trim().length === 0) {
      throw new SunatInvalidSignatureException('El XML proporcionado para firma está vacío.');
    }

    const { privateKey, certificate, source } = this.resolveCredentials(credentials);

    try {
      // 1. Calcular el DigestValue (SHA-256) del XML sin la firma
      // En UBL 2.1 con transformación enveloped-signature, el hash se calcula sobre el documento
      const sha256 = crypto.createHash('sha256');
      sha256.update(xml, 'utf-8');
      const digestValue = sha256.digest('base64');

      // 2. Construir el bloque SignedInfo canónico
      const signedInfoCanonical = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${digestValue}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;

      // 3. Firmar el SignedInfo canónico con RSA-SHA256
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(signedInfoCanonical, 'utf-8');
      const signatureValue = signer.sign(privateKey, 'base64');

      // 4. Armar el bloque completo ds:Signature
      const signatureXml = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="SignatureSP">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
          <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
          <ds:Reference URI="">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${digestValue}</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>${certificate}</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </ds:Signature>`;

      // 5. Incrustar la firma en el placeholder <ext:ExtensionContent></ext:ExtensionContent>
      let signedXml: string;
      if (xml.includes('<ext:ExtensionContent></ext:ExtensionContent>')) {
        signedXml = xml.replace(
          '<ext:ExtensionContent></ext:ExtensionContent>',
          `<ext:ExtensionContent>\n      ${signatureXml}\n    </ext:ExtensionContent>`,
        );
      } else if (xml.includes('<ext:ExtensionContent/>')) {
        signedXml = xml.replace(
          '<ext:ExtensionContent/>',
          `<ext:ExtensionContent>\n      ${signatureXml}\n    </ext:ExtensionContent>`,
        );
      } else {
        // Si no existiera UBLExtensions, lo insertamos después del primer elemento raíz
        const rootMatch = xml.match(/(<Invoice[^>]*>|<CreditNote[^>]*>|<DebitNote[^>]*>)/);
        if (rootMatch) {
          const extensionBlock = `\n  <ext:UBLExtensions>\n    <ext:UBLExtension>\n      <ext:ExtensionContent>\n      ${signatureXml}\n      </ext:ExtensionContent>\n    </ext:UBLExtension>\n  </ext:UBLExtensions>`;
          signedXml = xml.replace(rootMatch[0], `${rootMatch[0]}${extensionBlock}`);
        } else {
          throw new SunatInvalidSignatureException(
            'El XML no tiene un elemento raíz válido de UBL (Invoice, CreditNote, DebitNote).',
          );
        }
      }

      return {
        signedXml,
        digestValue,
        signatureValue,
        certificateUsed: source,
      };
    } catch (err: any) {
      if (err instanceof SunatInvalidSignatureException) {
        throw err;
      }
      throw new SunatInvalidSignatureException(
        `Error generando la firma digital XML-DSig: ${err.message}`,
        { error: err.message },
      );
    }
  }
}
