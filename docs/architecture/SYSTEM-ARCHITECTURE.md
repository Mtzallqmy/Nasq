# System Architecture

## الهدف

تطبيق قرار نَسَق الأساسي: منطق المصادقة والصلاحيات والعمل يوجد في Backend مركزي، ولا توجد قناة Web/Mobile إلى PostgreSQL مباشرة.

```text
Next.js Web/PWA ─┐
                 ├──> NestJS REST API ──> Auth / RBAC / Business Logic ──> PostgreSQL
Flutter (لاحقًا) ┘                                  │
                                                    └──> Redis / Workers (لاحقًا)
```

## Monorepo boundaries

- `apps/web`: تجربة المستخدم فقط. لا Prisma ولا `DATABASE_URL`.
- `apps/api`: Trust Boundary؛ Validation + Authentication + Workspace context + Authorization + Audit + Prisma.
- `infrastructure`: تشغيل الخدمات المحلية المطلوبة فعليًا.

لم تُنشأ `packages/*` بعد لأن المرحلة لا تحتوي مشاركة كود ثابتة تبرر abstraction. npm Workspaces يسمح بإضافتها دون إعادة هيكلة عند الحاجة.

## Runtime dependencies

PostgreSQL هو dependency فعلي في Phase 0. Redis مذكور فقط كاتجاه cache/jobs مستقبلي ولا يُشغّل في Docker Compose حاليًا لأنه غير مستخدم.

## Non-functional baseline

- TypeScript strict.
- REST/OpenAPI contract.
- request/correlation ID.
- structured stdout logs.
- global validation/error convention.
- rate limiting مبدئي؛ التخزين الموزع لاحقًا.
- Web Arabic/RTL first ومتجاوب، مع CSS variables و`prefers-color-scheme` كأساس Light/Dark.
