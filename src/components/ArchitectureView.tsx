import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  Server,
  Database,
  RefreshCw,
  Send,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileCode2,
  Clock,
  Radio,
} from 'lucide-react';
import { DemoUser } from '../types';
import { DEMO_ACADEMIES } from '../data/mockApiData';

interface ArchitectureViewProps {
  currentUser: DemoUser;
  activeAcademyId: string;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  currentUser,
  activeAcademyId,
}) => {
  const [testAcademyId, setTestAcademyId] = useState(activeAcademyId);
  const [guardTestResult, setGuardTestResult] = useState<{
    allowed: boolean;
    status: number;
    code: string;
    message: string;
    membershipRole?: string;
  } | null>(null);

  const runTenantGuardSimulation = (targetId: string) => {
    // Check if user has active membership in targetId
    const membership = currentUser.memberships.find((m) => m.academyId === targetId);

    if (membership) {
      setGuardTestResult({
        allowed: true,
        status: 200,
        code: 'TENANT_CONTEXT_ESTABLISHED',
        message: `Acceso Autorizado. Contexto de tenant establecido para '${membership.academyName}' con rol [${membership.role}].`,
        membershipRole: membership.role,
      });
    } else {
      setGuardTestResult({
        allowed: false,
        status: 403,
        code: 'FORBIDDEN_TENANT_ACCESS',
        message: `Acceso Denegado: El usuario autenticado (${currentUser.email}) NO posee una membresía activa en la academia solicitada [${targetId}]. Regla de oro: Nunca confiar en el academyId enviado por el cliente.`,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Overview Card */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded border border-sky-500/30 font-bold uppercase">
                Modular Monolith + Multi-Tenant
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
                PostgreSQL + Prisma + BullMQ
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1.5 font-mono uppercase tracking-wide">
              Arquitectura del Sistema y Flujo de Aislamiento Tenant
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Nginx reverse proxy distribuye tráfico hacia la API NestJS. Base de datos compartida en PostgreSQL con discriminador obligatorio <code className="text-sky-400 font-mono">academyId</code>. Las tareas pesadas de facturación SUNAT y mensajería se despachan asíncronamente a colas BullMQ.
            </p>
          </div>
        </div>

        {/* Visual Pipeline Diagram */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2 relative">
          {/* Step 1 */}
          <div className="bg-[#090B10] border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 font-mono font-bold">
                <span>PASO 01</span>
                <Server className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h3 className="font-bold text-white text-xs font-mono uppercase">Cliente & Nginx</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Web Admin / App Móvil envía request con headers:
              </p>
              <div className="mt-1.5 bg-[#161B22] p-1.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800 space-y-0.5">
                <div>Authorization: Bearer ...</div>
                <div className="text-amber-400 font-bold">x-academy-id: ...</div>
              </div>
            </div>
            <div className="mt-2 text-[9px] text-slate-500 font-mono uppercase">Rate Limit: 30 req/s</div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#090B10] border border-blue-900/40 p-2.5 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] text-blue-400 mb-1.5 font-mono font-bold">
                <span>PASO 02</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-xs font-mono uppercase">JwtAuthGuard</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Valida la firma criptográfica del JWT y extrae:
              </p>
              <div className="mt-1.5 bg-[#161B22] p-1.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800 space-y-0.5">
                <div>userId: "usr-001"</div>
                <div>memberships: [...]</div>
              </div>
            </div>
            <div className="mt-2 text-[9px] text-blue-400 font-mono uppercase">401 si token inválido</div>
          </div>

          {/* Step 3: CRITICAL */}
          <div className="bg-[#090B10] border border-amber-500/60 p-2.5 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] text-amber-400 mb-1.5 font-mono font-bold">
                <span>PASO 03 [REGLA TENANT]</span>
                <Radio className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h3 className="font-bold text-amber-300 text-xs font-mono uppercase">TenantGuard</h3>
              <p className="text-[10px] text-slate-300 mt-1">
                Verifica que <code className="text-amber-300 font-mono">x-academy-id</code> pertenezca a las membresías del usuario.
              </p>
              <div className="mt-1.5 bg-[#161B22] p-1.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                <span className="text-rose-400 font-bold">Sin confianza ciega en ID de cliente</span>
              </div>
            </div>
            <div className="mt-2 text-[9px] text-amber-400 font-mono uppercase">403 FORBIDDEN si no es socio</div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#090B10] border border-purple-900/40 p-2.5 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] text-purple-400 mb-1.5 font-mono font-bold">
                <span>PASO 04</span>
                <Layers className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-xs font-mono uppercase">RolesGuard & Controller</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Aplica autorización granular según rol en el tenant:
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {['OWNER', 'ADMIN', 'COACH', 'CASHIER', 'STAFF', 'PARENT'].map((r) => (
                  <span key={r} className="text-[9px] bg-[#161B22] px-1 py-0.2 rounded text-purple-300 border border-slate-800 font-mono">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-2 text-[9px] text-purple-400 font-mono uppercase">Control de acceso RBAC</div>
          </div>

          {/* Step 5 */}
          <div className="bg-[#090B10] border border-emerald-900/40 p-2.5 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] text-emerald-400 mb-1.5 font-mono font-bold">
                <span>PASO 05</span>
                <Database className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-xs font-mono uppercase">Prisma & Postgres</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Ejecuta consulta filtrada por <code className="text-emerald-400 font-mono">academyId</code>:
              </p>
              <div className="mt-1.5 bg-[#161B22] p-1.5 rounded text-[10px] font-mono text-emerald-400 border border-slate-800">
                where: &#123; academyId: tenant.id &#125;
              </div>
            </div>
            <div className="mt-2 text-[9px] text-emerald-400 font-mono uppercase">Decimal para importes</div>
          </div>
        </div>
      </div>

      {/* Interactive Tenant Guard Security Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wide">
              Laboratorio de Validación Multi-Tenant (IDOR Test)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Prueba cómo reacciona <code className="text-sky-400 font-mono">TenantGuard</code> cuando el usuario intenta acceder a una academia con membresía válida vs intentar forzar el header <code className="text-amber-400 font-mono">x-academy-id</code> hacia una academia ajena.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                Usuario en Sesión (JWT):
              </label>
              <div className="bg-[#090B10] p-2.5 rounded border border-slate-800 text-[11px]">
                <div className="font-bold text-white font-mono">{currentUser.name} ({currentUser.email})</div>
                <div className="text-slate-500 text-[10px] font-mono uppercase mt-1">Membresías activas en base de datos:</div>
                <div className="mt-1.5 space-y-1">
                  {currentUser.memberships.map((m) => (
                    <div key={m.academyId} className="flex items-center justify-between bg-[#161B22] px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                      <span>{m.academyName}</span>
                      <span className="text-sky-400 font-bold">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                Academia en cabecera <code className="text-amber-400">x-academy-id</code>:
              </label>
              <select
                value={testAcademyId}
                onChange={(e) => setTestAcademyId(e.target.value)}
                className="w-full bg-[#090B10] border border-slate-800 text-slate-200 text-xs p-2 rounded focus:outline-none focus:border-sky-500 font-mono"
              >
                {DEMO_ACADEMIES.map((a) => {
                  const isMember = currentUser.memberships.some((m) => m.academyId === a.id);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.name} {isMember ? '[MEMBRESÍA OK]' : '[SIN MEMBRESÍA / AJENA]'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => runTenantGuardSimulation(testAcademyId)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-bold py-2 px-3 rounded transition flex items-center justify-center gap-1.5 uppercase"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Ejecutar Simulación de TenantGuard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Result of Simulation */}
        <div className="bg-[#0F1219] border border-slate-800 rounded p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wide flex items-center gap-2">
              <span>Resultado de la Validación del Guard</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
              Pipeline de Seguridad NestJS en Tiempo Real
            </p>

            {guardTestResult ? (
              <div className="mt-3 space-y-2.5">
                <div
                  className={`p-3 rounded border flex items-start gap-2.5 ${
                    guardTestResult.allowed
                      ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-700/60 text-rose-200'
                  }`}
                >
                  {guardTestResult.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">
                        HTTP {guardTestResult.status} {guardTestResult.allowed ? 'OK' : 'FORBIDDEN'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#090B10] border border-slate-700">
                        {guardTestResult.code}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 leading-relaxed">
                      {guardTestResult.message}
                    </p>
                  </div>
                </div>

                <div className="bg-[#090B10] p-2.5 rounded border border-slate-800 font-mono text-[10px]">
                  <div className="text-slate-500 uppercase font-bold mb-1">
                    Contexto Inyectado en `req.tenant`:
                  </div>
                  {guardTestResult.allowed ? (
                    <pre className="text-sky-400 text-[10px]">
{JSON.stringify(
  {
    academyId: testAcademyId,
    role: guardTestResult.membershipRole,
    validatedVia: 'User.memberships.find(m => m.academyId === header)',
  },
  null,
  2,
)}
                    </pre>
                  ) : (
                    <div className="text-rose-400 text-[10px]">
                      req.tenant = null; (Petición rechazada antes del controlador)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center py-8 border border-dashed border-slate-800 rounded text-slate-500 text-[10px] font-mono">
                Haz clic en "Ejecutar Simulación de TenantGuard" para probar la validación.
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Garantía: El cliente nunca puede forzar el tenant de otra academia.</span>
          </div>
        </div>
      </div>

      {/* BullMQ Asynchronous Queues Section */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-xs font-mono uppercase tracking-wide">
              Colas Asíncronas BullMQ (Procesamiento Desacoplado)
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            REDIS 7: 6379 / WORKER: dist/worker/worker.js
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          Sin llamadas externas pesadas dentro del request. Facturación SUNAT, WhatsApp y reportes procesados asíncronamente con reintentos automáticos y deduplicación.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            {
              name: 'billing',
              purpose: 'Facturación SUNAT UBL 2.1',
              desc: 'Generación de XML UBL, firma digital con certificado PEM y envío a SUNAT. CDR y reintentos.',
              badge: 'Idempotente',
              color: 'text-amber-400',
            },
            {
              name: 'whatsapp',
              purpose: 'Evolution API (WhatsApp)',
              desc: 'Notificaciones de matrícula, recibos de pago y avisos de suspensión sin bloquear la API REST.',
              badge: 'Reintentable',
              color: 'text-emerald-400',
            },
            {
              name: 'email',
              purpose: 'Envío de Correo SMTP',
              desc: 'Notificaciones a padres, comprobantes de pago en PDF y resúmenes semanales.',
              badge: 'Backoff 5s',
              color: 'text-sky-400',
            },
            {
              name: 'documents',
              purpose: 'Generación de PDFs',
              desc: 'Construcción asíncrona de boletas, facturas, contratos y carnets deportivos.',
              badge: 'Worker Dedicado',
              color: 'text-purple-400',
            },
            {
              name: 'reports',
              purpose: 'Cálculo de Reportes',
              desc: 'Balances financieros, liquidación de profesores y asistencia mensual.',
              badge: 'Bajo demanda',
              color: 'text-rose-400',
            },
            {
              name: 'reminders',
              purpose: 'Recordatorios de Sesiones',
              desc: 'Alarmas automáticas de clases para apoderados y entrenadores.',
              badge: 'Cron Programado',
              color: 'text-cyan-400',
            },
          ].map((queue) => (
            <div key={queue.name} className="bg-[#090B10] border border-slate-800 p-2.5 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-mono font-bold text-[11px] ${queue.color}`}>
                  Queue: {queue.name}
                </span>
                <span className="text-[9px] bg-[#161B22] text-slate-400 px-1.5 py-0.2 rounded border border-slate-800 font-mono">
                  {queue.badge}
                </span>
              </div>
              <div className="text-[11px] font-bold text-white font-mono">{queue.purpose}</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">{queue.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
