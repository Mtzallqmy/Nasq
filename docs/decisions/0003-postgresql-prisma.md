# ADR-0003: PostgreSQL + Prisma

- Status: Accepted
- Date: 2026-09-02

## Decision
PostgreSQL مصدر الحقيقة وPrisma طبقة ORM/migrations. معرفات عامة UUID، وأزمنة الأحداث TIMESTAMPTZ.

## Consequences
الـschema مركزي، migrations قابلة للمراجعة، ولا `db push` في production.
