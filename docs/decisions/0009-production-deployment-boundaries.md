# ADR-0009: Production Deployment Boundaries

- Status: Accepted
- Date: 2026-09-02

## Context

نَسَق يحتاج تثبيت حدود النشر قبل توسيع Foundation، خصوصًا مع استخدام Vercel وSupabase دون كسر القرار الأساسي بأن Backend/API هو Trust Boundary.

## Decision

1. `apps/web` ينشر على Vercel.
2. PostgreSQL production يكون Supabase PostgreSQL.
3. NestJS يبقى Backend/API المركزي وTrust Boundary لقواعد العمل، Auth، RBAC، Workspace isolation وAudit.
4. Web وFlutter مستقبلًا لا يتصلان مباشرة بجداول قاعدة البيانات لتنفيذ العمليات التجارية.
5. Auth الحالي يبقى في NestJS. لا نضيف Supabase Auth ولا نعيد بناء Auth إلا بقرار معماري منفصل.
6. Supabase Storage يمكن تقييمه لاحقًا للمرفقات.
7. Redis/Workers تدخل فقط عند وجود workload فعلي يحتاج queue/cache/distributed coordination.
8. Supabase Data API يعطل في production طالما لا يحتاجه العميل مباشرة. إذا تغير ذلك، يحتاج ADR منفصلًا وschema/grants/RLS مصممة صراحة.
9. لا توضع Supabase `service_role`/secret keys أو database credentials في Web/Flutter.

## Rationale

Supabase هنا مزود PostgreSQL مُدار، وليس بديلًا لحدود Backend. تعطيل Data API عندما لا يستخدمه المنتج يقلل surface area ويمنع accidental exposure لجداول Prisma. إبقاء Auth في NestJS يمنع وجود مصدرين متنافسين للجلسات والهوية خلال Foundation.

## Consequences

- Backend hosting provider ما زال قرارًا منفصلًا.
- يجب ضبط DB pooling/connection strategy وفق بيئة NestJS قبل Production.
- أي استخدام مستقبلي لـData API يتطلب least-privilege GRANTs وRLS لكل كيان مكشوف واختبارات عزل مستقلة.
- SameSite/CORS domains النهائية تعتمد على نطاق API النهائي.
