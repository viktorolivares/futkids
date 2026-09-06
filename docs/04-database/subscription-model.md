# 04 - Base de Datos: Modelo Relacional de Suscripciones

## 1. Diagrama Entidad-Relación

```
┌─────────────────┐       1 : 1       ┌──────────────────┐
│   academies     │ ───────────────── │  subscriptions   │
│                 │                   │                  │
│ id (PK)         │                   │ id (PK)          │
│ name            │                   │ academyId (FK,UQ)│
│ slug            │                   │ planId (FK)      │
│ ruc             │                   │ status (ENUM)    │
└─────────────────┘                   │ trialStartsAt    │
                                      │ trialEndsAt      │
                                      │ currentPeriod... │
                                      └────────┬─────────┘
                                               │ N : 1
                                               ▼
┌──────────────────┐      1 : N       ┌──────────────────┐
│  plan_features   │ ──────────────── │      plans       │
│                  │                  │                  │
│ id (PK)          │                  │ id (PK)          │
│ planId (FK)      │                  │ code (UQ)        │
│ key (UQ x plan)  │                  │ name             │
│ enabled (BOOL)   │                  │ priceMonthly     │
│ description      │                  │ maxStudents      │
└──────────────────┘                  │ maxGroups        │
                                      │ maxSports        │
                                      │ maxUsers         │
                                      └──────────────────┘
```

---

## 2. Definición de Tablas (DDL / Prisma)

```prisma
enum SubscriptionStatus {
  TRIALING
  ACTIVE
  CANCELED
  EXPIRED
}

model Plan {
  id            String         @id @default(uuid())
  code          String         @unique // FREE, PRO
  name          String
  description   String?
  priceMonthly  Decimal        @default(0.00) @db.Decimal(10, 2)
  currency      String         @default("PEN")
  maxStudents   Int?           // 30 para FREE, null (ilimitado) para PRO
  maxGroups     Int?           // 2 para FREE, null para PRO
  maxSports     Int?           // 1 para FREE, null para PRO
  maxUsers      Int?           // 2 para FREE, 10 para PRO
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  features      PlanFeature[]
  subscriptions Subscription[]

  @@map("plans")
}

model PlanFeature {
  id          String    @id @default(uuid())
  planId      String
  key         String    // SUNAT_BILLING, WHATSAPP_AUTOMATION, etc.
  enabled     Boolean   @default(true)
  limitValue  Int?
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  plan        Plan      @relation(fields: [planId], references: [id], onDelete: Cascade)

  @@unique([planId, key])
  @@index([planId])
  @@map("plan_features")
}

model Subscription {
  id                 String             @id @default(uuid())
  academyId          String             @unique
  planId             String
  status             SubscriptionStatus @default(TRIALING)
  trialStartsAt      DateTime?
  trialEndsAt        DateTime?
  currentPeriodStart DateTime           @default(now())
  currentPeriodEnd   DateTime?
  canceledAt         DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  academy            Academy            @relation(fields: [academyId], references: [id], onDelete: Cascade)
  plan               Plan               @relation(fields: [planId], references: [id], onDelete: Restrict)

  @@index([academyId])
  @@index([planId])
  @@index([status])
  @@map("subscriptions")
}
```
