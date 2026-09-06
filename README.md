# Plataforma de Gestión para Academias Deportivas en Perú ⚽🇵🇪

Sistema integral de gestión deportiva, facturación electrónica SUNAT (UBL 2.1), cobranza express (Yape/Plin), control de asistencia en 30 segundos y arqueo de caja para academias formativas y competitivas.

---

## 🏛️ Arquitectura del Proyecto

El repositorio está organizado en una arquitectura de monorrepósito limpio y desacoplado:

| Carpeta | Descripción | Stack Tecnológico | Puerto Local | Puerto Docker |
|---|---|---|---|---|
| **`academy-api`** | Backend API REST multi-tenant & Workers | NestJS 10, Prisma ORM, PostgreSQL 16, Redis 7, BullMQ, Facturación UBL 2.1 | `3001` | `3001` (interno/host) |
| **`academy-web`** | Panel Web Administrativo & Gestión | React 19, TypeScript, Tailwind CSS 4, Vite | `3000` / `5173` | `8080` (Nginx) |
| **`academy-mobile`** | App Móvil de Campo (APK / PWA) | React 19, TypeScript, Tailwind CSS 4, Capacitor Ready | `3000` / `5174` | `8081` (Nginx) |
| **`docs`** | Documentación técnica y especificaciones | Markdown & Guías SUNAT | - | - |

---

## 🚀 Opción 1: Despliegue Completo con Docker (Producción / Staging)

Todo el ecosistema (PostgreSQL, Redis, API NestJS, Worker asíncrono, Frontend Web, App Móvil y Reverse Proxy Nginx) está completamente configurado en `docker-compose.yml`.

### Requisitos Previos
- Docker Engine `>= 24.0.0`
- Docker Compose `>= v2.20.0`

### 1. Variables de Entorno
Copia el archivo de variables base en la raíz o en cada subproyecto según corresponda:
```bash
# Variables del backend API
cp academy-api/.env.example academy-api/.env
```

### 2. Levantar todos los servicios
Ejecuta en la raíz del repositorio:
```bash
# Construir y levantar todos los contenedores en segundo plano
docker compose up -d --build
```

### 3. Verificar el estado de los servicios
```bash
docker compose ps
```

### 4. Servicios Disponibles en Docker
- **Frontend Web (Administración)**: [http://localhost:8080](http://localhost:8080)
- **App Móvil de Campo (Web / PWA)**: [http://localhost:8081](http://localhost:8081)
- **Backend API REST**: [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **Documentación Swagger / OpenAPI**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **Nginx Ingress / Gateway**: [http://localhost:80](http://localhost:80)
- **PostgreSQL**: `localhost:5432` (`academy_db`)
- **Redis**: `localhost:6379`

### 5. Detener los contenedores
```bash
docker compose down
# O si deseas limpiar también los volúmenes de datos:
# docker compose down -v
```

---

## 💻 Opción 2: Ejecución Local para Desarrollo (Paso a Paso)

Para desarrollo activo y depuración con hot-reload en cada componente:

### Requisitos Previos
- **Node.js**: `>= 20.x` LTS
- **npm**: `>= 10.x`
- **Docker** (para PostgreSQL y Redis locales)

---

### Paso 1: Levantar Bases de Datos (PostgreSQL & Redis)
Puedes usar Docker para tener rápidamente las dependencias de base de datos sin instalar software adicional:

```bash
# Levanta únicamente Postgres y Redis
docker compose up -d postgres redis
```

---

### Paso 2: Configurar y Ejecutar `academy-api` (Backend)

```bash
cd academy-api

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar cliente de Prisma y ejecutar migraciones
npm run prisma:generate
npm run prisma:migrate

# 4. Iniciar API en modo desarrollo (Watch Mode)
npm run start:dev
```
- La API responderá en: **`http://localhost:3001/api/v1`**
- Swagger estará disponible en: **`http://localhost:3001/api/docs`**

#### Ejecutar el Worker de Tareas Asíncronas (SUNAT / WhatsApp):
En una terminal separada dentro de `academy-api`:
```bash
npm run worker
```

---

### Paso 3: Configurar y Ejecutar `academy-web` (Panel Administrativo)

```bash
cd academy-web

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor Vite de desarrollo
npm run dev
```
- El panel web se abrirá en: **`http://localhost:3000`** (o el puerto configurado por Vite).

---

### Paso 4: Configurar y Ejecutar `academy-mobile` (App de Campo)

```bash
cd academy-mobile

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor Vite de desarrollo
npm run dev
```
- La app móvil se abrirá en su puerto local con el emulador interactivo de pantalla de smartphone.

#### Compilar a APK Nativo Android con Capacitor:
```bash
cd academy-mobile

# 1. Compilar distribución web
npm run build

# 2. Agregar plataforma Android (si es la primera vez)
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Academy Mobile" "pe.academy.mobile" --web-dir dist
npx cap add android

# 3. Sincronizar y abrir en Android Studio
npx cap sync
npx cap open android
```

---

## 🧪 Pruebas Unitarias y Validación

```bash
# Pruebas unitarias en el backend (NestJS / Vitest)
cd academy-api && npm run test

# Verificación de tipos en Frontend Web
cd academy-web && npm run lint

# Verificación de tipos en App Móvil
cd academy-mobile && npm run lint
```

---

## 📋 Resumen de Puertos y Enrutamiento

| Servicio | Puerto Local Dev | Puerto Contenedor Docker | Mapeo Host Docker |
|---|---|---|---|
| **Nginx Reverse Proxy** | - | `80`, `443` | `80:80`, `443:443` |
| **academy-web** | `3000` | `80` | `8080:80` |
| **academy-mobile** | `3000` | `80` | `8081:80` |
| **academy-api** | `3001` | `3001` | `3001:3001` |
| **PostgreSQL 16** | `5432` | `5432` | `5432:5432` |
| **Redis 7** | `6379` | `6379` | `6379:6379` |

---

## 🔒 Credenciales por Defecto (Entorno de Pruebas)

- **PostgreSQL**: Usuario `postgres`, Contraseña `postgres123`, Base de datos `academy_db`
- **Credenciales Demo API / Web**:
  - `admin@cracksfc.pe` / `admin123` (Dueño / Administrador)
  - `caja@cracksfc.pe` / `caja123` (Cajero / Operador de campo)
  - `profesor@cracksfc.pe` / `profe123` (Entrenador)
- **SUNAT Homologación**:
  - RUC Demo: `20000000001`
  - Usuario SOL: `MODDATOS`
  - Clave SOL: `moddatos`
