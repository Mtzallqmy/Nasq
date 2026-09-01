function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function booleanValue(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} must be true or false`);
}

function commaSeparated(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getRuntimeConfig() {
  const jwtAccessSecret = required('JWT_ACCESS_SECRET');
  if (jwtAccessSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    apiPort: positiveInteger('API_PORT', 4000),
    databaseUrl: required('DATABASE_URL'),
    corsOrigins: commaSeparated('CORS_ORIGINS', ['http://localhost:3000']),
    jwtAccessSecret,
    jwtAccessTtlSeconds: positiveInteger('JWT_ACCESS_TTL_SECONDS', 900),
    refreshTokenTtlDays: positiveInteger('REFRESH_TOKEN_TTL_DAYS', 30),
    authCookieSecure: booleanValue('AUTH_COOKIE_SECURE', false),
  } as const;
}
