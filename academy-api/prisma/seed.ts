import { PrismaClient, Role, ChargeType, ChargeStatus, PaymentMethod, InvoiceType, InvoiceStatus, ParticipationType, AttendanceStatus, DataSource, SubscriptionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding for GESTICLUB / Academy Platform with 100% fictional DEMO data...');

  // ---------------------------------------------------------------------------
  // 0. CLEANUP
  // ---------------------------------------------------------------------------
  console.log('🧹 Cleaning existing data...');
  await prisma.attendance.deleteMany();
  await prisma.classParticipation.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.packageCredit.deleteMany();
  await prisma.package.deleteMany();
  await prisma.trial.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.customerCredit.deleteMany();
  await prisma.student.deleteMany();
  await prisma.familyContact.deleteMany();
  await prisma.family.deleteMany();
  await prisma.group.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.billingSetting.deleteMany();
  await prisma.academyPolicy.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.planFeature.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.academy.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Admin123!', 10);
  const demoUserPasswordHash = await bcrypt.hash('Demo1234!', 10);

  // ---------------------------------------------------------------------------
  // 1. SAAS PLANS & FEATURES
  // ---------------------------------------------------------------------------
  console.log('📦 Seeding SaaS Plans & Features...');

  const planFree = await prisma.plan.create({
    data: {
      code: 'FREE',
      name: 'Plan Básico Formativo',
      description: 'Ideal para academias iniciales o comunitarias',
      priceMonthly: 0.00,
      currency: 'PEN',
      maxStudents: 30,
      maxGroups: 3,
      maxSports: 1,
      maxUsers: 2,
      isActive: true,
      features: {
        create: [
          { key: 'EXCEL_IMPORT', enabled: true, description: 'Importación masiva Excel' },
          { key: 'PACKAGES', enabled: false, description: 'Venta de paquetes de clases' },
          { key: 'SUNAT_BILLING', enabled: false, description: 'Facturación Electrónica SUNAT' },
          { key: 'WHATSAPP_AUTOMATION', enabled: false, description: 'Recordatorios WhatsApp' },
          { key: 'ADVANCED_REPORTS', enabled: false, description: 'Reportes y analítica avanzada' },
          { key: 'ADVANCED_FINANCE', enabled: false, description: 'Módulo financiero completo' },
          { key: 'AUDIT_LOG', enabled: false, description: 'Registro de auditoría' },
        ],
      },
    },
  });

  const planPro = await prisma.plan.create({
    data: {
      code: 'PRO',
      name: 'Plan Pro Academias',
      description: 'La solución completa para academias en crecimiento con facturación SUNAT',
      priceMonthly: 99.00,
      currency: 'PEN',
      maxStudents: null, // Ilimitado
      maxGroups: null,
      maxSports: null,
      maxUsers: 10,
      isActive: true,
      features: {
        create: [
          { key: 'EXCEL_IMPORT', enabled: true, description: 'Importación masiva Excel' },
          { key: 'PACKAGES', enabled: true, description: 'Venta de paquetes de clases' },
          { key: 'SUNAT_BILLING', enabled: true, description: 'Facturación Electrónica SUNAT' },
          { key: 'WHATSAPP_AUTOMATION', enabled: true, description: 'Recordatorios WhatsApp' },
          { key: 'ADVANCED_REPORTS', enabled: true, description: 'Reportes y analítica avanzada' },
          { key: 'ADVANCED_FINANCE', enabled: true, description: 'Módulo financiero completo' },
          { key: 'AUDIT_LOG', enabled: true, description: 'Registro de auditoría' },
        ],
      },
    },
  });

  const planEnterprise = await prisma.plan.create({
    data: {
      code: 'ENTERPRISE',
      name: 'Plan Enterprise Clubes',
      description: 'Gestión multisede sin límites para clubes y centros de alto rendimiento',
      priceMonthly: 249.00,
      currency: 'PEN',
      maxStudents: null,
      maxGroups: null,
      maxSports: null,
      maxUsers: null,
      isActive: true,
      features: {
        create: [
          { key: 'EXCEL_IMPORT', enabled: true, description: 'Importación masiva Excel' },
          { key: 'PACKAGES', enabled: true, description: 'Venta de paquetes de clases' },
          { key: 'SUNAT_BILLING', enabled: true, description: 'Facturación Electrónica SUNAT' },
          { key: 'WHATSAPP_AUTOMATION', enabled: true, description: 'Recordatorios WhatsApp' },
          { key: 'ADVANCED_REPORTS', enabled: true, description: 'Reportes y analítica avanzada' },
          { key: 'ADVANCED_FINANCE', enabled: true, description: 'Módulo financiero completo' },
          { key: 'AUDIT_LOG', enabled: true, description: 'Registro de auditoría' },
          { key: 'MULTI_BRANCH', enabled: true, description: 'Gestión de múltiples sedes' },
          { key: 'CUSTOM_DOMAIN', enabled: true, description: 'Dominio propio' },
        ],
      },
    },
  });

  // ---------------------------------------------------------------------------
  // 2. ACADEMIES (100% FICTIONAL DEMO)
  // ---------------------------------------------------------------------------
  console.log('🏟️ Seeding Demo Academies...');

  // 2.1 PRINCIPAL DEMO ACADEMY
  const demoAcademy = await prisma.academy.create({
    data: {
      slug: 'demo',
      name: 'Academia Deportiva Demo Central',
      legalName: 'ACADEMIA DEPORTIVA DEMO CENTRAL S.A.C.',
      ruc: '20123456789',
      phone: '+51 987 654 321',
      email: 'contacto@demo.pe',
      address: 'Av. Javier Prado Este 2500, San Borja',
      city: 'Lima',
      country: 'PE',
      isActive: true,
      settings: {
        themeColor: '#0052CC',
        logoUrl: '/logos/demo-academy.png',
        welcomeMessage: '¡Bienvenidos a la Academia Deportiva Demo Central!',
      },
      billingSettings: {
        create: {
          ruc: '20123456789',
          solUser: 'MODDATOS',
          solPassword: 'moddatos',
          environment: 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
        },
      },
      policies: {
        create: {
          allowTrainingWithDebt: true,
          debtWarningThreshold: 50.00,
          cancellationPolicy: 'CREDIT',
          siblingDiscountPct: 10.00,
        },
      },
      subscription: {
        create: {
          planId: planPro.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 año
        },
      },
    },
  });

  // 2.2 DEMO 2: SEDE NORTE
  const demoNorteAcademy = await prisma.academy.create({
    data: {
      slug: 'demo2',
      name: 'Academia Demo Norte',
      legalName: 'CLUB DEPORTIVO DEMO NORTE S.A.C.',
      ruc: '20123456781',
      phone: '+51 1 481-2244',
      email: 'norte@demo.pe',
      address: 'Av. Las Palmeras 1200, Los Olivos',
      city: 'Lima',
      country: 'PE',
      isActive: true,
      billingSettings: {
        create: {
          ruc: '20123456781',
          solUser: 'MODDATOS',
          solPassword: 'moddatos',
          environment: 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
        },
      },
      policies: {
        create: {
          allowTrainingWithDebt: true,
          debtWarningThreshold: 80.00,
          cancellationPolicy: 'CREDIT',
          siblingDiscountPct: 15.00,
        },
      },
      subscription: {
        create: {
          planId: planPro.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 180 * 24 * 3600 * 1000),
        },
      },
    },
  });

  // 2.3 DEMO 3: SEDE SUR (TRIALING)
  const demoSurAcademy = await prisma.academy.create({
    data: {
      slug: 'demo3',
      name: 'Academia Demo Sur',
      legalName: 'ASOCIACIÓN FORMATIVA DEMO SUR',
      ruc: '20123456782',
      phone: '+51 1 213-4567',
      email: 'sur@demo.pe',
      address: 'Av. Primavera 850, Santiago de Surco',
      city: 'Lima',
      country: 'PE',
      isActive: true,
      billingSettings: {
        create: {
          ruc: '20123456782',
          solUser: 'MODDATOS',
          solPassword: 'moddatos',
          environment: 'BETA',
          boletaSeries: 'B001',
          facturaSeries: 'F001',
          notaCreditoSeries: 'NC01',
          notaDebitoSeries: 'ND01',
        },
      },
      subscription: {
        create: {
          planId: planPro.id,
          status: SubscriptionStatus.TRIALING,
          trialStartsAt: new Date(),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000), // 14 días
          currentPeriodStart: new Date(),
        },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // 3. USERS & ROLES
  // ---------------------------------------------------------------------------
  console.log('👤 Seeding Users & Memberships...');

  // 3.1 SUPERADMIN (Platform Owner)
  const superAdminUser = await prisma.user.create({
    data: {
      id: 'usr-superadmin',
      email: 'superadmin@gesticlub.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Super',
      lastName: 'Admin Gesticlub',
      documentType: 'DNI',
      documentNumber: '00000001',
      phone: '+51 999 000 001',
      isActive: true,
      isSuperAdmin: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.SUPER_ADMIN,
            isDefault: true,
          },
          {
            academyId: demoNorteAcademy.id,
            role: Role.SUPER_ADMIN,
            isDefault: false,
          },
          {
            academyId: demoSurAcademy.id,
            role: Role.SUPER_ADMIN,
            isDefault: false,
          },
        ],
      },
    },
  });

  // 3.2 SUPERADMIN ALIAS (superadmin@demo.pe)
  await prisma.user.create({
    data: {
      id: 'usr-superadmin-demo',
      email: 'superadmin@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'SuperAdmin',
      lastName: 'Demo',
      documentType: 'DNI',
      documentNumber: '00000002',
      phone: '+51 999 000 002',
      isActive: true,
      isSuperAdmin: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.SUPER_ADMIN,
            isDefault: true,
          },
        ],
      },
    },
  });

  // 3.3 ADMIN / OWNER (admin@demo.pe)
  const adminDemoUser = await prisma.user.create({
    data: {
      id: 'usr-admin-demo',
      email: 'admin@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Administrador',
      lastName: 'Demo Central',
      documentType: 'DNI',
      documentNumber: '09876540',
      phone: '+51 987 111 222',
      isActive: true,
      isSuperAdmin: false,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.OWNER,
            isDefault: true,
          },
          {
            academyId: demoNorteAcademy.id,
            role: Role.ADMIN,
            isDefault: false,
          },
        ],
      },
    },
  });

  // 3.4 CARLOS DIRECTOR (carlos.director@demo.pe)
  const carlosUser = await prisma.user.create({
    data: {
      id: 'usr-carlos-director',
      email: 'carlos.director@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Carlos',
      lastName: 'Mendoza Ramos',
      documentType: 'DNI',
      documentNumber: '09876543',
      phone: '+51 991 223 344',
      isActive: true,
      isSuperAdmin: false,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.OWNER,
            isDefault: true,
          },
          {
            academyId: demoNorteAcademy.id,
            role: Role.COACH,
            isDefault: false,
          },
        ],
      },
    },
  });

  // 3.5 COACH: VALERIA RIVAS (valeria.coach@demo.pe)
  const valeriaUser = await prisma.user.create({
    data: {
      id: 'usr-valeria-coach',
      email: 'valeria.coach@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Valeria',
      lastName: 'Rivas Gonzales',
      documentType: 'DNI',
      documentNumber: '45678912',
      phone: '+51 982 334 455',
      isActive: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.COACH,
            isDefault: true,
          },
          {
            academyId: demoNorteAcademy.id,
            role: Role.COACH,
            isDefault: false,
          },
        ],
      },
    },
  });

  // 3.6 CASHIER: MATEO PAREDES (mateo.caja@demo.pe)
  const mateoUser = await prisma.user.create({
    data: {
      id: 'usr-mateo-caja',
      email: 'mateo.caja@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Mateo',
      lastName: 'Paredes Chumpitaz',
      documentType: 'DNI',
      documentNumber: '71234567',
      phone: '+51 973 445 566',
      isActive: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.CASHIER,
            isDefault: true,
          },
          {
            academyId: demoNorteAcademy.id,
            role: Role.CASHIER,
            isDefault: false,
          },
        ],
      },
    },
  });

  // 3.7 COACH ARQUEROS: JEFFERSON HUAMÁN (jefferson.coach@demo.pe)
  const jeffersonUser = await prisma.user.create({
    data: {
      id: 'usr-jefferson-coach',
      email: 'jefferson.coach@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Jefferson',
      lastName: 'Huamán Farfán',
      documentType: 'DNI',
      documentNumber: '40129876',
      phone: '+51 964 556 677',
      isActive: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.COACH,
            isDefault: true,
          },
        ],
      },
    },
  });

  // 3.8 STAFF: ROSAURA DEL SOLAR (recepcion@demo.pe)
  const rosauraUser = await prisma.user.create({
    data: {
      id: 'usr-rosaura-recepcion',
      email: 'recepcion@demo.pe',
      passwordHash: defaultPasswordHash,
      firstName: 'Rosaura',
      lastName: 'Del Solar Ruiz',
      documentType: 'DNI',
      documentNumber: '48901234',
      phone: '+51 955 667 788',
      isActive: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.STAFF,
            isDefault: true,
          },
        ],
      },
    },
  });

  // 3.9 PARENT: PATRICIA QUISPE (patricia.apoderada@demo.pe)
  const patriciaUser = await prisma.user.create({
    data: {
      id: 'usr-patricia-apoderada',
      email: 'patricia.apoderada@demo.pe',
      passwordHash: demoUserPasswordHash,
      firstName: 'Patricia',
      lastName: 'Huamán Quispe',
      documentType: 'DNI',
      documentNumber: '41982736',
      phone: '+51 987 654 321',
      isActive: true,
      memberships: {
        create: [
          {
            academyId: demoAcademy.id,
            role: Role.PARENT,
            isDefault: true,
          },
        ],
      },
    },
  });

  // ---------------------------------------------------------------------------
  // 4. SPORTS, GROUPS & SCHEDULES (DEMO CENTRAL)
  // ---------------------------------------------------------------------------
  console.log('⚽ Seeding Sports, Groups & Schedules...');

  const sportFutbol = await prisma.sport.create({
    data: {
      academyId: demoAcademy.id,
      name: 'Fútbol Formativo',
      description: 'Entrenamiento técnico, táctico y fundamentación motriz para menores.',
      isActive: true,
    },
  });

  const sportFutsal = await prisma.sport.create({
    data: {
      academyId: demoAcademy.id,
      name: 'Futsal & Técnica Reducida',
      description: 'Desarrollo de velocidad de toma de decisiones y control en espacios reducidos.',
      isActive: true,
    },
  });

  const sportArqueros = await prisma.sport.create({
    data: {
      academyId: demoAcademy.id,
      name: 'Escuela de Arqueros',
      description: 'Especialización en blocaje, achique, juego aéreo y juego con los pies.',
      isActive: true,
    },
  });

  const sportFitness = await prisma.sport.create({
    data: {
      academyId: demoAcademy.id,
      name: 'Acondicionamiento Físico Deportivo',
      description: 'Potenciación motriz, pliometría, prevención de lesiones y resistencia.',
      isActive: true,
    },
  });

  // GROUPS
  const groupSub6 = await prisma.group.create({
    data: {
      academyId: demoAcademy.id,
      sportId: sportFutbol.id,
      name: 'Sub-6 Iniciación (Cancha 2)',
      minAge: 4,
      maxAge: 6,
      capacity: 15,
      coachId: valeriaUser.id,
      isActive: true,
    },
  });

  const groupSub8 = await prisma.group.create({
    data: {
      academyId: demoAcademy.id,
      sportId: sportFutbol.id,
      name: 'Sub-8 Fundamentos (Cancha 1)',
      minAge: 7,
      maxAge: 8,
      capacity: 18,
      coachId: valeriaUser.id,
      isActive: true,
    },
  });

  const groupSub10A = await prisma.group.create({
    data: {
      academyId: demoAcademy.id,
      sportId: sportFutbol.id,
      name: 'Sub-10 A Competitivo (Cancha Principal)',
      minAge: 9,
      maxAge: 10,
      capacity: 20,
      coachId: valeriaUser.id,
      isActive: true,
    },
  });

  const groupSub12B = await prisma.group.create({
    data: {
      academyId: demoAcademy.id,
      sportId: sportFutbol.id,
      name: 'Sub-12 B Formativo (Cancha 2)',
      minAge: 11,
      maxAge: 12,
      capacity: 20,
      coachId: carlosUser.id,
      isActive: true,
    },
  });

  const groupArquerosMenores = await prisma.group.create({
    data: {
      academyId: demoAcademy.id,
      sportId: sportArqueros.id,
      name: 'Arqueros Menores (Área Porteros)',
      minAge: 8,
      maxAge: 12,
      capacity: 8,
      coachId: jeffersonUser.id,
      isActive: true,
    },
  });

  // SCHEDULES
  const schedSub10Mon = await prisma.schedule.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub10A.id,
      dayOfWeek: 1, // Lunes
      startTime: '16:00',
      endTime: '17:30',
      court: 'Cancha Sintética 1',
    },
  });

  const schedSub10Wed = await prisma.schedule.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub10A.id,
      dayOfWeek: 3, // Miércoles
      startTime: '16:00',
      endTime: '17:30',
      court: 'Cancha Sintética 1',
    },
  });

  const schedSub10Fri = await prisma.schedule.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub10A.id,
      dayOfWeek: 5, // Viernes
      startTime: '16:00',
      endTime: '17:30',
      court: 'Cancha Sintética 1',
    },
  });

  const schedSub12Tue = await prisma.schedule.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub12B.id,
      dayOfWeek: 2, // Martes
      startTime: '17:00',
      endTime: '18:30',
      court: 'Cancha Sintética 2',
    },
  });

  const schedSub12Thu = await prisma.schedule.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub12B.id,
      dayOfWeek: 4, // Jueves
      startTime: '17:00',
      endTime: '18:30',
      court: 'Cancha Sintética 2',
    },
  });

  // SESSIONS
  const today = new Date();
  today.setHours(16, 0, 0, 0);

  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  yesterday.setHours(16, 0, 0, 0);

  const sessionYesterday = await prisma.classSession.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub10A.id,
      scheduleId: schedSub10Mon.id,
      sessionDate: yesterday,
      startTime: '16:00',
      endTime: '17:30',
      court: 'Cancha Sintética 1',
      coachId: valeriaUser.id,
      notes: 'Entrenamiento de táctica defensiva y repliegue.',
    },
  });

  const sessionToday = await prisma.classSession.create({
    data: {
      academyId: demoAcademy.id,
      groupId: groupSub10A.id,
      scheduleId: schedSub10Wed.id,
      sessionDate: today,
      startTime: '16:00',
      endTime: '17:30',
      court: 'Cancha Sintética 1',
      coachId: valeriaUser.id,
      notes: 'Sesión de definición y transiciones rápidas.',
    },
  });

  // ---------------------------------------------------------------------------
  // 5. FAMILIES, CONTACTS & STUDENTS
  // ---------------------------------------------------------------------------
  console.log('👨‍👩‍👧‍👦 Seeding Families & Students...');

  // FAMILY 1: Quispe Huamán
  const familyQuispe = await prisma.family.create({
    data: {
      academyId: demoAcademy.id,
      code: 'FAM-001',
      name: 'Familia Quispe Huamán',
      notes: 'Familia muy puntual con los pagos. Alumno destacado.',
      contacts: {
        create: [
          {
            userId: patriciaUser.id,
            relationship: 'MADRE',
            fullName: 'Patricia Huamán Quispe',
            phone: '+51 987 654 321',
            email: 'patricia.apoderada@demo.pe',
            documentNumber: '41982736',
            isPrimary: true,
          },
          {
            relationship: 'PADRE',
            fullName: 'Raúl Quispe Pérez',
            phone: '+51 987 111 333',
            email: 'raul.quispe@demo.pe',
            documentNumber: '40871290',
            isPrimary: false,
          },
        ],
      },
    },
  });

  const studentMateo = await prisma.student.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyQuispe.id,
      firstName: 'Mateo',
      lastName: 'Quispe Huamán',
      birthDate: new Date('2015-04-12'),
      documentType: 'DNI',
      documentNumber: '74829103',
      emergencyPhone: '+51 987 654 321',
      medicalNotes: 'Ninguna alergia registrada. Hidratación regular.',
      isActive: true,
    },
  });

  // FAMILY 2: Farfán Rivas
  const familyFarfan = await prisma.family.create({
    data: {
      academyId: demoAcademy.id,
      code: 'FAM-002',
      name: 'Familia Farfán Rivas',
      notes: 'Convenio Deportivo Escolar.',
      contacts: {
        create: [
          {
            relationship: 'PADRE',
            fullName: 'Jorge Farfán Rivas',
            phone: '+51 991 234 567',
            email: 'jorge.farfan@demo.pe',
            documentNumber: '08761234',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const studentLucas = await prisma.student.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyFarfan.id,
      firstName: 'Lucas',
      lastName: 'Farfán Rivas',
      birthDate: new Date('2014-08-25'),
      documentType: 'DNI',
      documentNumber: '73918204',
      emergencyPhone: '+51 991 234 567',
      medicalNotes: 'Asma leve en invierno (inhalador en mochila).',
      isActive: true,
    },
  });

  // FAMILY 3: Guerrero Carrillo
  const familyGuerrero = await prisma.family.create({
    data: {
      academyId: demoAcademy.id,
      code: 'FAM-003',
      name: 'Familia Guerrero Carrillo',
      notes: 'Beca completa deportiva por mérito.',
      contacts: {
        create: [
          {
            relationship: 'MADRE',
            fullName: 'Elena Carrillo Gonzales',
            phone: '+51 942 819 023',
            email: 'elena.carrillo@demo.pe',
            documentNumber: '42890123',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const studentJoaquin = await prisma.student.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyGuerrero.id,
      firstName: 'Joaquín',
      lastName: 'Guerrero Carrillo',
      birthDate: new Date('2016-02-18'),
      documentType: 'DNI',
      documentNumber: '78291034',
      emergencyPhone: '+51 942 819 023',
      medicalNotes: 'Apto médico vigente hasta Diciembre 2026.',
      isActive: true,
    },
  });

  // FAMILY 4: Tapia Morales (Arquero)
  const familyTapia = await prisma.family.create({
    data: {
      academyId: demoAcademy.id,
      code: 'FAM-004',
      name: 'Familia Tapia Morales',
      contacts: {
        create: [
          {
            relationship: 'PADRE',
            fullName: 'Renato Tapia Cortijo',
            phone: '+51 955 432 109',
            email: 'renato.tapia@demo.pe',
            documentNumber: '43901234',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const studentDiego = await prisma.student.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyTapia.id,
      firstName: 'Diego',
      lastName: 'Tapia Morales',
      birthDate: new Date('2015-09-10'),
      documentType: 'DNI',
      documentNumber: '75019283',
      emergencyPhone: '+51 955 432 109',
      medicalNotes: 'Uso de lentes de contacto deportivos.',
      isActive: true,
    },
  });

  // FAMILY 5: Barreto Flores (Sub-6)
  const familyBarreto = await prisma.family.create({
    data: {
      academyId: demoAcademy.id,
      code: 'FAM-005',
      name: 'Familia Barreto Flores',
      contacts: {
        create: [
          {
            relationship: 'MADRE',
            fullName: 'Claudia Flores Dávila',
            phone: '+51 966 778 899',
            email: 'claudia.flores@demo.pe',
            documentNumber: '44891230',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const studentThiago = await prisma.student.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyBarreto.id,
      firstName: 'Thiago',
      lastName: 'Barreto Flores',
      birthDate: new Date('2020-03-05'),
      documentType: 'DNI',
      documentNumber: '81920394',
      emergencyPhone: '+51 966 778 899',
      medicalNotes: 'Ninguna condición particular.',
      isActive: true,
    },
  });

  // ---------------------------------------------------------------------------
  // 6. ENROLLMENTS & ATTENDANCE
  // ---------------------------------------------------------------------------
  console.log('📝 Seeding Enrollments & Attendance...');

  const enrollMateo = await prisma.enrollment.create({
    data: {
      academyId: demoAcademy.id,
      studentId: studentMateo.id,
      groupId: groupSub10A.id,
      startDate: new Date('2026-01-05'),
      monthlyFee: 180.00,
      isActive: true,
      notes: 'Matrícula 2026 regular.',
    },
  });

  const enrollLucas = await prisma.enrollment.create({
    data: {
      academyId: demoAcademy.id,
      studentId: studentLucas.id,
      groupId: groupSub12B.id,
      startDate: new Date('2026-02-01'),
      monthlyFee: 180.00,
      isActive: true,
      notes: 'Media beca deportiva.',
    },
  });

  const enrollJoaquin = await prisma.enrollment.create({
    data: {
      academyId: demoAcademy.id,
      studentId: studentJoaquin.id,
      groupId: groupSub10A.id,
      startDate: new Date('2026-01-05'),
      monthlyFee: 0.00,
      isActive: true,
      notes: 'Beca integral por rendimiento.',
    },
  });

  const enrollDiego = await prisma.enrollment.create({
    data: {
      academyId: demoAcademy.id,
      studentId: studentDiego.id,
      groupId: groupArquerosMenores.id,
      startDate: new Date('2026-01-10'),
      monthlyFee: 200.00,
      isActive: true,
      notes: 'Escuela de arqueros especializada.',
    },
  });

  const enrollThiago = await prisma.enrollment.create({
    data: {
      academyId: demoAcademy.id,
      studentId: studentThiago.id,
      groupId: groupSub6.id,
      startDate: new Date('2026-03-01'),
      monthlyFee: 160.00,
      isActive: true,
    },
  });

  // PARTICIPATION & ATTENDANCE (Yesterday session)
  await prisma.classParticipation.create({
    data: {
      academyId: demoAcademy.id,
      sessionId: sessionYesterday.id,
      studentId: studentMateo.id,
      participationType: ParticipationType.REGULAR,
      attendance: {
        create: {
          status: AttendanceStatus.PRESENT,
          checkInTime: new Date(yesterday.getTime() + 15 * 60000),
          recordedById: valeriaUser.id,
          remarks: 'Excelente desempeño en drills de pase.',
        },
      },
    },
  });

  await prisma.classParticipation.create({
    data: {
      academyId: demoAcademy.id,
      sessionId: sessionYesterday.id,
      studentId: studentJoaquin.id,
      participationType: ParticipationType.REGULAR,
      attendance: {
        create: {
          status: AttendanceStatus.PRESENT,
          checkInTime: new Date(yesterday.getTime() + 10 * 60000),
          recordedById: valeriaUser.id,
          remarks: 'Capitán de equipo en el partido de práctica.',
        },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // 7. CHARGES, PAYMENTS, ALLOCATIONS & INVOICES (SUNAT UBL)
  // ---------------------------------------------------------------------------
  console.log('💰 Seeding Financial Charges, Payments & SUNAT Invoices...');

  // 7.1 CHARGE 1: Mateo Quispe (Paid with Yape + Boleta B001-00000001)
  const chargeMateoPaid = await prisma.charge.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyQuispe.id,
      studentId: studentMateo.id,
      enrollmentId: enrollMateo.id,
      chargeType: ChargeType.MONTHLY,
      description: 'Pensión Marzo 2026 - Fútbol Formativo Sub-10',
      dueDate: new Date('2026-03-05'),
      originalAmount: 180.00,
      discountAmount: 10.00,
      totalAmount: 170.00,
      paidAmount: 170.00,
      balance: 0.00,
      status: ChargeStatus.PAID,
    },
  });

  const paymentMateo = await prisma.payment.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyQuispe.id,
      amount: 170.00,
      paymentMethod: PaymentMethod.YAPE,
      referenceNumber: 'YAPE-9847291',
      paidAt: new Date('2026-03-03'),
      receivedById: mateoUser.id,
      notes: 'Pago puntual mediante Yape App.',
      allocations: {
        create: {
          chargeId: chargeMateoPaid.id,
          amount: 170.00,
        },
      },
    },
  });

  // SUNAT Boleta
  await prisma.invoice.create({
    data: {
      academyId: demoAcademy.id,
      paymentId: paymentMateo.id,
      invoiceType: InvoiceType.BOLETA,
      series: 'B001',
      correlative: 1,
      clientDocType: '1', // DNI
      clientDocNum: '41982736',
      clientName: 'PATRICIA HUAMAN QUISPE',
      clientAddress: 'Av. Javier Prado Este 2500, San Borja, Lima',
      subtotal: 144.07,
      igv: 25.93,
      total: 170.00,
      status: InvoiceStatus.ACCEPTED,
      sunatCode: '0',
      sunatMessage: 'La Boleta de Venta Electrónica número B001-00000001 ha sido aceptada.',
      sentAt: new Date('2026-03-03T10:15:00Z'),
      issuedAt: new Date('2026-03-03T10:14:00Z'),
      items: [
        {
          code: 'SERV-01',
          description: 'Pensión Marzo 2026 - Fútbol Formativo Sub-10',
          quantity: 1,
          unitPrice: 170.00,
          subtotal: 144.07,
          igv: 25.93,
          total: 170.00,
        },
      ],
    },
  });

  // 7.2 CHARGE 2: Mateo Quispe (April Pending)
  await prisma.charge.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyQuispe.id,
      studentId: studentMateo.id,
      enrollmentId: enrollMateo.id,
      chargeType: ChargeType.MONTHLY,
      description: 'Pensión Abril 2026 - Fútbol Formativo Sub-10',
      dueDate: new Date('2026-04-05'),
      originalAmount: 180.00,
      discountAmount: 0.00,
      totalAmount: 180.00,
      paidAmount: 0.00,
      balance: 180.00,
      status: ChargeStatus.PENDING,
    },
  });

  // 7.3 CHARGE 3: Lucas Farfán (Paid with PLIN + Boleta B001-00000002)
  const chargeLucasPaid = await prisma.charge.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyFarfan.id,
      studentId: studentLucas.id,
      enrollmentId: enrollLucas.id,
      chargeType: ChargeType.MONTHLY,
      description: 'Pensión Marzo 2026 - Sub-12 B (Convenio 50%)',
      dueDate: new Date('2026-03-05'),
      originalAmount: 180.00,
      discountAmount: 90.00,
      scholarshipPct: 50.00,
      totalAmount: 90.00,
      paidAmount: 90.00,
      balance: 0.00,
      status: ChargeStatus.PAID,
    },
  });

  const paymentLucas = await prisma.payment.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyFarfan.id,
      amount: 90.00,
      paymentMethod: PaymentMethod.PLIN,
      referenceNumber: 'PLIN-301982',
      paidAt: new Date('2026-03-04'),
      receivedById: mateoUser.id,
      allocations: {
        create: {
          chargeId: chargeLucasPaid.id,
          amount: 90.00,
        },
      },
    },
  });

  await prisma.invoice.create({
    data: {
      academyId: demoAcademy.id,
      paymentId: paymentLucas.id,
      invoiceType: InvoiceType.BOLETA,
      series: 'B001',
      correlative: 2,
      clientDocType: '1',
      clientDocNum: '08761234',
      clientName: 'JORGE FARFAN RIVAS',
      subtotal: 76.27,
      igv: 13.73,
      total: 90.00,
      status: InvoiceStatus.ACCEPTED,
      sunatCode: '0',
      sunatMessage: 'La Boleta de Venta Electrónica número B001-00000002 ha sido aceptada.',
      sentAt: new Date('2026-03-04T12:00:00Z'),
      issuedAt: new Date('2026-03-04T11:58:00Z'),
      items: [
        {
          code: 'SERV-02',
          description: 'Pensión Marzo 2026 - Sub-12 B (Convenio 50%)',
          quantity: 1,
          unitPrice: 90.00,
          subtotal: 76.27,
          igv: 13.73,
          total: 90.00,
        },
      ],
    },
  });

  // 7.4 CHARGE 4: Diego Tapia (Paid with Factura F001-00000001)
  const chargeDiegoPaid = await prisma.charge.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyTapia.id,
      studentId: studentDiego.id,
      enrollmentId: enrollDiego.id,
      chargeType: ChargeType.MONTHLY,
      description: 'Pensión Marzo 2026 - Escuela de Arqueros',
      dueDate: new Date('2026-03-05'),
      originalAmount: 200.00,
      discountAmount: 0.00,
      totalAmount: 200.00,
      paidAmount: 200.00,
      balance: 0.00,
      status: ChargeStatus.PAID,
    },
  });

  const paymentDiego = await prisma.payment.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyTapia.id,
      amount: 200.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'TRANSF-9812039',
      paidAt: new Date('2026-03-02'),
      receivedById: mateoUser.id,
      allocations: {
        create: {
          chargeId: chargeDiegoPaid.id,
          amount: 200.00,
        },
      },
    },
  });

  await prisma.invoice.create({
    data: {
      academyId: demoAcademy.id,
      paymentId: paymentDiego.id,
      invoiceType: InvoiceType.FACTURA,
      series: 'F001',
      correlative: 1,
      clientDocType: '6', // RUC
      clientDocNum: '20601234567',
      clientName: 'SERVICIOS COMERCIALES DEMO S.A.C.',
      clientAddress: 'Av. Dos de Mayo 1520, San Isidro, Lima',
      subtotal: 169.49,
      igv: 30.51,
      total: 200.00,
      status: InvoiceStatus.ACCEPTED,
      sunatCode: '0',
      sunatMessage: 'La Factura Electrónica número F001-00000001 ha sido aceptada.',
      sentAt: new Date('2026-03-02T16:00:00Z'),
      issuedAt: new Date('2026-03-02T15:55:00Z'),
      items: [
        {
          code: 'SERV-03',
          description: 'Pensión Formativa Marzo 2026 - Escuela de Arqueros',
          quantity: 1,
          unitPrice: 200.00,
          subtotal: 169.49,
          igv: 30.51,
          total: 200.00,
        },
      ],
    },
  });

  // 7.5 CHARGE 5: Thiago Barreto (Overdue / Debt)
  await prisma.charge.create({
    data: {
      academyId: demoAcademy.id,
      familyId: familyBarreto.id,
      studentId: studentThiago.id,
      enrollmentId: enrollThiago.id,
      chargeType: ChargeType.MONTHLY,
      description: 'Pensión Marzo 2026 - Sub-6 Iniciación',
      dueDate: new Date('2026-03-05'),
      originalAmount: 160.00,
      discountAmount: 0.00,
      totalAmount: 160.00,
      paidAmount: 0.00,
      balance: 160.00,
      status: ChargeStatus.PENDING,
    },
  });

  // ---------------------------------------------------------------------------
  // 8. COMMERCIAL PACKAGES & PROMOTIONS
  // ---------------------------------------------------------------------------
  console.log('🎁 Seeding Packages & Promotions...');

  const pkg10 = await prisma.package.create({
    data: {
      academyId: demoAcademy.id,
      name: 'Pack 10 Clases + 2 Bonus Formativo',
      classCount: 10,
      bonusClasses: 2,
      price: 180.00,
      validityDays: 60,
      isActive: true,
    },
  });

  await prisma.package.create({
    data: {
      academyId: demoAcademy.id,
      name: 'Pack Verano Intensivo 20 Sesiones',
      classCount: 20,
      bonusClasses: 4,
      price: 320.00,
      validityDays: 90,
      isActive: true,
    },
  });

  await prisma.packageCredit.create({
    data: {
      packageId: pkg10.id,
      studentId: studentMateo.id,
      totalClasses: 12,
      usedClasses: 2,
      expiresAt: new Date(Date.now() + 50 * 24 * 3600 * 1000),
    },
  });

  await prisma.promotion.create({
    data: {
      academyId: demoAcademy.id,
      code: 'HERMANOS10',
      name: 'Descuento Hermanos 10%',
      description: 'Aplica 10% de descuento automático en la mensualidad del segundo hermano.',
      discountPct: 10.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  await prisma.promotion.create({
    data: {
      academyId: demoAcademy.id,
      code: 'PRONTO_PAGO',
      name: 'Descuento Pronto Pago S/ 10',
      description: 'Descuento fijo de 10 Soles si se abona antes del día 5 de cada mes.',
      discountFixed: 10.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  console.log('✅ 100% Fictional Demo Seed completed successfully!');
  console.log('------------------------------------------------------------');
  console.log('🔑 CREDENCIALES DE ACCESO FICTICIAS:');
  console.log('  👑 SuperAdmin:');
  console.log('     Email:    superadmin@gesticlup.pe (o superadmin@demo.pe)');
  console.log('     Password: Admin123!');
  console.log('     Rol:      SUPER_ADMIN');
  console.log('');
  console.log('  🏢 Administrador Demo:');
  console.log('     Email:    admin@demo.pe');
  console.log('     Password: Admin123!');
  console.log('     Academia: Academia Deportiva Demo Central (slug: demo)');
  console.log('     Rol:      OWNER / ADMIN');
  console.log('');
  console.log('  ⚽ Entrenador Principal:');
  console.log('     Email:    valeria.coach@demo.pe');
  console.log('     Password: Admin123!');
  console.log('     Rol:      COACH');
  console.log('');
  console.log('  💵 Cajero / Facturación:');
  console.log('     Email:    mateo.caja@demo.pe');
  console.log('     Password: Admin123!');
  console.log('     Rol:      CASHIER');
  console.log('');
  console.log('  👨‍👩‍👦 Apoderada / Madre:');
  console.log('     Email:    patricia.apoderada@demo.pe');
  console.log('     Password: Demo1234!');
  console.log('     Rol:      PARENT');
  console.log('------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
