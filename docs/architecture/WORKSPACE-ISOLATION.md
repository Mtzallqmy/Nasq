# Workspace Isolation

## invariant

كل قراءة/كتابة تخص Workspace تبدأ من:

`User identity -> Workspace selector -> ACTIVE membership -> Permission -> scoped query`

## Phase 0 enforcement

- membership unique على `(workspace_id, user_id)`.
- roles scoped بـ`workspace_id`.
- role assignment نفسه يحمل `workspace_id` مع composite FKs تمنع cross-workspace assignment.
- endpoints scoped تستخدم `x-workspace-id` كselector لا كإثبات ثقة.
- queries لا تجلب بيانات Workspace ثم تخفيها لاحقًا في UI.
- `Workspace.owner_user_id` صريح، ويُنشأ معه Owner membership/role في transaction واحدة.

## قواعد الوحدات القادمة

Task/Project/Finance/Debt وغيرها يجب أن تحمل `workspace_id` أو علاقة حتمية موثقة تصل إلى Workspace، مع indexes واختبارات negative access.

## Defense in depth

PostgreSQL RLS غير مفعّل في Phase 0. قرار إضافته قبل البيانات المالية production موثق كـOPEN QUESTION؛ التطبيق الحالي يفرض العزل في API وقيود العلاقات.
