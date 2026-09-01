# PHASE 0 — تأسيس البنية الهندسية لنَسَق

## التكليف

أنت المهندس البرمجي الرئيسي لمشروع **نَسَق (NASAQ)**.

قبل تنفيذ أي كود، اقرأ:

1. `AGENTS.md`
2. `docs/product/PRODUCT.md`
3. هذه الوثيقة كاملة.

اعتبر وثيقة تأسيس نَسَق المرجع الأساسي لفهم المنتج.

## الهدف

نفّذ **المرحلة صفر: تأسيس البنية الهندسية للمشروع فقط**.

لا تبدأ الآن في تنفيذ نظام المهام أو المحاسبة أو الديون أو المشاريع بصورة كاملة.

## 1. بنية المشروع

أنشئ Monorepo واضحًا وقابلًا للتوسع. الهيكل المقترح:

```text
Nasq/
├── apps/
│   ├── web/              # Next.js
│   └── api/              # NestJS
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   └── permissions/
├── docs/
│   ├── product/
│   ├── implementation/
│   ├── architecture/
│   └── decisions/
├── infrastructure/
├── .github/
├── AGENTS.md
├── README.md
└── .gitignore
```

يمكن تعديل التفاصيل إذا وُجد سبب هندسي واضح، لكن وثّق السبب.

## 2. التقنيات الأساسية

- Web: Next.js + TypeScript
- Backend API: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Cache / Jobs لاحقًا: Redis
- Mobile لاحقًا: Flutter
- API style: REST
- API Documentation: OpenAPI / Swagger

اختر إصدارات مستقرة ومتوافقة وحديثة وقت التنفيذ، ولا تعتمد إصدارًا لمجرد أنه الأحدث دون التأكد من التوافق.

## 3. قاعدة الاتصال بالبيانات

الهندسة المعتمدة:

```text
Web / Mobile
      ↓
Backend API
      ↓
Business Logic
      ↓
PostgreSQL
```

يمنع تصميم Web أو Mobile بحيث يتعاملان مباشرة مع قاعدة البيانات في العمليات الحساسة.

## 4. نطاق Foundation

جهّز أساسًا نظيفًا يدعم مستقبلًا:

- Users
- Workspaces
- Workspace Members
- Roles
- Permissions
- Sessions
- Audit Logs

لا تنفذ بقية الوحدات التجارية في هذه المرحلة.

## 5. Multi-user + Multi-workspace

النظام منذ البداية:

- Multi-user.
- Multi-workspace.
- المستخدم يمكن أن ينتمي إلى أكثر من Workspace.
- الدور والصلاحيات تختلف حسب Workspace.
- البيانات التشغيلية والمالية لا تتسرب بين Workspaces.

كل نموذج بيانات يحتاج عزل مساحة يجب أن يمتلك `workspace_id` أو علاقة صريحة آمنة تؤدي إليه.

## 6. Authentication foundation

جهّز نظام مصادقة قابلًا للتوسع، مع مراعاة:

- Access Token.
- Refresh Token.
- Refresh token rotation/revocation قدر الإمكان.
- Password hashing قوي، ويفضل Argon2id أو خيار معتمد مكافئ.
- Session/device management.
- بنية تسمح بإضافة 2FA مستقبلًا.
- Rate limiting للحماية من brute force.

لا تضع أي Secret حقيقي داخل Git.

## 7. Authorization / RBAC

صمم أساس:

**RBAC + Granular Permissions**

لا تجعل الصلاحيات قائمة فقط على:

`Owner / Admin / Member / Guest`

الدور حزمة Permissions، ويجب أن تكون البنية قابلة لصلاحيات مثل:

```text
tasks.view
tasks.create
tasks.assign
finance.view_summary
finance.view_all
expenses.create
expenses.approve
members.view
members.invite
members.edit_role
roles.manage
reports.view_financial
settings.manage
```

مهم:

- Authorization يتم في Backend.
- إخفاء زر في الواجهة ليس حماية.
- لا يسمح Query بإرجاع بيانات لا يحق للمستخدم رؤيتها ثم إخفائها لاحقًا في UI.

## 8. العربية وRTL

المشروع:

- Arabic First.
- RTL First.
- Responsive.
- بنية i18n تسمح بالإنجليزية لاحقًا.
- تصميم يسمح بـ Light/Dark Mode.

لا يلزم بناء Design System كامل في Phase 0، لكن يجب ألا تُبنى بنية الويب بطريقة تعيق ذلك.

## 9. الزمن

- Default display timezone: `Asia/Riyadh`.
- التخزين المعياري للوقت يكون UTC.
- لا تستخدم توقيت الجهاز كحقيقة وحيدة للعمليات الخلفية.
- صمم إعدادات المستخدم/المساحة لتسمح بتغيير المنطقة الزمنية لاحقًا.

## 10. Prisma / Database foundation

أنشئ Schema أوليًا فقط للكيانات الداخلة في Foundation.

نحتاج مبدئيًا تصميمًا مدروسًا لـ:

```text
User
Workspace
WorkspaceMember
Role
Permission
RolePermission
Session
ActivityLog / AuditLog
```

يمكن إضافة جداول مساعدة إذا كانت لازمة هندسيًا.

متطلبات عامة:

