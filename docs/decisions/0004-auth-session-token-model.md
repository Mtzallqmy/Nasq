# ADR-0004: Short-lived JWT Access + Rotating Opaque Refresh Sessions

- Status: Accepted
- Date: 2026-09-02

## Decision

- Access token هو JWT قصير العمر ويحمل `sub` و`sid` ونوع التوكن.
- Refresh token قيمة opaque عالية العشوائية، ولا يُخزن منها في قاعدة البيانات إلا SHA-256 hash داخل `sessions`.
- يتم تدوير refresh token عند كل refresh، ويمكن إبطال الجلسة منفردة.
- Password hashing يستخدم Argon2id.
- Web ينقل refresh token عبر `HttpOnly` cookie، بينما يبقى access token في استجابة الـAPI.
- كل طلب محمي يتحقق من توقيع access token **ومن أن Session المشار إليها ما زالت فعالة**؛ لذلك يسري revoke فورًا ولا ينتظر انتهاء JWT.
- Auth endpoints محمية أيضًا بـrate limiting على مستوى الخادم.

## Why

يوفر JWT access contract بسيطًا لعملاء متعددين، مع إبقاء الإبطال وإدارة الأجهزة في سجل Session مركزي. التحقق الفوري من Session يفضل الأمان في المرحلة التأسيسية على توفير query واحد؛ يمكن لاحقًا تحسين الأداء عبر cache مدروس دون تغيير العقد الأمني.

## Consequences

- إبطال Session يوقف access token المرتبط بها مباشرة.
- الـAPI ليس stateless بالكامل في المسارات المحمية، لأن التحقق من Session يحتاج قاعدة البيانات حاليًا.
- يلزم لاحقًا تحديد secure storage/transport المناسب لـFlutter و2FA step-up flows.
