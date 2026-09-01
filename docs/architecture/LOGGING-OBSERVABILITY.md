# Logging & Observability Strategy

## Operational logs

الـAPI يكتب structured JSON إلى stdout/stderr. كل request يحصل على `x-request-id` ويُسجل method/path/status/duration/userId عند توفره.

## Audit logs

Audit Logs منفصلة عن operational logs وتسجل domain/security events الحساسة مثل register/login/refresh/logout، session revoke، workspace creation، وتغييرات الصلاحيات مستقبلًا.

## لا تسجل

- passwords.
- access/refresh tokens.
- JWT secrets أو DB credentials.
- بيانات مالية كاملة قبل تعريف redaction policy.

## Production later

اختيار Error Tracking/central log/metrics provider وسياسة retention وPII لم يحسم بعد. الهيكل الحالي provider-neutral.
