# Authentication Architecture

## النموذج الحالي

1. Passwords تخزن كـArgon2id hashes فقط.
2. التسجيل/الدخول ينشئ سجل `Session` يمثل جهازًا/جلسة.
3. Access Token هو JWT قصير العمر ويحمل `sub`, `sid`, `email`, و`type=access`.
4. Refresh Token قيمة opaque عشوائية؛ لا تخزن خامًا. يخزن SHA-256 فقط.
5. Refresh يدور القيمة داخل session ويحدث `last_used_at`.
6. Logout/Revoke يضبط `revoked_at`.
7. `JwtAuthGuard` يتحقق من JWT **ومن أن session ما زالت نشطة**؛ لذلك الإبطال يسري فورًا بدل انتظار انتهاء access token.
8. Web transport الحالي يضع refresh token في HttpOnly cookie. Access token يعاد للعميل ويرسل كـBearer.
9. Register/Login/Refresh لها limits أكثر تشددًا فوق global rate limit.

## 2FA

لا توجد 2FA في Phase 0. `User` و`Session` غير مربوطين بمفهوم password-only على مستوى علاقات المنتج، ويمكن إضافة challenge/factor tables لاحقًا دون تغيير Workspace/RBAC model.

## ضوابط

- secret validation: `JWT_ACCESS_SECRET` >= 32 characters.
- refresh token لا يظهر في response body.
- Cookie: HttpOnly + SameSite=Lax + Secure حسب البيئة.
- CORS origins صريحة من `CORS_ORIGINS`.
- لا tokens/passwords/secrets في logs.
- session expiry/revocation يتحقق server-side.

## خارج Phase 0

Password reset، email verification، OAuth/SSO، 2FA، تسمية الأجهزة المتقدمة، distributed rate-limit store، policies الخاصة بالـtrusted proxies.
