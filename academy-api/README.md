# Academy API — Plataforma de Gestión de Academias Deportivas (Perú)

Backend Modular Monolith Multi-Tenant construido con **NestJS**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, **Redis**, **BullMQ** y **Docker**.

---

## 🏛️ Arquitectura & Multi-Tenancy

- **Estrategia Multi-Tenant**: PostgreSQL compartido con `academyId` obligatorio en entidades tenant-scoped.
- **Seguridad Estricta de Tenant**: Nunca se confía en un `academyId` enviado libremente por el frontend. El contexto del tenant se resuelve a través de `TenantGuard`, validando las membresías y roles (`OWNER`, `ADMIN`, `COACH`, `CASHIER`, `STAFF`, `PARENT`) del usuario autenticado en JWT.
- **Precisión Monetaria**: Todos los importes financieros (cargos, pagos, asignaciones, créditos, reembolsos, facturas) utilizan `Decimal(10, 2)`. Prohibido el uso de `Float` para dinero.
- **Asincronía & Colas**: Procesamiento background mediante **BullMQ** con Redis para facturación SUNAT (UBL 2.1 XML + CDR), WhatsApp (Evolution API), Email y Recordatorios.

---

## 🚀 Inicio Rápido con Docker

Para levantar toda la infraestructura (Nginx + NestJS API + Worker + PostgreSQL + Redis):

```bash
# 1. Clonar variables de entorno
cp .env.example .env

# 2. Iniciar contenedores
docker compose up -d --build

# 3. Ejecutar migraciones de Prisma
docker compose exec api npx prisma migrate deploy

# 4. Verificar salud del sistema
curl http://localhost/api/v1/health
```

### URLs de Servicios Locales:
- **API Base**: `http://localhost/api/v1`
- **Swagger / OpenAPI**: `http://localhost/api/docs`
- **Health Check**: `http://localhost/api/v1/health`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 🧪 Pruebas Unitarias con Vitest

```bash
npm run test
```

Ejecuta las suites de pruebas para:
- `UblGeneratorService` (Generación de Facturas, Boletas, NC, ND bajo UBL 2.1 y catálogos SUNAT)
- `XmlSignerService` & `ZipPackagerService` (Firma digital XML-DSig, cálculo de digest, empaquetado ZIP y descompresión de CDR)
- `SunatClient` & `SunatClientFactory` (Manejo de SOAP Faults, errores de duplicidad 1033, autenticación y cambio dinámico Beta/Producción)
- `InvoicesService` (Ciclo de vida de facturación, correlativos secuenciales y persistencia)
- `TenantGuard` (Aislamiento de academias y prevención de IDOR)
- `AuthService` (Hashing bcrypt y generación de tokens JWT)
- `HealthService` (Verificación de disponibilidad de DB, Redis y BullMQ)

---

## 🧾 Integración con SUNAT Beta (Facturación Electrónica UBL 2.1)

El sistema cuenta con una integración nativa y directa con el **Servicio Web Beta de SUNAT**, sin intermediarios ni proveedores externos (PSE/OSE).

### 1. Comprobantes Soportados

| Tipo | Código SUNAT | Estructura UBL 2.1 | Referencia Obligatoria |
|---|---|---|---|
| **Factura Electrónica** | `01` | `<Invoice>` | Cliente con RUC (`schemeID="6"`) |
| **Boleta de Venta** | `03` | `<Invoice>` | Cliente con DNI (`schemeID="1"`), CE o Pasaporte |
| **Nota de Crédito** | `07` | `<CreditNote>` | `<cac:DiscrepancyResponse>` + `<cac:BillingReference>` |
| **Nota de Débito** | `08` | `<DebitNote>` | `<cac:DiscrepancyResponse>` + `<cac:BillingReference>` |

### 2. Variables de Entorno

Configuradas en `.env` (referencia en `.env.example`):

```env
# Entorno de facturación: "BETA" (pruebas/homologación) o "PRODUCTION"
SUNAT_ENV="BETA"

# Endpoint SOAP de SUNAT Beta
SUNAT_BETA_URL="https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService"

# Endpoint SOAP de SUNAT Producción (para activación futura)
SUNAT_PRODUCTION_URL="https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService"

# Credenciales de prueba oficiales de SUNAT Beta
SUNAT_RUC="20000000001"
SUNAT_SOL_USER="MODDATOS"
SUNAT_SOL_PASS="moddatos"

# Certificado Digital (opcional en Beta gracias al generador X.509 de pruebas integrado)
SUNAT_CERTIFICATE_PATH=""
SUNAT_CERTIFICATE_PASSWORD=""
SUNAT_TIMEOUT_MS=30000
```

> **Nota sobre el Certificado en Beta**: En modo Beta, el sistema genera automáticamente un par de claves RSA 2048 con certificado X.509 en memoria para realizar firmas XML-DSig válidas de inmediato. Para usar un certificado real (`.pfx`, `.p12` o `.pem`), simplemente configure `SUNAT_CERTIFICATE_PATH` y `SUNAT_CERTIFICATE_PASSWORD`.

### 3. Ciclo de Vida del Comprobante

