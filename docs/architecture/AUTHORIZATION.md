# Authorization Architecture

## النموذج

```text
WorkspaceMember
  ├── WorkspaceMemberRole -> Role -> RolePermission -> Permission
  └── MemberPermissionOverride (ALLOW / DENY) -> Permission
```

Role هو bundle للصلاحيات وليس الصلاحية نفسها. يمكن للعضو امتلاك أكثر من دور، ويمكن إضافة override مباشر. `DENY` المباشر يزيل الصلاحية حتى لو جاءت من دور.

كل Permission key مستقل؛ لا يوجد wildcard أو inheritance ضمني بين `finance.view` و`finance.view_all` مثلًا.

## Enforcement order

1. `JwtAuthGuard` يثبت user + active session.
2. `WorkspaceContextGuard` يقرأ `x-workspace-id` ويتحقق من ACTIVE membership.
3. يحسب effective permissions من roles ثم member overrides.
4. `PermissionsGuard` يطبق `@RequirePermissions(...)` قبل handler.

إخفاء عناصر UI ليس Authorization.

## Database defense

`workspace_member_roles.workspace_id` يدخل في composite foreign keys إلى كل من العضو والدور. لذلك لا يمكن لكتابة خاطئة ربط عضو بمساحة مع دور تابع لمساحة أخرى.

## Default roles

تُنشأ `owner/admin/member/guest`. Phase 0 يمنح Owner كامل catalog فقط. Mapping الافتراضي الدقيق لبقية الأدوار غير محسوم في وثيقة المنتج، لذلك لم يُخترع.
