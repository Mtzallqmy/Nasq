# نَسَق | NASAQ

منصة عربية موحّدة لإدارة المهام، المال، الجداول والعمل الجماعي، بصلاحيات دقيقة وسجل موثوق وقابلية للتوسع من الفرد إلى المؤسسة.

> الحالة الحالية: مرحلة التأسيس الهندسي (Foundation).

## المبدأ المعماري الأساسي

```text
Web / PWA          Mobile (لاحقًا)
     \               /
        Backend API
            |
   Business Logic / Auth / RBAC
      |        |        |
 PostgreSQL  Redis  Object Storage
```

لا تتصل واجهات Web أو Mobile مباشرة بقاعدة البيانات في العمليات الحساسة. جميع العمليات المالية والصلاحيات وقواعد العمل تمر عبر Backend/API مركزي.

## المرجع الرسمي للمنتج

ابدأ بقراءة:

- `docs/product/PRODUCT.md`
- `docs/implementation/PHASE-0-FOUNDATION.md`
- `AGENTS.md`

## التقنيات المستهدفة

- Web/PWA: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Cache/Jobs: Redis
- API: REST + OpenAPI/Swagger
- Mobile: Flutter لاحقًا
- Deployment: Docker + CI/CD

## مبادئ ثابتة

- Arabic First / RTL First
- Multi-user / Multi-workspace
- RBAC + Granular Permissions
- Server-side Authorization
- UTC للتخزين، مع `Asia/Riyadh` كتوقيت عرض افتراضي
- Double-entry ledger كأساس للمحرك المالي
- Audit Log للعمليات الحساسة
- لا حذف صامت للحركات المالية الجوهرية

## التطوير

المشروع في مرحلته التأسيسية. لا تبدأ بتنفيذ جميع وحدات المنتج دفعة واحدة. نفّذ كل مرحلة حسب وثيقة التكليف الخاصة بها ثم راجعها قبل الانتقال للمرحلة التالية.

---

برمجة وتطوير: معتز العلقمي — تعز، اليمن
