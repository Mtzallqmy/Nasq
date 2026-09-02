# Deployment & Platform Security

## Topology المثبتة

```text
Browser
  |
  v
Web / Next.js on Vercel
  |
  | HTTPS REST
  v
NestJS Backend API (hosting provider TBD)
  |
  | trusted server-side PostgreSQL connection
  v
Supabase PostgreSQL
```

Flutter لاحقًا يتبع نفس المسار: Flutter -> NestJS API -> Business Logic -> PostgreSQL.

## Trust Boundary

NestJS يبقى Trust Boundary المركزي للمصادقة، Workspace isolation، RBAC، validation، audit، وكل قواعد العمل. استضافة PostgreSQL لدى Supabase لا تغير هذا الحد.

- لا Web ولا Flutter ينفذان CRUD تجاريًا مباشرة على جداول التطبيق.
- Auth الحالي يبقى NestJS Auth. لا Supabase Auth في هذه المرحلة.
- أي انتقال أو دمج مع Supabase Auth يحتاج ADR منفصلًا ومراجعة session/RBAC/audit contracts.
- لا service-role key ولا DB password ولا Supabase secret key في frontend bundles.

## Supabase Data API

قرار Foundation هو تعطيل Data API في production طالما لا توجد حاجة عميل مباشرة له. هذا يقلل السطح الهجومي ويمنع أن تصبح جداول Prisma endpoints عامة بصورة غير مقصودة.

إذا فُتح Data API لاحقًا:

1. ADR منفصل يشرح الحاجة.
2. يفضل schema API مخصص بدل كشف schema التطبيق الداخلي.
3. GRANTs أقل صلاحية ممكنة؛ لا منح تلقائي واسع لـ`anon` أو `authenticated`.
4. RLS إلزامي لكل table/view مكشوف مع سياسات مبنية على نموذج الوصول الفعلي.
5. مراجعة default privileges للجداول/functions/sequences.
6. اختبارات BOLA/IDOR وعزل Workspaces عبر Data API نفسها.

## Storage وWorkers

Supabase Storage مرشح لاحق للمرفقات، مع signed URLs/ACL وسياسة منفصلة. Redis/Workers لا تضاف لمجرد التخطيط؛ تدخل عندما يوجد workload فعلي مثل queues، reminders أو distributed rate limiting.

## Network/Cookies

Web provider مثبت على Vercel، لكن نطاق الـAPI ومزود استضافته لم يثبتا بعد. لذلك SameSite/CORS/domain topology النهائية تبقى Production readiness decision موثقة في Authentication Architecture وOPEN QUESTIONS.
