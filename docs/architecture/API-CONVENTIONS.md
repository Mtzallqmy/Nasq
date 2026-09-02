# API Conventions

## Base URL

`/api/v1`

## Style

REST + JSON + OpenAPI/Swagger.

## Authentication

`Authorization: Bearer <access-token>` للموارد المحمية.

## Workspace Context

الموارد workspace-scoped تستقبل:

`x-workspace-id: <uuid>`

الـheader ليس إثبات صلاحية؛ هو selector فقط، ويجب التحقق من العضوية والصلاحيات في الخادم.

## Validation

Nest `ValidationPipe` يعمل بـwhitelist + forbidNonWhitelisted + transform.

## Lists

عندما تظهر القوائم الكبيرة في المراحل القادمة، العقد الافتراضي سيكون pagination/filtering/sorting بدل إرجاع مجموعات غير محدودة. الشكل النهائي للpagination مفتوح حتى أول endpoint يحتاجه.

## Idempotency

سيصبح `Idempotency-Key` متطلبًا للعمليات المالية القابلة للتكرار عند تنفيذ المالية؛ لا توجد عملية مالية في المرحلة صفر.

## Documentation

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs/openapi.json`
