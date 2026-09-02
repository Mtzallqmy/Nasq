# Error Handling

## Response envelope

الأخطاء تمر عبر global exception filter:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "ليست لديك الصلاحيات المطلوبة",
    "details": {},
    "requestId": "...",
    "timestamp": "2026-09-02T00:00:00.000Z"
  }
}
```

`details` اختياري. رسائل 5xx لا تكشف stack أو أسرارًا للعميل.

## Categories

- 400: input/context invalid.
- 401: authentication/token invalid.
- 403: membership/permission denied.
- 409: uniqueness/business conflict.
- 503: dependency unavailable مثل PostgreSQL health.
- 500: unexpected failure.

## Validation

أخطاء DTO ترجع `VALIDATION_ERROR` مع قائمة الرسائل في `details`.
