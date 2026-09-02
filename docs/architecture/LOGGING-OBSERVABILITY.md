# Logging & Observability Strategy

## Operational logs

الـAPI يكتب structured JSON إلى stdout/stderr. كل request يحصل على `x-request-id` ويُسجل method/path/status/duration/userId عند توفره.

## Audit logs

Audit Logs منفصلة عن operational logs وتسجل domain/security events الحساسة مثل register/login/refresh/logout، session revoke، workspace creation، وتغييرات الصلاحيات مستقبلًا.

## Client IP خلف reverse proxy

حقل IP مفيد للتحقيقات والـrate limiting لكنه ليس حقيقة موثوقة تلقائيًا خلف proxy. Express `trust proxy` يبقى غير مفعّل/غير موسع حتى نعرف مزود استضافة NestJS وعدد/هوية الـproxies الموثوقة. لا نقرأ أول `X-Forwarded-For` أو نثق به مباشرة من الإنترنت. عند اعتماد topology توثق سلسلة proxies وتختبر قيمة `req.ip` قبل استخدامها في security controls أو Audit عالي الحساسية.

## لا تسجل

- passwords.
- access/refresh tokens.
- JWT secrets أو DB credentials.
- Supabase secret/service-role keys.
- بيانات مالية كاملة قبل تعريف redaction policy.

## Production later

اختيار Error Tracking/central log/metrics provider وسياسة retention وPII لم يحسم بعد. الهيكل الحالي provider-neutral. IP retention/redaction جزء من سياسة الخصوصية المطلوبة قبل Production.
