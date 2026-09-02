# Authentication Architecture

## النموذج الحالي

1. Passwords تخزن كـArgon2id hashes فقط.
2. التسجيل/الدخول ينشئ سجل `Session` يمثل جهازًا/جلسة.
3. Access Token هو JWT قصير العمر ويحمل `sub`, `sid`, `email`, و`type=access`.
4. Refresh Token قيمة opaque عشوائية؛ لا تخزن خامًا. يخزن SHA-256 فقط.
5. Refresh يدور القيمة داخل session ويحدث `last_used_at`؛ القيمة السابقة تصبح غير صالحة فورًا.
6. Logout/Revoke يضبط `revoked_at`.
7. `JwtAuthGuard` يتحقق من JWT **ومن أن session ما زالت نشطة**؛ لذلك الإبطال يسري فورًا بدل انتظار انتهاء access token.
8. Web transport الحالي يضع refresh token في HttpOnly cookie. Access token يعاد للعميل ويرسل كـBearer.
9. Register/Login/Refresh لها limits أكثر تشددًا فوق global in-memory rate limit.

## 2FA

لا توجد 2FA في Phase 0. يمكن إضافة challenge/factor tables لاحقًا دون تغيير Workspace/RBAC model.

## Cookie وCORS

الإعداد الحالي هو Foundation/local baseline وليس عقد Production نهائيًا:

- refresh cookie: `HttpOnly`.
- `SameSite=Lax` حاليًا.
- `Secure` يتحكم به `AUTH_COOKIE_SECURE` ويجب أن يكون `true` في Production عبر HTTPS.
- CORS origins قائمة صريحة من `CORS_ORIGINS` مع `credentials: true`.
- cookie path محصور في `/api/v1/auth`.

قبل Production يجب تثبيت Deployment Topology الفعلية: نطاق Vercel للويب، نطاق الـAPI، وهل هما same-site أم cross-site. بناءً على ذلك تثبت سياسة `SameSite` و`Secure` وCORS origins الدقيقة. لا يجوز استخدام wildcard origin مع credentialed cookies.

## Rate limiting وclient IP

الـin-memory limiter الحالي **مقبول لـFoundation/local development وCI فقط**، وليس Production Security؛ حالته لا تتشارك بين نسخ الـAPI ولا تصمد أمام restart.

قبل Production يجب اعتماد distributed rate limiter مناسب للنشر متعدد الـinstances وسياسة login lockout/backoff. Redis خيار مرشح عند وجود هذا workload، لكنه غير مفعل في Phase 0.

`req.ip` لا يعد client identity موثوقًا خلف reverse proxy إلا بعد تعريف proxy topology وضبط Express `trust proxy` بصورة دقيقة. لا يتم الوثوق عشوائيًا بـ`X-Forwarded-For` لأن العميل يمكنه تزويره إذا لم يكن مصدره proxy موثوقًا. إلى أن يثبت مزود استضافة NestJS ومسار الـproxies، IP metadata وIP-based limiting يعتبران best-effort فقط ولا يبنى عليهما قرار أمني حاسم.

## ضوابط

- secret validation: `JWT_ACCESS_SECRET` >= 32 characters.
- refresh token لا يظهر في response body.
- لا tokens/passwords/secrets في logs.
- session expiry/revocation يتحقق server-side.
- Auth يبقى داخل NestJS في هذه المرحلة؛ Supabase Auth غير مستخدم ولا يضاف دون ADR منفصل.

## خارج Phase 0

Password reset، email verification، OAuth/SSO، 2FA، تسمية الأجهزة المتقدمة، distributed rate-limit store، login lockout policy، وسياسة trusted proxies النهائية.
