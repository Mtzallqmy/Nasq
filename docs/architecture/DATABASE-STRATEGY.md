# Database Strategy

## الخيارات المثبتة

- PostgreSQL.
- Prisma ORM 6.19.
- UUID identifiers.
- snake_case في DB، camelCase في Prisma/TypeScript.
- `TIMESTAMPTZ(3)` للأحداث الزمنية.
- migrations versioned داخل `apps/api/prisma/migrations`.
- PostgreSQL production provider: Supabase PostgreSQL.

## Foundation schema only

User, Workspace, WorkspaceMember, Role, Permission, RolePermission, WorkspaceMemberRole, MemberPermissionOverride, Session, AuditLog فقط. لا جداول Tasks/Finance/Debts/Projects.

## Integrity

- unique `(workspace_id, user_id)` للعضوية.
- unique role key داخل Workspace.
- global unique permission key.
- composite FKs تمنع cross-workspace role assignment.
- session refresh-token hashes unique.
- indexes لمسارات membership/role/session/audit الشائعة.

## Production access boundary

NestJS هو الجهة التطبيقية الوحيدة التي تتصل بقاعدة بيانات التطبيق لتنفيذ العمليات التجارية. Web على Vercel وFlutter مستقبلًا يتصلان بـNestJS API ولا يتصلان مباشرة بجداول PostgreSQL.

في Supabase production تقرر **إبقاء Data API معطلًا** لتطبيق نَسَق ما دام العملاء لا يحتاجونه. جداول التطبيق ليست API عامة بحد ذاتها. مفاتيح `service_role` أو secret/database credentials لا توضع في Web/Flutter أو أي متغير `NEXT_PUBLIC_*`.

إذا احتاج المنتج Data API مستقبلًا، فهذا تغيير معماري يحتاج ADR منفصلًا؛ يفضل schema API مخصصًا بدل كشف جداول التطبيق الداخلية، مع أقل GRANTs ممكنة وRLS على كل جدول/عرض مكشوف. كذلك يجب مراجعة default privileges حتى لا تصبح الجداول الجديدة متاحة لـ`anon`/`authenticated` تلقائيًا.

Supabase Storage يمكن تقييمه لاحقًا للمرفقات بعقود ACL/signed URLs منفصلة عن Data API الخاص بجداول التطبيق.

## Time

`Asia/Riyadh` default display setting، لكن DB timestamps timezone-aware وتمثل instants معيارية. التحويل للعرض عند boundaries المناسبة.

## Audit

`audit_logs` منفصل عن operational data. لا API لتعديله/حذفه في Phase 0.

## Migration policy

- development: reviewed Prisma migrations.
- CI/production: `prisma migrate deploy`.
- لا `db push` كمسار production.
- migration destructive مستقبلية تحتاج مراجعة/backup/rollback plan.
- إعداد connection/pooler النهائي لـSupabase يعتمد على hosting topology الخاصة بـNestJS ويثبت قبل Production.
