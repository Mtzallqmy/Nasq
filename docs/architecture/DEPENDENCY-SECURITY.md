# Dependency Security

## Policy

Phase 0 commits `package-lock.json`, installs with `npm ci`, captures the full `npm audit` report in CI, and fails the Quality Gate for High/Critical findings in the runtime-oriented audit. No `npm audit fix --force` is used.

## Findings observed before remediation

| Package | Severity | Direct / transitive | Scope | Dependency path | Affected version/range | Safe version / mitigation | Breaking? | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `concurrently` | Critical meta-vulnerability | Direct | Dev | root devDependency | `9.2.1` | `9.2.4` | No, patch update | Updated to `9.2.4`; this resolves its vulnerable `shell-quote` dependency. |
| `shell-quote` | Critical (also contains a High advisory) | Transitive | Dev | `concurrently -> shell-quote` | `1.8.3`; advisories affect through `1.8.4` | `1.9.0` | No, minor within major 1 | Resolved through `concurrently@9.2.4`, which depends on `shell-quote@1.9.0`. |
| `prisma` | High meta-vulnerability | Direct | Dev / CLI | `apps/api` devDependency | `6.19.0` | `6.19.3` plus patched transitive graph | No, patch update | Updated Prisma CLI and Client together to `6.19.3`. |
| `@prisma/config` | High meta-vulnerability | Transitive | Dev / CLI | `prisma -> @prisma/config` | `6.19.0` | `6.19.3` plus `deepmerge-ts` override | No for Prisma patch; override addressed separately below | Updated with Prisma; vulnerable transitive packages are pinned to patched versions. |
| `effect` | High | Transitive | Dev / Prisma CLI config | `prisma -> @prisma/config -> effect` | `<3.20.0` (`3.18.4` observed) | `3.20.0` | No, minor update | Prisma `6.19.3` is the Prisma 6 security patch that updates `effect`. |
| `deepmerge-ts` | High | Transitive | Dev / Prisma CLI config | `prisma -> @prisma/config -> deepmerge-ts` | `<8.0.0` (`7.1.5` observed) | `8.0.0` | Yes at transitive package SemVer level (7 -> 8) | Root npm `overrides` pins `deepmerge-ts@8.0.0`; Prisma validate/migrate/seed/build CI gates must remain green. Remove the override when Prisma consumes a patched 8.x release itself. |

## Runtime interpretation

`@prisma/client` is the runtime database client. The vulnerable `@prisma/config`, `effect`, and `deepmerge-ts` chain is reached through the Prisma CLI/config tooling, not through request-time NestJS business logic. npm may classify the Prisma CLI as `devOptional` because it is also an optional peer of `@prisma/client`, so `npm audit --omit=dev` can still surface the meta-vulnerability. We remediate it rather than suppressing the gate.

`concurrently` and `shell-quote` are local development process-launch tooling and are not application runtime dependencies. They are nevertheless upgraded to patched versions.

## Temporary override debt

The `deepmerge-ts@8.0.0` override is intentionally narrow and temporary. It must not be removed merely to simplify the dependency tree. Removal condition:

1. Prisma publishes a compatible release whose `@prisma/config` consumes `deepmerge-ts >= 8.0.0` itself.
2. Upgrade Prisma/Client together.
3. Remove the override.
4. Re-run `npm ci`, audit, Prisma validation/migrations/seed, builds, and Foundation security tests.

The successful Phase 0 CI is the compatibility evidence for the current override; if Prisma CLI validation/migration behavior fails, the override is not acceptable and must be revisited instead of bypassing the gate.
