# OPEN QUESTIONS

هذه قرارات لم تحسمها وثيقة التأسيس أو لا يلزم حسمها في المرحلة صفر، لذلك لم تُخفَ داخل افتراضات تنفيذية:

1. **Default permission grants**: ما الصلاحيات الافتراضية الدقيقة لـAdmin/Member/Guest؟ المرحلة صفر تمنح Owner فقط كامل catalog.
2. **Personal workspace onboarding**: هل ينشئ التسجيل مساحة شخصية تلقائيًا أم يترك إنشاء المساحة خطوة صريحة؟ لم يُنفذ auto-create.
3. **Mobile refresh-token transport**: Flutter يحتاج secure token storage/rotation contract؛ Web الحالي يستخدم HttpOnly refresh cookie.
4. **Workspace invitations**: قناة الدعوة الأساسية (email/phone) وسياسة كشف بيانات الاتصال لم تحسم بعد.
5. **PostgreSQL RLS**: هل نضيف Row-Level Security كطبقة دفاع إضافية قبل إطلاق الوحدات المالية، أم نكتفي بعزل طبقة API مع اختبارات وصول مكثفة؟
6. **Rate limiting**: الحدود الدقيقة، store الموزع، وسياسة lockout لمحاولات الدخول تحتاج قرار تشغيل/أمان قبل production.
7. **CORS / deployment topology**: origins والدومينات النهائية غير معروفة بعد؛ لم تُثبت سياسة CORS production.
8. **Audit retention/immutability**: مدة الاحتفاظ، redaction للـIP/user-agent، وWORM/append-only enforcement على مستوى DB/infra تحتاج سياسة خصوصية.
9. **Base currency**: وثيقة المنتج تطلب عملة أساسية لكل مساحة، لكن العملة ليست ضمن schema المرحلة صفر حتى تُحدد قواعدها قبل المالية.
10. **Pagination contract**: cursor مقابل offset يؤجل حتى أول قائمة كبيرة تحتاج API contract ثابتًا.
11. **Session-validation scale**: التحقق من Session في كل request محمي مقصود للأمان الآن؛ قبل الأحمال العالية يجب حسم cache/revocation strategy (مثل Redis) دون إضعاف الإبطال الفوري.
