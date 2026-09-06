import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Code2,
  Lock,
  Globe,
  Tag,
  AlertTriangle,
  FileJson,
  CornerDownRight,
} from 'lucide-react';
import { ApiEndpoint, DemoUser, ApiResponseSimulation } from '../types';
import { API_ENDPOINTS, DEMO_ACADEMIES } from '../data/mockApiData';

interface SwaggerExplorerProps {
  currentUser: DemoUser;
  activeAcademyId: string;
}

export const SwaggerExplorer: React.FC<SwaggerExplorerProps> = ({
  currentUser,
  activeAcademyId,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    selectedEndpoint.defaultBody ? JSON.stringify(selectedEndpoint.defaultBody, null, 2) : '',
  );
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseOutput, setResponseOutput] = useState<ApiResponseSimulation | null>(null);

  const activeAcademy = DEMO_ACADEMIES.find((a) => a.id === activeAcademyId);
  const currentMembership = currentUser.memberships.find((m) => m.academyId === activeAcademyId);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestBodyText(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseOutput(null);
  };

  const handleExecuteRequest = () => {
    setLoading(true);
    const startTime = performance.now();

    setTimeout(() => {
      const duration = Math.round(performance.now() - startTime + Math.random() * 25 + 15);
      let simulatedResponse: ApiResponseSimulation;

      // Check Tenant Security for endpoints requiring tenant
      if (selectedEndpoint.requiresTenant) {
        if (!currentMembership) {
          simulatedResponse = {
            status: 403,
            statusText: 'Forbidden',
            durationMs: duration,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'x-tenant-guarded': 'true',
            },
            data: {
              statusCode: 403,
              code: 'FORBIDDEN_TENANT_ACCESS',
              message: `No tienes permisos ni membresía activa en la academia solicitada [${activeAcademyId}].`,
              path: selectedEndpoint.path,
              timestamp: new Date().toISOString(),
            },
          };
          setResponseOutput(simulatedResponse);
          setLoading(false);
          return;
        }

        // Check RolesGuard if endpoint specifies requiredRole
        if (selectedEndpoint.requiredRole && !selectedEndpoint.requiredRole.includes(currentMembership.role)) {
          simulatedResponse = {
            status: 403,
            statusText: 'Forbidden',
            durationMs: duration,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'x-role-guarded': 'true',
            },
            data: {
              statusCode: 403,
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `Acción denegada: Se requiere uno de los roles [${selectedEndpoint.requiredRole.join(', ')}]. Tu rol actual es [${currentMembership.role}].`,
              path: selectedEndpoint.path,
              timestamp: new Date().toISOString(),
            },
          };
          setResponseOutput(simulatedResponse);
          setLoading(false);
          return;
        }
      }

      // Endpoint-specific successful simulations
      switch (selectedEndpoint.id) {
        case 'health-check':
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: { 'content-type': 'application/json; charset=utf-8' },
            data: {
              status: 'ok',
              timestamp: new Date().toISOString(),
              uptimeSeconds: 14280,
              environment: 'development',
              version: '1.0.0',
              services: {
                database: {
                  status: 'connected',
                  latencyMs: 14,
                  type: 'PostgreSQL (Prisma)',
                },
                redis: {
                  status: 'connected',
                  response: 'PONG',
                },
                bullmq: {
                  status: 'active',
                  queues: {
                    billing: { waiting: 0, active: 1 },
                    whatsapp: { waiting: 0, active: 0 },
                    email: { waiting: 0, active: 0 },
                    documents: { waiting: 0, active: 0 },
                    reports: { waiting: 0, active: 0 },
                    reminders: { waiting: 2, active: 0 },
                  },
                },
              },
            },
          };
          break;

        case 'auth-login':
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: { 'content-type': 'application/json; charset=utf-8' },
            data: {
              accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMDAxIiwiZW1haWwiOiJjYXJsb3MubWVuZG96YUBhbGlhbnphbGltYS5wZSJ9.mockTokenSignature',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMDAxIn0.mockRefreshSignature',
              expiresIn: 86400,
              user: {
                id: currentUser.id,
                email: currentUser.email,
                firstName: currentUser.name.split(' ')[0],
                lastName: currentUser.name.split(' ')[1] || '',
                memberships: currentUser.memberships,
              },
            },
          };
          break;

        case 'auth-me':
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: { 'content-type': 'application/json; charset=utf-8' },
            data: {
              id: currentUser.id,
              email: currentUser.email,
              firstName: currentUser.name.split(' ')[0],
              lastName: currentUser.name.split(' ')[1] || '',
              documentType: 'DNI',
              documentNumber: '10293847',
              phone: '+51 987 654 321',
              isActive: true,
              memberships: currentUser.memberships,
            },
          };
          break;

        case 'academies-my':
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: { 'content-type': 'application/json; charset=utf-8' },
            data: currentUser.memberships.map((m) => {
              const fullAcad = DEMO_ACADEMIES.find((a) => a.id === m.academyId);
              return {
                membershipId: `mem-${m.academyId}`,
                role: m.role,
                isDefault: m.isDefault,
                academy: fullAcad,
              };
            }),
          };
          break;

        case 'academies-detail':
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'x-tenant-id': activeAcademyId,
            },
            data: {
              ...activeAcademy,
              policies: [
                {
                  id: 'pol-01',
                  academyId: activeAcademyId,
                  allowTrainingWithDebt: true,
                  debtWarningThreshold: '50.00',
                  cancellationPolicy: 'CREDIT',
                  siblingDiscountPct: '10.00',
                },
              ],
              _count: activeAcademy?.stats,
            },
          };
          break;

        case 'memberships-list':
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: { 'content-type': 'application/json; charset=utf-8' },
            data: [
              {
                id: 'mem-001',
                academyId: activeAcademyId,
                role: 'OWNER',
                isActive: true,
                user: {
                  id: 'usr-001',
                  email: 'carlos.mendoza@alianzalima.pe',
                  firstName: 'Carlos',
                  lastName: 'Mendoza',
                  phone: '+51 987 654 321',
                  documentNumber: '10293847',
                },
              },
              {
                id: 'mem-002',
                academyId: activeAcademyId,
                role: 'COACH',
                isActive: true,
                user: {
                  id: 'usr-002',
                  email: 'valeria.rivas@deportes.pe',
                  firstName: 'Valeria',
                  lastName: 'Rivas',
                  phone: '+51 999 888 777',
                  documentNumber: '44332211',
                },
              },
              {
                id: 'mem-003',
                academyId: activeAcademyId,
                role: 'CASHIER',
                isActive: true,
                user: {
                  id: 'usr-003',
                  email: 'mateo.caja@alianzalima.pe',
                  firstName: 'Mateo',
                  lastName: 'Paredes',
                  phone: '+51 955 443 322',
                  documentNumber: '77665544',
                },
              },
            ],
          };
          break;

        case 'memberships-create':
          try {
            const body = JSON.parse(requestBodyText || '{}');
            simulatedResponse = {
              status: 201,
              statusText: 'Created',
              durationMs: duration,
              headers: { 'content-type': 'application/json; charset=utf-8' },
              data: {
                id: `mem-${Date.now()}`,
                academyId: activeAcademyId,
                userId: body.userId || 'usr-002',
                role: body.role || 'COACH',
                isActive: true,
                isDefault: false,
                createdAt: new Date().toISOString(),
              },
            };
          } catch {
            simulatedResponse = {
              status: 400,
              statusText: 'Bad Request',
              durationMs: duration,
              headers: { 'content-type': 'application/json; charset=utf-8' },
              data: {
                statusCode: 400,
                code: 'INVALID_JSON_PAYLOAD',
                message: 'El cuerpo de la petición contiene formato JSON inválido',
              },
            };
          }
          break;

        default:
          simulatedResponse = {
            status: 200,
            statusText: 'OK',
            durationMs: duration,
            headers: { 'content-type': 'application/json; charset=utf-8' },
            data: {
              success: true,
              message: 'Operación ejecutada exitosamente en el backend NestJS',
              timestamp: new Date().toISOString(),
            },
          };
      }

      setResponseOutput(simulatedResponse);
      setLoading(false);
    }, 180);
  };

  const copyToClipboard = () => {
    if (responseOutput) {
      navigator.clipboard.writeText(JSON.stringify(responseOutput.data, null, 2));
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const tags = Array.from(new Set(API_ENDPOINTS.map((e) => e.tag)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* Endpoints Sidebar */}
      <div className="lg:col-span-4 bg-[#0F1219] border border-slate-800 rounded p-3 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-xs uppercase font-mono tracking-wide">
              API Sandbox & Endpoints
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">SPEC: OPENAPI 3.0 / NESTJS</p>
          </div>
          <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30 font-mono font-bold">
            V1.0.0
          </span>
        </div>

        <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {tags.map((tag) => (
            <div key={tag}>
              <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <Tag className="w-2.5 h-2.5 text-slate-600" />
                <span>{tag}</span>
              </div>
              <div className="space-y-1">
                {API_ENDPOINTS.filter((e) => e.tag === tag).map((ep) => {
                  const isSelected = selectedEndpoint.id === ep.id;
                  const methodColor =
                    ep.method === 'GET'
                      ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                      : ep.method === 'POST'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : ep.method === 'DELETE'
                      ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                      : 'bg-amber-950/80 text-amber-400 border-amber-800';

                  return (
                    <button
                      key={ep.id}
                      onClick={() => handleSelectEndpoint(ep)}
                      className={`w-full text-left p-1.5 px-2 rounded border transition text-[11px] font-mono flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#161B22] border-sky-500/60 text-white font-semibold'
                          : 'bg-[#090B10]/70 border-slate-800/80 text-slate-400 hover:bg-[#161B22]/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${methodColor}`}>
                          {ep.method}
                        </span>
                        <span className="truncate">{ep.path}</span>
                      </div>
                      {ep.requiresTenant && (
                        <span className="text-[9px] text-amber-400 shrink-0 font-bold" title="Requiere TenantGuard">
                          TENANT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoint Details & Execution Panel */}
      <div className="lg:col-span-8 space-y-3">
        <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
          {/* Header of Endpoint */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    selectedEndpoint.method === 'GET'
                      ? 'bg-blue-950 text-blue-400 border-blue-800'
                      : selectedEndpoint.method === 'POST'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  {selectedEndpoint.path}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-200 mt-1.5 font-mono uppercase">
                {selectedEndpoint.summary}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {selectedEndpoint.description}
              </p>
            </div>

            <button
              onClick={handleExecuteRequest}
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black text-[10px] font-mono font-bold px-3 py-1.5 rounded transition flex items-center gap-1.5 uppercase"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{loading ? 'RUNNING...' : 'DISPATCH REQUEST'}</span>
            </button>
          </div>

          {/* Request Headers & Guard Context */}
          <div className="mt-3 space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Security Headers (Injected by Pipeline):</span>
              <span className="text-[9px] text-slate-500">AUTH & TENANT RESOLVER</span>
            </div>

            <div className="bg-[#090B10] p-2.5 rounded border border-slate-800 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase">Content-Type:</span>
                <span className="text-slate-300">application/json</span>
              </div>

              {selectedEndpoint.requiresAuth && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase">Authorization:</span>
                  <span className="text-sky-400 truncate max-w-md">
                    Bearer eyJhbGciOiJIUzI1Ni... ({currentUser.email})
                  </span>
                </div>
              )}

              {selectedEndpoint.requiresTenant && (
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-bold uppercase">x-academy-id:</span>
                  <span className="text-amber-300 font-bold">
                    {activeAcademyId} ({activeAcademy?.name || 'Academia'})
                  </span>
                </div>
              )}
            </div>

            {/* Tenant / Role Guard Warning */}
            {selectedEndpoint.requiresTenant && !currentMembership && (
              <div className="bg-rose-500/10 border-l-2 border-rose-500 p-2 text-[10px] font-mono text-rose-300">
                <span className="font-bold text-rose-400 uppercase">[SECURITY WARNING]:</span> El usuario actual ({currentUser.name}) no pertenece a este tenant. TenantGuard emitirá HTTP 403 Forbidden.
              </div>
            )}

            {/* Request Body (For POST/PUT) */}
            {selectedEndpoint.method === 'POST' && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    Payload (JSON Body):
                  </label>
                  <span className="text-[9px] text-slate-500 font-mono">EDITABLE</span>
                </div>
                <textarea
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  rows={5}
                  className="w-full bg-[#090B10] border border-slate-800 rounded p-2 text-[11px] font-mono text-sky-400 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Response Panel */}
        <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wide">
                Server Response (HTTP Telemetry)
              </h4>
              {responseOutput && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      responseOutput.status >= 200 && responseOutput.status < 300
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    HTTP {responseOutput.status} {responseOutput.statusText}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {responseOutput.durationMs}ms
                  </span>
                </div>
              )}
            </div>

            {responseOutput && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#161B22] border border-slate-700 transition"
              >
                {copiedResponse ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-emerald-400 uppercase">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span className="uppercase">Copiar JSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-2.5">
            {responseOutput ? (
              <pre className="bg-[#090B10] p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[360px]">
                {JSON.stringify(responseOutput.data, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded text-slate-500 text-[10px] font-mono flex flex-col items-center gap-1.5">
                <Code2 className="w-5 h-5 text-slate-600" />
                <span className="uppercase tracking-wider">Presiona "DISPATCH REQUEST" para inspeccionar la respuesta en vivo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
