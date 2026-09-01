import type { NextFunction, Request, Response } from 'express';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const GLOBAL_LIMIT = 120;
const AUTH_LIMIT = 10;
const STRICT_AUTH_PATHS = new Set([
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
]);

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const strictAuth = STRICT_AUTH_PATHS.has(req.path);
  const scope = strictAuth ? 'auth' : 'global';
  const limit = strictAuth ? AUTH_LIMIT : GLOBAL_LIMIT;
  const key = `${scope}:${clientKey(req)}`;
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader('x-ratelimit-limit', String(limit));
  res.setHeader('x-ratelimit-remaining', String(Math.max(0, limit - bucket.count)));
  res.setHeader('x-ratelimit-reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > limit) {
    res.setHeader('retry-after', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'تم تجاوز الحد المسموح من الطلبات، حاول لاحقًا',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (buckets.size > 10_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  next();
}
