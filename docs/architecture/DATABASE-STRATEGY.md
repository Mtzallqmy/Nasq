# Database Strategy

## الخيارات المثبتة

- PostgreSQL.
- Prisma ORM 6.19.
- UUID identifiers.
- snake_case في DB، camelCase في Prisma/TypeScript.
- `TIMESTAMPTZ(3)` للأحداث الزمنية.
- migrations versioned داخل `apps/api/prisma/migrations`.

## Foundation schema only

User, Workspace, WorkspaceMember, Role, Permission, RolePermission, WorkspaceMemberRole, MemberPermissionOverride, Session, AuditLog فقط. لا جداول Tasks/Finance/Debts/Projects.

## Integrity

- unique `(workspace_id, user_id)` للعضوية.
- unique role key داخل Workspace.
- global unique permission key.
- composite FKs تمنع cross-workspace role assignment.
- session refresh-token hashes unique.
- indexes لمسارات membership/role/session/audit الشائعة.

## Time

`Asia/Riyadh` default display setting، لكن DB timestamps timezone-aware وتمثل instants معيارية. التحويل للعرض عند boundaries المناسبة.

## Audit

`audit_logs` منفصل عن operational data. لا API لتعديله/حذفه في Phase 0.

## Migration policy

- development: reviewed Prisma migrations.
- CI/production: `prisma migrate deploy`.
- لا `db push` كمسار production.
- migration destructive مستقبلية تحتاج مراجعة/backup/rollback plan.