1. **Generación UBL 2.1 (`UblGeneratorService`)**: Crea el XML conforme a las especificaciones y catálogos de SUNAT (Catálogo 01, 06, 07, 09, 10, 16, 51, 52 con monto en letras en español).
2. **Firma Digital XML-DSig (`XmlSignerService`)**: Aplica transformación `enveloped-signature`, calcula el hash SHA-256 (`DigestValue`), firma con RSA-SHA256 (`SignatureValue`) e incrusta el bloque `<ds:Signature>` en `<ext:ExtensionContent>`.
3. **Empaquetado ZIP (`ZipPackagerService`)**: Empaqueta el archivo siguiendo la nomenclatura obligatoria `{RUC}-{TIPO}-{SERIE}-{CORRELATIVO}.zip` conteniendo `{RUC}-{TIPO}-{SERIE}-{CORRELATIVO}.xml`.
4. **Envío SOAP (`SunatSoapClient` / `ISunatClient`)**: Invoca el método `sendBill` con cabeceras `WS-Security UsernameToken` (`{RUC}{SOL_USER}` y `{SOL_PASS}`).
5. **Procesamiento de CDR (`extractCdr`)**: Descomprime el `applicationResponse`, extrae el XML de la Constancia de Recepción (CDR) y evalúa el `<cbc:ResponseCode>`:
   - `0`: **ACEPTADO** (`status: ACCEPTED`).
   - `0` con `<cbc:Note>`: **ACEPTADO CON OBSERVACIONES**.
   - Códigos de error o SOAP Fault: **RECHAZADO** (`status: REJECTED`).
   - Código `1033`: **DUPLICADO** (`SunatDuplicateException`).
6. **Persistencia**: Se guardan en el modelo `Invoice` de Prisma:
   - `ublXml`: XML original UBL 2.1
   - `signedXml`: XML con firma digital
   - `sunatCdr`: XML del CDR de respuesta
   - `sunatCode`: Código de respuesta SUNAT
   - `sunatMessage`: Descripción oficial de SUNAT
   - `status`: `PENDING` -> `PROCESSING` -> `ACCEPTED` / `REJECTED`
   - `sentAt`: Timestamp del envío

### 4. Cómo Probar los Comprobantes

#### A) Vía Endpoint de Pruebas Rápidas (Directo a SUNAT Beta):
```bash
# Probar Boleta de Venta en SUNAT Beta
curl -X POST http://localhost:3001/api/v1/invoices/test-sunat-beta \
  -H "Content-Type: application/json" \
  -d '{"docType": "03", "series": "B001"}'

# Probar Factura Electrónica
curl -X POST http://localhost:3001/api/v1/invoices/test-sunat-beta \
  -H "Content-Type: application/json" \
  -d '{"docType": "01", "series": "F001"}'

# Probar Nota de Crédito
curl -X POST http://localhost:3001/api/v1/invoices/test-sunat-beta \
  -H "Content-Type: application/json" \
  -d '{"docType": "07", "series": "FC01"}'
```

#### B) Vía Emisión con Tenant (Flujo Completo):
```bash
curl -X POST http://localhost:3001/api/v1/invoices \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "x-academy-id: <ACADEMY_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceType": "BOLETA",
    "clientDocType": "1",
    "clientDocNum": "73456789",
    "clientName": "Carlos Mendoza",
    "items": [
      {
        "description": "Matrícula Verano 2026 - Fútbol",
        "quantity": 1,
        "unitPrice": 118.00
      }
    ],
    "sendImmediately": true
  }'
```

#### C) Procesamiento Asíncrono en BullMQ:
Al emitir con `"sendImmediately": false`, el trabajo se encola en la cola `billing`. El worker background (`src/worker/worker.ts`) procesa el trabajo con reintentos exponenciales y actualización en base de datos.

### 5. Consideraciones para el Paso a Producción

Para migrar a Producción sin cambiar una sola línea de código:
1. Cambiar `SUNAT_ENV="PRODUCTION"` en el archivo de entorno del servidor.
2. Configurar el RUC real y las credenciales del **Usuario Secundario SOL** creado en el portal de SUNAT con permisos para comprobantes electrónicos (`SUNAT_RUC`, `SUNAT_SOL_USER`, `SUNAT_SOL_PASS`).
3. Instalar el **Certificado Digital Tributario** (archivo `.pfx` o `.pem`) emitido por una entidad de certificación acreditada ante INDECOPI (Llamasoft, Reniec, Camerfirma, etc.), configurando `SUNAT_CERTIFICATE_PATH` y `SUNAT_CERTIFICATE_PASSWORD`.
4. El `SunatClientFactory` conmutará automáticamente al endpoint de producción `https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService`.

---

## 📦 Estructura Modular

```text
src/
├── main.ts                 # Bootstrap con Swagger, Helmet, ValidationPipe y GlobalFilter
├── app.module.ts           # Root module que ensambla módulos de dominio
├── common/
│   ├── decorators/         # @CurrentUser, @CurrentTenant, @Roles
│   ├── guards/             # JwtAuthGuard, TenantGuard, RolesGuard
│   ├── filters/            # HttpExceptionFilter
│   └── interceptors/       # LoggingInterceptor
├── database/               # PrismaService y DatabaseModule
├── redis/                  # RedisService y RedisModule
├── bullmq/                 # Configuración de colas (billing, whatsapp, email, reminders)
├── health/                 # HealthController & HealthService
├── auth/                   # Autenticación JWT, Refresh Tokens y Login
├── users/                  # Registro y consulta de usuarios
├── academies/              # Gestión de Academias (Tenants)
├── memberships/            # Asignación y control de roles por academia
└── worker/                 # Worker process BullMQ
```
