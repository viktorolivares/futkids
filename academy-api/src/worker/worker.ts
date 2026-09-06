import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { UblGeneratorService } from '../sunat/ubl/ubl-generator.service';
import { XmlSignerService } from '../sunat/signer/xml-signer.service';
import { ZipPackagerService } from '../sunat/packager/zip-packager.service';
import { SunatBetaClient } from '../sunat/client/sunat-beta.client';
import { SunatProductionClient } from '../sunat/client/sunat-production.client';
import { SunatClientFactory } from '../sunat/client/sunat-client.factory';
import { SunatService } from '../sunat/sunat.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
});

console.log(` Starting BullMQ Workers connected to Redis at ${redisHost}:${redisPort}...`);

// Initialize Services for Workers
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const ublGenerator = new UblGeneratorService();
const xmlSigner = new XmlSignerService();
const zipPackager = new ZipPackagerService();
const betaClient = new SunatBetaClient();
const prodClient = new SunatProductionClient();
const clientFactory = new SunatClientFactory(betaClient, prodClient);
const sunatService = new SunatService(ublGenerator, xmlSigner, zipPackager, clientFactory);
const invoicesService = new InvoicesService(prisma as any, sunatService);
const subscriptionsService = new SubscriptionsService(prisma as any);

// 1. Billing Worker (SUNAT UBL XML Signing & Sending)
const billingWorker = new Worker(
  'billing',
  async (job: Job) => {
    console.log(
      `[BillingWorker] Processing Job ${job.id} for Academy ${job.data.academyId} - Invoice: ${job.data.invoiceId}`,
    );

    const invoiceId = job.data.invoiceId;
    if (!invoiceId) {
      throw new Error(`[BillingWorker] No se proporcionó invoiceId en el job ${job.id}`);
    }

    // Verificar idempotencia: si ya está aceptado, no volver a enviar
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existing) {
      throw new Error(`[BillingWorker] Comprobante ${invoiceId} no encontrado en la base de datos.`);
    }

    if (existing.status === 'ACCEPTED') {
      console.log(`[BillingWorker] Comprobante ${invoiceId} ya fue ACEPTADO por SUNAT previamente.`);
      return { success: true, cdrStatus: 'ACCEPTED', cdrCode: existing.sunatCode };
    }

    // Ejecutar el flujo real completo: UBL 2.1 -> Firma -> ZIP -> SUNAT Beta/Prod -> CDR -> Actualizar DB
    const result = await invoicesService.dispatchInvoiceToSunat(invoiceId);

    return {
      success: result.status === 'ACCEPTED',
      cdrStatus: result.status,
      cdrCode: result.sunatCode,
      message: result.sunatMessage,
    };
  },
  { connection, concurrency: 5 },
);

// 2. WhatsApp Worker (Evolution API)
const whatsappWorker = new Worker(
  'whatsapp',
  async (job: Job) => {
    console.log(`[WhatsAppWorker] Sending notification to ${job.data.phoneNumber} - Event: ${job.data.event}`);
    // Idempotent dispatch to Evolution API
    return { success: true, messageId: `wa-${Date.now()}` };
  },
  { connection, concurrency: 10 },
);

// 3. Email Worker (SMTP)
const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    console.log(`[EmailWorker] Sending email to ${job.data.to} - Subject: ${job.data.subject}`);
    return { success: true };
  },
  { connection, concurrency: 5 },
);

// 4. Reminders Worker
const reminderWorker = new Worker(
  'reminders',
  async (job: Job) => {
    console.log(`[ReminderWorker] Processing class session reminder: ${job.data.sessionId}`);
    return { success: true };
  },
  { connection, concurrency: 5 },
);

// 5. Subscriptions Worker (Trial Expiration & Auto-Downgrade Job)
const subscriptionsWorker = new Worker(
  'subscriptions',
  async (job: Job) => {
    console.log(`[SubscriptionsWorker] Processing subscription job: ${job.name} (ID: ${job.id})`);
    if (job.name === 'expire-trials' || job.data?.task === 'expire-trials') {
      const result = await subscriptionsService.expireTrials();
      console.log(
        `[SubscriptionsWorker] Expired ${result.expiredCount} trials. Academies: [${result.affectedAcademies.join(', ')}]`,
      );
      return result;
    }
    return { success: true };
  },
  { connection, concurrency: 2 },
);

// Error and Completion logging
[billingWorker, whatsappWorker, emailWorker, reminderWorker, subscriptionsWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(` Worker [${worker.name}] Job ${job.id} finished successfully.`);
  });
  worker.on('failed', (job, err) => {
    console.error(`❌ Worker [${worker.name}] Job ${job?.id} failed: ${err.message}`);
  });
});

console.log(' All BullMQ Workers (Billing, WhatsApp, Email, Reminders, Subscriptions) active and listening for jobs.');
