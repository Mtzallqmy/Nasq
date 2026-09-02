# ADR-0005: Workspace-scoped RBAC with Granular Permissions

- Status: Accepted
- Date: 2026-09-02

## Decision

Role هو bundle من Permission keys، والعضو يمكن أن يملك عدة أدوار وALLOW/DENY overrides مباشرة. التحقق server-side.

## Consequences

Owner/Admin/Member/Guest ليست حدود النظام. يمكن إضافة محاسب أو مراجع أو مشرف مشروع كأدوار مخصصة لاحقًا دون تغيير نموذج الصلاحيات.
