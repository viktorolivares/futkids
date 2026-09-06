import { Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { SunatDocumentType, CdrResult } from '../types/sunat.types';
import { SunatInvalidZipException } from '../exceptions/sunat.exceptions';

export interface ZipPackage {
  fileName: string; // e.g. "20000000001-01-F001-00000042.zip"
  xmlFileName: string; // e.g. "20000000001-01-F001-00000042.xml"
  zipBuffer: Buffer;
  zipBase64: string;
}

@Injectable()
export class ZipPackagerService {
  private readonly logger = new Logger(ZipPackagerService.name);
  private readonly xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  /**
   * Genera el nombre de archivo estándar de SUNAT
   * Formato: {RUC}-{TIPO}-{SERIE}-{CORRELATIVO_8DIGITOS}
   */
  getStandardBaseName(
    ruc: string,
    documentType: SunatDocumentType,
    series: string,
    correlative: number,
  ): string {
    const paddedCorrelative = correlative.toString().padStart(8, '0');
    return `${ruc}-${documentType}-${series}-${paddedCorrelative}`;
  }

  /**
   * Empaqueta el XML firmado en un archivo ZIP listo para ser enviado a SUNAT
   */
  packageXml(
    signedXml: string,
    ruc: string,
    documentType: SunatDocumentType,
    series: string,
    correlative: number,
  ): ZipPackage {
    try {
      const baseName = this.getStandardBaseName(ruc, documentType, series, correlative);
      const xmlFileName = `${baseName}.xml`;
      const zipFileName = `${baseName}.zip`;

      const zip = new AdmZip();
      zip.addFile(xmlFileName, Buffer.from(signedXml, 'utf-8'));

      const zipBuffer = zip.toBuffer();
      const zipBase64 = zipBuffer.toString('base64');

      return {
        fileName: zipFileName,
        xmlFileName,
        zipBuffer,
        zipBase64,
      };
    } catch (err: any) {
      throw new SunatInvalidZipException(
        `Error al empaquetar el XML en formato ZIP: ${err.message}`,
        { error: err.message },
      );
    }
  }

  /**
   * Descomprime el CDR en base64 devuelto por SUNAT y parsea su contenido XML
   */
  extractCdr(cdrBase64: string): CdrResult {
    try {
      const cdrBuffer = Buffer.from(cdrBase64, 'base64');
      const zip = new AdmZip(cdrBuffer);
      const zipEntries = zip.getEntries();

      if (!zipEntries || zipEntries.length === 0) {
        throw new SunatInvalidZipException('El ZIP del CDR devuelto por SUNAT está vacío.');
      }

      // Buscar el archivo XML del CDR (típicamente comienza con R-)
      let cdrXmlEntry = zipEntries.find((entry) => entry.entryName.toLowerCase().endsWith('.xml'));
      if (!cdrXmlEntry) {
        cdrXmlEntry = zipEntries[0];
      }

      const rawXml = cdrXmlEntry.getData().toString('utf-8');
      return this.parseCdrXml(rawXml);
    } catch (err: any) {
      if (err instanceof SunatInvalidZipException) throw err;
      throw new SunatInvalidZipException(
        `Error al descomprimir el CDR de SUNAT: ${err.message}`,
        { error: err.message },
      );
    }
  }

  /**
   * Parsea el XML de un CDR (ApplicationResponse)
   */
  parseCdrXml(rawXml: string): CdrResult {
    try {
      const parsed = this.xmlParser.parse(rawXml);
      const root = parsed.ApplicationResponse || parsed;

      const id = root.ID || '';
      const responseDate = root.ResponseDate || '';
      const responseTime = root.ResponseTime || '';

      // Navegar a DocumentResponse -> Response
      const docResponse = root.DocumentResponse || {};
      const response = docResponse.Response || {};

      const referenceId = response.ReferenceID || '';
      const responseCode = String(response.ResponseCode ?? '');
      const description = String(response.Description ?? '');

      // Extraer notas / observaciones si existen
      const notes: string[] = [];
      if (root.Note) {
        if (Array.isArray(root.Note)) {
          notes.push(...root.Note.map(String));
        } else {
          notes.push(String(root.Note));
        }
      }

      const isAccepted = responseCode === '0';

      return {
        rawXml,
        id,
        referenceId,
        responseCode,
        description,
        notes,
        responseDate,
        responseTime,
        isAccepted,
      };
    } catch (err: any) {
      this.logger.error(`Error parseando el XML del CDR: ${err.message}`);
      return {
        rawXml,
        id: '',
        referenceId: '',
        responseCode: '-1',
        description: 'Error parseando el CDR XML de SUNAT',
        notes: [],
        isAccepted: false,
      };
    }
  }
}
