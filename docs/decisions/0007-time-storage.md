# ADR-0007: UTC Instants, Asia/Riyadh Default Display

- Status: Accepted
- Date: 2026-09-02

## Decision
الأزمنة التخزينية TIMESTAMPTZ وتمثل instants معيارية؛ الإعداد الافتراضي للعرض `Asia/Riyadh`. المستخدم/المساحة يمكن أن يحمل timezone مختلفًا مستقبلًا.

## Consequences
لا نخزن توقيت مكة كوقت محلي بلا offset، ولا نجعل الهجري مصدر حقيقة زمنيًا.
