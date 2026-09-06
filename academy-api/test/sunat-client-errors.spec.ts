import { describe, it, expect, vi } from 'vitest';
import { SunatSoapClient } from '../src/sunat/client/sunat-soap.client';
import { SunatClientFactory } from '../src/sunat/client/sunat-client.factory';
import { SunatBetaClient } from '../src/sunat/client/sunat-beta.client';
import { SunatProductionClient } from '../src/sunat/client/sunat-production.client';
import {
  SunatDuplicateException,
  SunatAuthenticationException,
  SunatRejectionException,
  SunatTimeoutException,
} from '../src/sunat/exceptions/sunat.exceptions';

describe('SunatSoapClient & SunatClientFactory (Adapter & Error Handling)', () => {
  describe('SunatSoapClient SOAP Fault Handling', () => {
    const client = new SunatSoapClient(
      'BETA',
      'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
      '20000000001MODDATOS',
      'moddatos',
      1000,
    );

    it('debe detectar comprobante duplicado (código 1033) y lanzar SunatDuplicateException', async () => {
      const duplicateSoapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <soapenv:Fault>
      <faultcode>soapenv:Client.1033</faultcode>
      <faultstring>El comprobante fue registrado previamente con otros datos</faultstring>
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>`;

      // Mock de fetch global
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 500,
          text: async () => duplicateSoapResponse,
        }),
      );

      await expect(
        client.sendBill('20000000001-01-F001-00000042.zip', 'BASE64_DUMMY'),
      ).rejects.toThrow(SunatDuplicateException);

      vi.unstubAllGlobals();
    });

    it('debe detectar error de autenticación (código 0100) y lanzar SunatAuthenticationException', async () => {
      const authSoapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <soapenv:Fault>
      <faultcode>soapenv:Client.0100</faultcode>
      <faultstring>El RUC no coincide con el usuario SOL ingresado</faultstring>
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>`;

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 500,
          text: async () => authSoapResponse,
        }),
      );

      await expect(
        client.sendBill('20000000001-01-F001-00000042.zip', 'BASE64_DUMMY'),
      ).rejects.toThrow(SunatAuthenticationException);

      vi.unstubAllGlobals();
    });

    it('debe lanzar SunatRejectionException para otros errores de validación SOAP de SUNAT', async () => {
      const genericFault = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <soapenv:Fault>
      <faultcode>soapenv:Client.2015</faultcode>
      <faultstring>El RUC del receptor no está activo en el padrón</faultstring>
    </soapenv:Fault>
  </soapenv:Body>
</soapenv:Envelope>`;

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          status: 500,
          text: async () => genericFault,
        }),
      );

      await expect(
        client.sendBill('20000000001-01-F001-00000042.zip', 'BASE64_DUMMY'),
      ).rejects.toThrow(SunatRejectionException);

      vi.unstubAllGlobals();
    });

    it('debe lanzar SunatTimeoutException si la solicitud excede el tiempo límite', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          const abortError = new Error('AbortError');
          abortError.name = 'AbortError';
          return Promise.reject(abortError);
        }),
      );

      await expect(
        client.sendBill('20000000001-01-F001-00000042.zip', 'BASE64_DUMMY'),
      ).rejects.toThrow(SunatTimeoutException);

      vi.unstubAllGlobals();
    });
  });

  describe('SunatClientFactory (Adapter Switching)', () => {
    const betaClient = new SunatBetaClient();
    const prodClient = new SunatProductionClient();
    const factory = new SunatClientFactory(betaClient, prodClient);

    it('debe retornar SunatBetaClient cuando se solicita entorno BETA', () => {
      const client = factory.getClient('BETA');
      expect(client.envName).toBe('BETA');
      expect(client.serviceUrl).toContain('e-beta.sunat.gob.pe');
    });

    it('debe retornar SunatProductionClient cuando se solicita entorno PRODUCTION', () => {
      const client = factory.getClient('PRODUCTION');
      expect(client.envName).toBe('PRODUCTION');
      expect(client.serviceUrl).toContain('e-factura.sunat.gob.pe');
    });
  });
});