- UUID أو معرفات عامة غير قابلة للتخمين.
- Foreign keys سليمة.
- Indexes مناسبة لـ `workspace_id`, user membership, role lookups.
- Unique constraints تمنع العضويات المكررة غير المقصودة.
- Timestamps واضحة.
- لا تبنِ جداول المالية التفصيلية في هذه المرحلة.

## 11. Architecture docs

أنشئ داخل:

`docs/architecture/`

الملفات التالية أو ما يعادلها:

- `SYSTEM-ARCHITECTURE.md`
- `AUTHENTICATION.md`
- `AUTHORIZATION.md`
- `WORKSPACE-ISOLATION.md`
- `DATABASE-STRATEGY.md`
- `API-CONVENTIONS.md`
- `ERROR-HANDLING.md`
- `LOGGING-OBSERVABILITY.md`

يجب أن تصف القرارات الفعلية المنفذة، لا نصوصًا عامة فقط.

## 12. ADRs

أنشئ `docs/decisions/` واستخدم Architecture Decision Records للقرارات المهمة.

أمثلة محتملة:

- Monorepo tooling.
- Authentication strategy.
- Workspace isolation model.
- API versioning approach.
- Permission model.

لا تنشئ ADR بلا قرار فعلي.

## 13. Environment

أنشئ:

`.env.example`

يحتوي أسماء المتغيرات اللازمة وقيمًا وهمية آمنة فقط.

يمنع Commit لـ:

- Passwords حقيقية.
- Database production URL.
- JWT secrets حقيقية.
- API keys.
- Cloud credentials.

## 14. Local development / Docker

جهّز تطويرًا محليًا واضحًا.

يفضل استخدام Docker Compose للخدمات التي تفيد فعلًا مثل PostgreSQL، ويمكن إضافة Redis إذا احتاجه Foundation فعليًا؛ وإلا لا تضف خدمات غير مستخدمة لمجرد التخطيط المستقبلي.

## 15. Code quality

أضف واضبط:

- ESLint.
- Prettier.
- TypeScript strict mode.
- `.gitignore`.
- Workspace scripts موحدة قدر الإمكان.
- Naming conventions واضحة.

إذا استخدمت package manager أو monorepo tool مثل pnpm/Turborepo، وثّق سبب الاختيار وطريقة الاستخدام.

## 16. API foundation

يجب أن يحتوي API على الأقل على:

- Health endpoint.
- Swagger/OpenAPI قابل للفتح محليًا.
- Global validation.
- Error response convention.
- Logging foundation.
- Request/correlation ID إن كان مناسبًا.

لا تنشئ عشرات endpoints وهمية لوحدات لم تُنفذ.

## 17. Web foundation

أنشئ Web app يعمل فعليًا ويثبت سلامة المشروع، مع:

- Arabic/RTL baseline.
- صفحة أساسية بسيطة ومحترمة.
- اتصال اختباري آمن بالـAPI عند الحاجة.
- لا تبنِ Dashboard المنتج الكامل بعد.

## 18. الاختبارات والتحقق

قبل اعتبار المرحلة مكتملة شغّل ما ينطبق وتأكد من:

- Install ناجح من بيئة نظيفة قدر الإمكان.
- Build للـWeb والـAPI ناجح.
- Lint ناجح.
- Type checks ناجحة.
- API يبدأ بدون أخطاء.
- Web يبدأ بدون أخطاء.
- PostgreSQL يتصل بنجاح.
- Prisma migrations تعمل.
- Swagger يعمل.
- Health endpoint يعيد استجابة صحيحة.
- لا توجد Secrets في Git.

أضف اختبارات ذات قيمة فعلية لأساس Auth/Permissions/Workspace isolation إن نفذت منطقًا منها في هذه المرحلة.

## 19. ما لا يجب تنفيذه الآن

لا تنفذ بصورة كاملة:

- Tasks engine.
- Calendar business logic.
- Projects module.
- Accounts/Expenses/Income.
- Debts.
- Double-entry ledger الكامل.
- Approvals الكاملة.
- Advanced Reports.
- AI/OCR.
- Flutter app.

يمكن فقط تجهيز حدود/Interfaces معمارية عند الحاجة، دون تحويل Phase 0 إلى تنفيذ المنتج كله.

## 20. OPEN QUESTIONS

إذا وجدت قرارًا جوهريًا غير محسوم:

- لا تفترضه بصمت.
- لا توقف العمل كله إن كان يمكن إكمال الأساس بدونه.
- وثقه تحت `OPEN QUESTIONS` في تقريرك النهائي.

## 21. تقرير التسليم المطلوب

عند الانتهاء أعطني تقريرًا مرتبًا يتضمن:

1. ما تم إنشاؤه.
2. شجرة المشروع النهائية.
3. Stack والإصدارات المستخدمة.
4. القرارات المعمارية التي اتخذتها ولماذا.
5. Database schema الأولي.
6. Endpoints الحالية.
7. طريقة التشغيل المحلي خطوة بخطوة.
8. نتائج Build/Lint/Test/Migrations.
9. ما لم يتم تنفيذه عمدًا.
10. `OPEN QUESTIONS`.
11. المخاطر أو Technical Debt إن وجدت.
12. اقتراح Phase 1.

## شرط التوقف

**لا تبدأ Phase 1 تلقائيًا.**

بعد إكمال هذه المرحلة وتقديم التقرير، انتظر مراجعة واعتماد Foundation قبل الانتقال إلى:

**Phase 1 — Authentication + Workspaces + Memberships + Roles + Permissions.**
