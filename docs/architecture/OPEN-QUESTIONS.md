# OPEN QUESTIONS

هذه قرارات لم تحسمها وثيقة التأسيس أو لا يلزم حسمها في المرحلة صفر، لذلك لم تُخفَ داخل افتراضات تنفيذية:

1. **Default permission grants**: ما الصلاحيات الافتراضية الدقيقة لـAdmin/Member/Guest؟ المرحلة صفر تمنح Owner فقط كامل catalog.
2. **Personal workspace onboarding**: هل ينشئ التسجيل مساحة شخصية تلقائيًا أم يترك إنشاء المساحة خطوة صريحة؟ لم يُنفذ auto-create.
3. **Mobile refresh-token transport**: Flutter يحتاج secure token storage/rotation contract؛ Web الحالي يستخدم HttpOnly refresh cookie.
4. **Workspace invitations**: قناة الدعوة الأساسية (email/phone) وسياسة كشف بيانات الاتصال لم تحسم بعد.
5. **PostgreSQL RLS defense-in-depth**: Data API سيبقى معطلًا في production وفق ADR-0009. هل نضيف RLS أيضًا كطبقة دفاع داخلية ضد أخطاء استعلام NestJS قبل إطلاق المالية؟ القرار يحتاج تصميمًا لا يكرر RBAC بصورة غير قابلة للصيانة.
6. **Production rate limiting / login lockout**: الـin-memory limiter غير إنتاجي. يجب تحديد distributed store والحدود وسياسة lockout/backoff قبل Production.
7. **API hosting + cookie/CORS topology**: Web = Vercel وDB = Supabase مثبتان، لكن مزود/دومين NestJS لم يثبت. بعد تثبيته تحدد exact CORS origins وSameSite/Secure/domain policy.
8. **Trusted proxy/client IP**: لا يعتمد IP كهوية أمنية قبل معرفة proxy chain وضبط `trust proxy` واختباره.
9. **Audit retention/immutability**: مدة الاحتفاظ، redaction للـIP/user-agent، وWORM/append-only enforcement على مستوى DB/infra تحتاج سياسة خصوصية.
10. **Base currency**: وثيقة المنتج تطلب عملة أساسية لكل مساحة، لكن العملة ليست ضمن schema المرحلة صفر حتى تُحدد قواعدها قبل المالية.
11. **Pagination contract**: cursor مقابل offset يؤجل حتى أول قائمة كبيرة تحتاج API contract ثابتًا.
12. **Session-validation scale**: التحقق من Session في كل request محمي مقصود للأمان الآن؛ قبل الأحمال العالية يجب حسم cache/revocation strategy دون إضعاف الإبطال الفوري.
13. **Supabase connection mode**: direct/pooler settings المناسبة تعتمد على طريقة استضافة NestJS وعدد instances؛ تثبت قبل Production.
