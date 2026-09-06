# Academy Web (`academy-web`)

Frontend SPA independiente y desacoplado para la gestión integral de academias formativas y deportivas en el Perú.

Desarrollado en **React 19 + TypeScript + Tailwind CSS 4 + Vite**, este proyecto maneja **exclusivamente la interfaz de usuario** para directores, entrenadores, cajeros y personal de admisión, consumiendo los endpoints de **`academy-api`** (NestJS) a través de una capa de servicios tipada (`apiClient.ts`).

---

## 🏗️ Arquitectura Desacoplada

```
+-------------------------------------------------------------+
|                  academy-web (Frontend SPA)                 |
|  (React 19, Tailwind 4, Lucide, WebDashboard, WebCashier)   |
+-------------------------------------------------------------+
                              |
                     HTTP / REST (JSON)
           Headers: Authorization (JWT), x-academy-id
                              v
+-------------------------------------------------------------+
|                  academy-api (NestJS Backend)               |
|   (PostgreSQL 16, Prisma ORM, Redis 7, BullMQ, SUNAT UBL)   |
+-------------------------------------------------------------+
```

### Principios de Diseño
1. **Separación de Responsabilidades:** `academy-web` no contiene lógica de base de datos ni emulación de servidores; se enfoca en UX/UI fluida, validación de formularios y visualización de métricas en tiempo real.
2. **Multi-Tenancy por Header:** Todas las peticiones al backend adjuntan automáticamente el header HTTP `x-academy-id: <id_sede>`, permitiendo cambiar de academia en un clic sin recargar la app.
3. **Autenticación con JWT:** Tokens bearer emitidos por `POST /api/v1/auth/login` con roles RBAC (`OWNER`, `ADMIN`, `COACH`, `CASHIER`, `STAFF`).
4. **Resiliencia & Modo Standalone:** El cliente API detecta si `academy-api` está en línea o fuera de línea. Si el backend está desconectado, conmuta fluidamente a almacenamiento local con notificación visual en la barra superior.

---

## 📦 Estructura del Proyecto

```
academy-web/
├── nginx/
│   └── default.conf         # Configuración Nginx para producción
├── src/
│   ├── components/          # Componentes de interfaz de usuario
│   │   ├── WebNavbar.tsx    # Barra de navegación exclusiva para personal
│   │   ├── WebDashboard.tsx # Panel de control y métricas del día
│   │   ├── WebStudents.tsx  # Padrón de alumnos, matrículas y apoderados
│   │   ├── WebClasses.tsx   # Clases en cancha y toma de asistencia
│   │   ├── WebCashier.tsx   # Caja, cobros, Yape/Plin/Efectivo DECIMAL(10,2)
│   │   ├── WebBilling.tsx   # Facturas y Boletas electrónicas SUNAT
│   │   ├── WebAdminPanel.tsx# Perfil de sede, deportes, entrenadores y tarifas
│   │   └── SaaSTrialBanner.tsx # Alerta de cuotas y planes SaaS
│   ├── services/
│   │   └── apiClient.ts     # Cliente HTTP desacoplado hacia academy-api
│   ├── data/
│   │   ├── academyData.ts   # Datos iniciales para modo sin conexión / demo
│   │   └── mockAdminData.ts # Catálogo base de disciplinas y tarifas
│   ├── types/
│   │   └── index.ts         # Contratos de datos compartidos
│   ├── App.tsx              # Componente principal de la app
│   ├── main.tsx             # Entrypoint React
│   └── index.css            # Estilos globales Tailwind CSS
├── Dockerfile               # Imagen Docker de producción (Nginx Alpine)
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración TypeScript
└── vite.config.ts           # Configuración Vite con Proxy inverso a API
```

---

## 🚀 Puesta en Marcha Local

### 1. Requisitos
* Node.js v20+
* Backend `academy-api` corriendo en `http://localhost:3001` (opcional si usas el modo offline/demo integrado)

### 2. Instalación de Dependencias
```bash
cd academy-web
npm install
```

### 3. Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Ajusta la URL de la API:
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### 4. Modo Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 5. Compilación para Producción
```bash
npm run build
```
Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

---

## 🐳 Ejecución con Docker Compose

Desde la raíz del repositorio:
```bash
docker-compose up --build -d
```
Esto levantará:
* `academy-web`: `http://localhost:3000` (o `http://localhost` vía Nginx)
* `academy-api`: `http://localhost:3001`
* `postgres`: `localhost:5432`
* `redis`: `localhost:6379`
