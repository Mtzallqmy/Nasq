# نَسَق | NASAQ

منصة عربية موحّدة لإدارة المهام، المال، الجداول والعمل الجماعي، بصلاحيات دقيقة وسجل موثوق وقابلية للتوسع من الفرد إلى المؤسسة.

> الحالة الحالية: **Phase 0 — Foundation**. لم تُنفّذ وحدات المهام أو المالية أو الديون أو المشاريع بعد.

## اقرأ أولًا

- `AGENTS.md`
- `docs/product/PRODUCT.md`
- `docs/implementation/PHASE-0-FOUNDATION.md`
- `docs/architecture/`
- `docs/decisions/`

## المبدأ المعماري الأساسي

```text
Web / PWA (Next.js)        Mobile (Flutter لاحقًا)
          \                  /
             NestJS REST API
                    |
        Auth / RBAC / Business Logic
                    |
               PostgreSQL
                    |
           Redis / Workers لاحقًا
```

لا تتصل واجهات Web أو Mobile مباشرة بقاعدة البيانات في العمليات الحساسة. جميع قواعد العمل والصلاحيات تمر عبر Backend/API مركزي.

## Monorepo

```text
Nasq/
├── apps/
│   ├── web/                    # Next.js + TypeScript
│   └── api/                    # NestJS + Prisma + Swagger
├── docs/
│   ├── product/                # المرجع الرسمي للمنتج
│   ├── implementation/         # تكليف المرحلة
│   ├── architecture/           # وثائق البنية المنفذة
│   └── decisions/              # ADRs
├── infrastructure/
│   └── docker-compose.yml      # PostgreSQL للتطوير المحلي
├── scripts/
│   └── with-env.mjs            # تحميل .env للجلسات المحلية
├── .github/workflows/ci.yml
├── .env.example
└── package.json
```

لا توجد `packages/*` في Phase 0 عمدًا: لا يوجد بعد كود مشترك حقيقي يبرر abstractions مبكرة. عند ظهور مشاركة ثابتة بين التطبيقات يمكن إضافة `packages/types`, `packages/config`, `packages/permissions`, أو UI package بقرار واضح.

## Stack المثبت للمرحلة صفر

- Node.js 22
- npm Workspaces
- Next.js 16.3.3 + React 19.2.8
- NestJS 12.0.1
- PostgreSQL 17 للتطوير/CI
- Prisma 6.19.0
- REST + OpenAPI/Swagger
- Argon2id
- ESLint 9 + Prettier 3
- TypeScript 5.9 strict

Redis وFlutter وObject Storage خارج التنفيذ الحالي.

## التشغيل المحلي

المتطلبات: Node.js 22، npm 10+، Docker + Docker Compose.

```bash
cp .env.example .env
npm install
docker compose -f infrastructure/docker-compose.yml up -d
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

الخدمات:

- Web: `http://localhost:3000`
- API base: `http://localhost:4000/api/v1`
- Health: `http://localhost:4000/api/v1/health`
- Swagger UI: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`

يمكن التشغيل منفردًا:

```bash
npm run dev:api
npm run dev:web
```

## أوامر الجودة

```bash
npm run format:check
npm run lint
npm run db:validate
npm run build
```

## Authentication foundation

Phase 0 يحتوي أساسًا قابلًا للتوسع: Password hashing بـArgon2id، JWT Access قصير العمر، Refresh Token opaque مع rotation وhash فقط داخل `sessions`، إدارة جلسات/أجهزة وإبطالها، HttpOnly refresh cookie للويب، Rate limiting، وبنية لا تمنع إضافة 2FA لاحقًا.

## Workspace / RBAC foundation

- المستخدم يمكن أن ينتمي لعدة Workspaces.
- كل Workspace يملك أعضاء وأدوارًا مستقلة.
- الدور حزمة granular permissions، وليس مجرد اسم Owner/Admin/Member/Guest.
- `x-workspace-id` يحدد السياق فقط؛ الخادم يتحقق من العضوية والصلاحيات قبل الاستعلام الحساس.
- قاعدة البيانات تمنع ربط Role من Workspace بMember من Workspace آخر عبر composite foreign keys.

## Time policy

- العرض الافتراضي: `Asia/Riyadh`.
- timestamps: `TIMESTAMPTZ` وتمثل لحظات معيارية/UTC.
- User وWorkspace يحملان timezone قابلًا للتغيير مستقبلًا.

## ما لم يُنفّذ عمدًا

Tasks، Calendar business logic، Projects، Accounts/Expenses/Income، Debts، Ledger، Approvals الكاملة، Notifications الكاملة، Advanced Reports، AI/OCR، Flutter.

راجع `docs/architecture/OPEN-QUESTIONS.md` قبل توسيع الأساس.

---

برمجة وتطوير: معتز العلقمي — تعز، اليمن
