# ADR-0006: Workspace Context + Database Tenant-safe Relations

- Status: Accepted for phase zero
- Date: 2026-09-02

## Decision

كل endpoint scoped يثبت عضوية المستخدم الفعالة في `x-workspace-id` قبل أي query حساس. كل جدول تجاري مستقبلي يجب أن يحمل `workspace_id` أو علاقة حتمية تؤدي إلى مساحة واحدة.

بالإضافة إلى ذلك، العلاقات التي يمكن أن تربط كيانين tenant-scoped تستخدم قيودًا مركبة متى كان ذلك مناسبًا. مثال Phase 0: `workspace_member_roles` يحمل `workspace_id` وتتحقق مفاتيحه الخارجية من `(member_id, workspace_id)` و`(role_id, workspace_id)`، فلا يمكن إسناد Role من Workspace إلى Member في Workspace آخر حتى لو وُجد خلل في كود الخدمة.

## Why

عزل المساحات حد أمني، وليس مجرد convention للاستعلام. الجمع بين guards/queries المقيدة وقيود قاعدة البيانات يقلل احتمال التسرب أو الربط العرضي بين tenants.

## Consequences

- يجب أن تمر كل خدمة scoped بسياق Workspace صريح.
- الاختبارات يجب أن تشمل محاولات وصول بين مساحتين، لا مسارات النجاح فقط.
- PostgreSQL RLS يبقى طبقة defense-in-depth محتملة قبل إطلاق البيانات المالية، وليس افتراضًا منفذًا بصمت في Phase 0.
