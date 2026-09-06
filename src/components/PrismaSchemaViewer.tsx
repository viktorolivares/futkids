import React, { useState } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  Layers,
  DollarSign,
  Users,
  Calendar,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react';

export const PrismaSchemaViewer: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'core' | 'academic' | 'commercial' | 'financial' | 'billing'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const models = [
    {
      name: 'Academy',
      category: 'core',
      desc: 'Entidad raíz del Tenant. Contiene slug, RUC, datos de contacto y configuración personalizada.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'slug', type: 'String', key: 'UNIQUE' },
        { name: 'name', type: 'String' },
        { name: 'ruc', type: 'String?', key: 'UNIQUE' },
        { name: 'city', type: 'String', default: '"Lima"' },
        { name: 'isActive', type: 'Boolean', default: 'true' },
      ],
      rules: ['Fuente del contexto tenant', 'Multi-tenant en PostgreSQL compartido'],
    },
    {
      name: 'User',
      category: 'core',
      desc: 'Cuenta de usuario transversal. Puede pertenecer a múltiples academias con distintos roles.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'email', type: 'String', key: 'UNIQUE' },
        { name: 'passwordHash', type: 'String', desc: 'bcrypt hash' },
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' },
        { name: 'documentType', type: 'String?', default: '"DNI"' },
        { name: 'isActive', type: 'Boolean', default: 'true' },
      ],
      rules: ['Autenticación JWT', 'Contraseñas hasheadas con bcrypt'],
    },
    {
      name: 'Membership',
      category: 'core',
      desc: 'Vincula un User a una Academy con un Role específico. Base de la autorización RBAC.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'FK -> Academy' },
        { name: 'userId', type: 'String', key: 'FK -> User' },
        { name: 'role', type: 'Role Enum', desc: 'OWNER, ADMIN, COACH, CASHIER, STAFF, PARENT' },
        { name: 'isDefault', type: 'Boolean', default: 'false' },
      ],
      rules: ['Constraint @@unique([academyId, userId, role])', 'Validado estrictamente por TenantGuard'],
    },
    {
      name: 'Family',
      category: 'academic',
      desc: 'Agrupación familiar de alumnos y apoderados. Permite pagos consolidados para múltiples hijos.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'name', type: 'String', desc: 'Ej: Familia Pérez Quispe' },
        { name: 'source', type: 'DataSource', default: 'DIRECT' },
      ],
      rules: ['Soporta pagos familiares consolidados', 'Conserva source=MIGRATION para historial'],
    },
    {
      name: 'Student',
      category: 'academic',
      desc: 'Alumno de la academia. Soporta múltiples matrículas en diferentes deportes y participaciones flexibles.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'familyId', type: 'String?', key: 'FK -> Family' },
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' },
        { name: 'birthDate', type: 'DateTime' },
      ],
      rules: ['Un alumno puede tener clases de prueba gratuitas', 'Puede invitar a otros alumnos'],
    },
    {
      name: 'ClassSession',
      category: 'academic',
      desc: 'Sesión concreta de clase (ej. Fútbol Sub-12 el 05/09/2026 de 10:00 a 11:00).',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'groupId', type: 'String', key: 'FK -> Group' },
        { name: 'sessionDate', type: 'DateTime' },
        { name: 'startTime', type: 'String' },
        { name: 'endTime', type: 'String' },
        { name: 'isCancelled', type: 'Boolean', default: 'false' },
      ],
      rules: ['Separado de participaciones y asistencia', 'Si se cancela, genera crédito/recuperación'],
    },
    {
      name: 'ClassParticipation',
      category: 'academic',
      desc: 'Razón o tipo por el cual el alumno participa en la sesión.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'sessionId', type: 'String', key: 'FK -> ClassSession' },
        { name: 'studentId', type: 'String', key: 'FK -> Student' },
        { name: 'participationType', type: 'ParticipationType', desc: 'REGULAR, TRIAL, MAKEUP, COMPLIMENTARY, GUEST, PACKAGE, OTHER' },
        { name: 'guestOfStudentId', type: 'String?', key: 'FK -> Student (Invitado)' },
      ],
      rules: ['No asume cobro automático para todas las participaciones', 'Registra invitados sin forzar cobro'],
    },
    {
      name: 'Attendance',
      category: 'academic',
      desc: 'Registro de lo que realmente ocurrió en cancha.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'participationId', type: 'String', key: 'UNIQUE -> ClassParticipation' },
        { name: 'status', type: 'AttendanceStatus', desc: 'PRESENT, ABSENT, LATE, JUSTIFIED' },
        { name: 'checkInTime', type: 'DateTime?' },
        { name: 'recordedById', type: 'String?' },
      ],
      rules: ['Desacoplado de la participación', 'Permite justificaciones y trazabilidad'],
    },
    {
      name: 'Charge',
      category: 'financial',
      desc: 'Obligación o cobro generado. Conserva importes originales, descuentos y becas.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'originalAmount', type: 'Decimal(10, 2)', desc: 'Nunca se pierde el precio original' },
        { name: 'discountAmount', type: 'Decimal(10, 2)', default: '0.00' },
        { name: 'totalAmount', type: 'Decimal(10, 2)', desc: 'original - discount' },
        { name: 'paidAmount', type: 'Decimal(10, 2)', default: '0.00' },
        { name: 'balance', type: 'Decimal(10, 2)', desc: 'totalAmount - paidAmount' },
        { name: 'status', type: 'ChargeStatus', desc: 'PENDING, PARTIALLY_PAID, PAID, CANCELLED' },
      ],
      rules: ['Decimal obligatorio (prohibido Float)', 'Beca 100% conserva originalAmount=150, discount=150, total=0'],
    },
    {
      name: 'Payment',
      category: 'financial',
      desc: 'Transacción de dinero recibida. Separado de los cargos para soportar pagos parciales o sobrepagos.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'amount', type: 'Decimal(10, 2)' },
        { name: 'paymentMethod', type: 'PaymentMethod', desc: 'CASH, CARD, YAPE, PLIN, BANK_TRANSFER, OTHER' },
        { name: 'referenceNumber', type: 'String?', desc: 'Nº Operación Yape/Banco' },
        { name: 'paidAt', type: 'DateTime', default: 'now()' },
      ],
      rules: ['Nunca se elimina silenciosamente (inmutabilidad financiera)', 'Se vincula mediante PaymentAllocation'],
    },
    {
      name: 'PaymentAllocation',
      category: 'financial',
      desc: 'Asignación de un pago hacia un cargo específico.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'paymentId', type: 'String', key: 'FK -> Payment' },
        { name: 'chargeId', type: 'String', key: 'FK -> Charge' },
        { name: 'amount', type: 'Decimal(10, 2)' },
      ],
      rules: ['Permite que un pago cubra múltiples cargos o viceversa'],
    },
    {
      name: 'CustomerCredit',
      category: 'financial',
      desc: 'Saldo a favor del cliente generado por sobrepago, cancelación o retiro.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'familyId', type: 'String', key: 'FK -> Family' },
        { name: 'amount', type: 'Decimal(10, 2)' },
        { name: 'remaining', type: 'Decimal(10, 2)' },
        { name: 'reason', type: 'String' },
      ],
      rules: ['Se puede aplicar a cargos futuros'],
    },
    {
      name: 'Invoice',
      category: 'billing',
      desc: 'Comprobante electrónico SUNAT (Boleta o Factura) con XML UBL 2.1 y CDR.',
      fields: [
        { name: 'id', type: 'String (UUID)', key: 'PK' },
        { name: 'academyId', type: 'String', key: 'Tenant-Scoped' },
        { name: 'invoiceType', type: 'InvoiceType', desc: 'BOLETA, FACTURA, NOTA_CREDITO' },
        { name: 'series', type: 'String', desc: 'B001 / F001' },
        { name: 'correlative', type: 'Int' },
        { name: 'subtotal', type: 'Decimal(10, 2)' },
        { name: 'igv', type: 'Decimal(10, 2)' },
        { name: 'total', type: 'Decimal(10, 2)' },
        { name: 'status', type: 'InvoiceStatus', desc: 'PENDING, PROCESSING, ACCEPTED, REJECTED' },
        { name: 'sunatCdr', type: 'String?', desc: 'Constancia de Recepción' },
      ],
      rules: ['Procesado asíncronamente en BullMQ', 'Guarda XML firmado y CDR oficial'],
    },
  ];

  const filteredModels = models.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="bg-[#0F1219] border border-slate-800 rounded p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded border border-sky-500/30 font-bold uppercase">
                Prisma 5 + PostgreSQL 16
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold uppercase">
                Decimal(10, 2) Monetary Standard
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1.5 font-mono uppercase tracking-wide">
              Modelado de Datos & Reglas de Negocio en Prisma
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Esquema relacional con separación de responsabilidades: asistencias desacopladas de participaciones, importes monetarios estrictos en Decimal(10, 2) y discriminador obligatorio <code className="text-sky-400 font-mono">academyId</code>.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'core', label: 'Core / Multi-Tenant' },
              { id: 'academic', label: 'Académico' },
              { id: 'financial', label: 'Financiero' },
              { id: 'billing', label: 'SUNAT UBL' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded font-semibold transition ${
                  activeCategory === cat.id
                    ? 'bg-sky-500 text-black font-bold'
                    : 'bg-[#090B10] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar modelo o campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#090B10] border border-slate-800 text-slate-200 text-[10px] font-mono pl-7 pr-2.5 py-1 rounded focus:outline-none focus:border-sky-500 w-52"
            />
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredModels.map((model) => (
          <div
            key={model.name}
            className="bg-[#0F1219] border border-slate-800 rounded p-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-bold font-mono text-white">
                    model {model.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono uppercase bg-[#090B10] px-1.5 py-0.2 rounded text-slate-400 border border-slate-800 font-bold">
                  {model.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{model.desc}</p>

              {/* Fields Table */}
              <div className="bg-[#090B10] rounded border border-slate-800 overflow-hidden text-[10px] font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#161B22] text-[9px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-1.5 px-2">Campo</th>
                      <th className="p-1.5 px-2">Tipo</th>
                      <th className="p-1.5 px-2">Atributo / Regla</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {model.fields.map((f) => (
                      <tr key={f.name} className="hover:bg-[#161B22]/50">
                        <td className="p-1.5 px-2 text-slate-200 font-bold">{f.name}</td>
                        <td className="p-1.5 px-2 text-sky-400">{f.type}</td>
                        <td className="p-1.5 px-2 text-slate-400">{f.key || f.desc || f.default || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Business Rules Callout */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-0.5">
              <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">Reglas de Negocio:</div>
              {model.rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
