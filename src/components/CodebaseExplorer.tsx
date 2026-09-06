import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Copy,
  Check,
  FileText,
  ChevronRight,
  Database,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  category: string;
  code: string;
}

export const CodebaseExplorer: React.FC = () => {
  const files: CodeFile[] = [
    {
      path: 'src/common/guards/tenant.guard.ts',
      name: 'tenant.guard.ts',
      category: 'Seguridad & Multi-Tenancy',
      code: `import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'USER_CONTEXT_MISSING',
        message: 'No se encontró contexto de usuario autenticado para validar el tenant',
      });
    }

    const headerAcademyId = request.headers['x-academy-id'] as string;
    const paramAcademyId = request.params?.academyId as string;
    const requestedAcademyId = headerAcademyId || paramAcademyId;
    const memberships = user.memberships || [];

    if (!memberships.length) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'NO_ACTIVE_MEMBERSHIPS',
        message: 'El usuario no pertenece a ninguna academia activa',
      });
    }

    let targetAcademyId = requestedAcademyId;
    if (!targetAcademyId) {
      if (memberships.length === 1) {
        targetAcademyId = memberships[0].academyId;
      } else {
        throw new BadRequestException({
          statusCode: 400,
          code: 'ACADEMY_CONTEXT_REQUIRED',
          message: 'Debes especificar la academia activa mediante la cabecera x-academy-id',
        });
      }
    }

    // STRICT MULTI-TENANCY RULE:
    // Nunca confiar en un academyId enviado directamente por el frontend.
    // El contexto de tenant debe provenir del usuario autenticado y sus memberships.
    const matchingMembership = memberships.find(
      (m: { academyId: string; role: string }) => m.academyId === targetAcademyId,
    );

    if (!matchingMembership) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FORBIDDEN_TENANT_ACCESS',
        message: 'No tienes permisos ni membresía activa en la academia solicitada',
      });
    }

    request.tenant = {
      academyId: matchingMembership.academyId,
      role: matchingMembership.role,
    };

    return true;
  }
}`,
    },
    {
      path: 'src/main.ts',
      name: 'main.ts',
      category: 'Bootstrap & Configuración',
      code: `import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-academy-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Plataforma de Gestión de Academias Deportivas API')
    .setDescription('API Modular Monolith Multi-Tenant (Perú)')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-academy-id' }, 'x-academy-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(\`🚀 API running on port \${port}\`);
}
bootstrap();`,
    },
    {
      path: 'src/auth/auth.service.ts',
      name: 'auth.service.ts',
      category: 'Autenticación JWT',
      code: `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      include: {
        memberships: {
          where: { isActive: true },
          include: { academy: { select: { id: true, name: true, isActive: true } } },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo electrónico o contraseña incorrectos',
      });
    }

    const isValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo electrónico o contraseña incorrectos',
      });
    }

    const activeMemberships = user.memberships
      .filter((m) => m.academy.isActive)
      .map((m) => ({
        academyId: m.academyId,
        academyName: m.academy.name,
        role: m.role,
        isDefault: m.isDefault,
      }));

    const tokens = await this.generateTokens(user.id, user.email, activeMemberships);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        memberships: activeMemberships,
      },
    };
  }
}`,
    },
    {
      path: 'src/health/health.service.ts',
      name: 'health.service.ts',
      category: 'Health Check',
      code: `import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../bullmq/bullmq.module';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject('BULLMQ_QUEUES') private readonly queues: Record<string, Queue>,
  ) {}

  async check() {
    const start = Date.now();
    let dbStatus = 'disconnected';
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw\`SELECT 1\`;
      dbStatus = 'connected';
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'disconnected';
    }

    let redisStatus = 'disconnected';
    try {
      const ping = await this.redis.ping();
      redisStatus = ping === 'PONG' ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        database: { status: dbStatus, latencyMs: dbLatency, type: 'PostgreSQL (Prisma)' },
        redis: { status: redisStatus },
        bullmq: { status: redisStatus === 'connected' ? 'active' : 'degraded' },
      },
    };
  }
}`,
    },
    {
      path: 'src/worker/worker.ts',
      name: 'worker.ts',
      category: 'Colas & Workers BullMQ',
      code: `import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

// Worker de Facturación Electrónica SUNAT (UBL 2.1)
const billingWorker = new Worker(
  'billing',
  async (job: Job) => {
    console.log(\`Procesando comprobante \${job.data.invoiceId} para academia \${job.data.academyId}\`);
    // 1. Construir XML UBL
    // 2. Firmar digitalmente con certificado PEM
    // 3. Enviar a Web Service SUNAT
    // 4. Procesar CDR y actualizar estado en base de datos
    return { success: true, cdrStatus: 'ACCEPTED' };
  },
  { connection, concurrency: 5 },
);

// Worker de WhatsApp (Evolution API)
const whatsappWorker = new Worker(
  'whatsapp',
  async (job: Job) => {
    console.log(\`Enviando mensaje WhatsApp a \${job.data.phone}\`);
    return { success: true };
  },
  { connection, concurrency: 10 },
);`,
    },
  ];

  const [selectedFile, setSelectedFile] = useState<CodeFile>(files[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* File Tree List */}
      <div className="lg:col-span-4 bg-[#0F1219] border border-slate-800 rounded p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wide">academy-api / src</h3>
          </div>
          <span className="text-[9px] font-mono uppercase text-slate-500 font-bold">{files.length} FILES</span>
        </div>

        <div className="space-y-1">
          {files.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded border transition text-[11px] flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#161B22] border-sky-500 text-white font-bold shadow-sm'
                    : 'bg-[#090B10] border-slate-800/80 text-slate-400 hover:bg-[#161B22]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="font-mono text-[11px] truncate">{file.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="lg:col-span-8 bg-[#0F1219] border border-slate-800 rounded p-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-200 font-bold">
                  {selectedFile.path}
                </span>
                <span className="text-[9px] uppercase bg-[#090B10] text-sky-400 px-1.5 py-0.2 rounded border border-slate-800 font-mono font-bold">
                  {selectedFile.category}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-300 hover:text-white px-2.5 py-1 rounded bg-[#161B22] border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <pre className="mt-2.5 bg-[#090B10] p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed">
            {selectedFile.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
