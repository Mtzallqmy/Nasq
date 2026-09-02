# ADR-0001: Monorepo with npm Workspaces

- Status: Accepted
- Date: 2026-09-02

## Context

نَسَق يحتاج Web وAPI الآن، وFlutter لاحقًا، مع توثيق وبنية قابلة للتوسع دون فصل مبكر إلى مستودعات متعددة.

## Decision

استخدام Monorepo واحد مع npm Workspaces. التطبيقات تحت `apps/`، والـpackages المشتركة يمكن إضافتها عند وجود مشاركة حقيقية لا استباقيًا.

## Consequences

إدارة إصدارات وأوامر موحدة، CI أبسط، وعدم إدخال Turborepo/Nx قبل وجود حاجة أداء أو graph معقدة.
