# Local infrastructure

Phase 0 يشغل PostgreSQL فقط لأنه dependency فعلي. Redis مخطط للـcache/jobs لكنه غير مستخدم بعد، لذلك لم يضف إلى Compose حاليًا.

```bash
docker compose -f infrastructure/docker-compose.yml up -d
docker compose -f infrastructure/docker-compose.yml down
```
