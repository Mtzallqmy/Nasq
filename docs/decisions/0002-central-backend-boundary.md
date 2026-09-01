# ADR-0002: Central Backend as the Trust Boundary

- Status: Accepted
- Date: 2026-09-02

## Decision
Web وMobile لا يتعاملان مباشرة مع PostgreSQL في العمليات الحساسة. NestJS API هو مكان قواعد العمل والمصادقة والصلاحيات والتدقيق.

## Consequences
لا Prisma في `apps/web`، ولا Database credentials في متغيرات `NEXT_PUBLIC_*`. أي عميل مستقبلي يعيد استخدام نفس REST contract.
