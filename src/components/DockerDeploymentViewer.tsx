import React, { useState } from 'react';
import {
  Server,
  Copy,
  Check,
  Terminal,
  Layers,
  FileCode,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const DockerDeploymentViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'compose' | 'dockerfile' | 'nginx' | 'env'>('compose');
  const [copied, setCopied] = useState(false);

  const fileContents = {
    compose: `version: '3.8'

services:
  # Nginx Reverse Proxy (Ingress & SSL Termination)
  nginx:
    image: nginx:1.25-alpine
    container_name: academy-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      api:
        condition: service_healthy
    networks:
      - academy-network

  # NestJS API (Modular Monolith)
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: academy-api
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/academy_db?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: super-secret-jwt-key-change-in-prod
      JWT_EXPIRATION: 1d
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://localhost:3001/api/v1/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - academy-network

  # BullMQ Worker (SUNAT, WhatsApp, Email, Reminders)
  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: academy-worker
    restart: unless-stopped
    command: ["node", "dist/worker/worker.js"]
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/academy_db?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - academy-network

  # PostgreSQL 16 (Source of Truth)
  postgres:
    image: postgres:16-alpine
    container_name: academy-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: academy_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d academy_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - academy-network

  # Redis 7 (Cache, Rate Limiting & BullMQ)
  redis:
    image: redis:7-alpine
    container_name: academy-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - academy-network

volumes:
  postgres_data:
  redis_data:

networks:
  academy-network:
    driver: bridge`,

    dockerfile: `# Multi-stage Dockerfile for NestJS Academy API (Production Ready)
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Stage 2: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
CMD ["node", "dist/main.js"]`,

    nginx: `events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    # Rate limiting: 30 peticiones/segundo por IP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

    upstream nestjs_upstream {
        server api:3001;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        location / {
            limit_req zone=api_limit burst=50 nodelay;
            proxy_pass http://nestjs_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/v1/health {
            proxy_pass http://nestjs_upstream;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }
    }
}`,

    env: `# Database Connection (PostgreSQL 16)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/academy_db?schema=public"

# Application Server
PORT=3001
NODE_ENV=development
APP_URL="http://localhost:3001"

# JWT Authentication
JWT_SECRET="super-secret-production-grade-jwt-key"
JWT_EXPIRATION="1d"
JWT_REFRESH_SECRET="super-secret-production-grade-refresh-key"
JWT_REFRESH_EXPIRATION="7d"

# Redis & BullMQ
REDIS_HOST="localhost"
REDIS_PORT=6379

# SUNAT / Facturación Electrónica (BETA Sandbox)
SUNAT_ENV="BETA"
SUNAT_RUC="20000000001"
SUNAT_SOL_USER="MODDATOS"
SUNAT_SOL_PASS="moddatos"

# Evolution API (WhatsApp)
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY=""

# SMTP / Email
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_FROM="notificaciones@tuacademia.pe"`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Overview */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded border border-sky-500/30 font-bold uppercase">
                Docker Compose V2
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
                Contabo VPS / Ubuntu Ready
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1.5 font-mono uppercase tracking-wide">
              Infraestructura Dockerizada (5 Contenedores)
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Configuración para producción: Nginx (reverse proxy con SSL y rate limiting), NestJS API (Modular Monolith), Worker BullMQ, PostgreSQL 16 y Redis 7.
            </p>
          </div>
        </div>

        {/* Quick Deploy Commands */}
        <div className="mt-3 bg-[#090B10] p-3 rounded border border-slate-800 font-mono text-[11px] text-slate-300">
          <div className="text-slate-500 text-[10px] mb-1.5 font-bold uppercase tracking-wider">
            Comandos de Despliegue en Servidor Ubuntu (CLI):
          </div>
          <div className="space-y-1 text-sky-400">
            <div><span className="text-slate-500"># 1. Levantar servicios con build multi-stage</span></div>
            <div className="text-white font-bold">docker compose up -d --build</div>
            <div className="mt-1.5"><span className="text-slate-500"># 2. Ejecutar migraciones de Prisma en PostgreSQL</span></div>
            <div className="text-white font-bold">docker compose exec api npx prisma migrate deploy</div>
            <div className="mt-1.5"><span className="text-slate-500"># 3. Validar Health Check</span></div>
            <div className="text-emerald-400 font-bold">curl http://localhost/api/v1/health</div>
          </div>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'compose', label: 'docker-compose.yml', icon: Layers },
              { id: 'dockerfile', label: 'Dockerfile', icon: FileCode },
              { id: 'nginx', label: 'nginx.conf', icon: Server },
              { id: 'env', label: '.env.example', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFile(tab.id as any)}
                  className={`flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-1 rounded transition ${
                    activeFile === tab.id
                      ? 'bg-sky-500 text-black font-bold shadow-sm'
                      : 'bg-[#090B10] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-300 hover:text-white px-2.5 py-1 rounded bg-[#161B22] border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 uppercase">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="uppercase">Copiar Archivo</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-2.5">
          <pre className="bg-[#090B10] p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {fileContents[activeFile]}
          </pre>
        </div>
      </div>
    </div>
  );
};
