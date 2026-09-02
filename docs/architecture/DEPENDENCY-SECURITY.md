# Dependency Security

## Policy

Phase 0 commits `package-lock.json`, installs with `npm ci`, captures the full `npm audit` report in CI, and fails the Quality Gate for High/Critical findings in the production/runtime dependency tree. No `npm audit fix --force` is used.

The full audit is retained as CI evidence even when a finding belongs only to build tooling. High/Critical build-time findings must be documented here until an upstream-compatible remediation exists.

## Six findings observed before remediation

| Package          | Severity                     | Direct / transitive | Scope                                     | Dependency path                                        | Affected version/range                                                    | Safe version / mitigation                                                                     | Breaking?                                                                                                           | Action                                                                                                                                                                                    |
| ---------------- | ---------------------------- | ------------------- | ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concurrently`   | Critical meta-vulnerability  | Direct              | Dev                                       | root devDependency                                     | `9.2.1`                                                                   | `9.2.4`                                                                                       | No, patch update                                                                                                    | **Resolved.** Updated to `9.2.4`; this upgrades the vulnerable `shell-quote` chain.                                                                                                       |
| `shell-quote`    | Critical (and High advisory) | Transitive          | Dev                                       | `concurrently -> shell-quote`                          | `1.8.3`; advisories affect through `1.8.4`                                | `>=1.9.0`                                                                                     | No project-level breaking change; transitive update through patched parent                                          | **Resolved.** `concurrently@9.2.4` supplies the patched dependency line.                                                                                                                  |
| `effect`         | High                         | Transitive          | Prisma CLI/config tooling                 | `prisma -> @prisma/config -> effect`                   | `<3.20.0`; `3.18.4` was observed                                          | `>=3.20.0`                                                                                    | No project-level breaking change through a Prisma patch                                                             | **Resolved.** Prisma CLI/Client were updated together to `6.19.3`; the committed lockfile contains `effect@3.21.0`.                                                                       |
| `deepmerge-ts`   | High                         | Transitive          | Prisma CLI/config tooling (`devOptional`) | `prisma -> @prisma/config -> deepmerge-ts`             | `<8.0.0`; `7.1.5` remains in Prisma `6.19.3`                              | `>=8.0.0`, but Prisma 6.19.3 does not natively consume that major                             | Yes at the transitive package SemVer level (`7 -> 8`)                                                               | **Open build-time debt.** Do not force an unsupported override or `npm audit fix --force`. Track Prisma upstream and upgrade when Prisma publishes a compatible patched dependency graph. |
| `@prisma/config` | High meta-vulnerability      | Transitive          | Prisma CLI/config tooling (`devOptional`) | `prisma -> @prisma/config`                             | npm audit flags the package because of the `deepmerge-ts` descendant      | No supported non-breaking fix in the current Prisma 6.19.3 line for this remaining descendant | npm's suggested move to `prisma@6.12.0` is a downgrade and can remove later behavior; treat as potentially breaking | **Open build-time debt.** Kept at `6.19.3`; runtime tree excludes Prisma CLI/config tooling.                                                                                              |
| `prisma`         | High meta-vulnerability      | Direct              | Dev/build CLI                             | `apps/api` devDependency -> `prisma -> @prisma/config` | `6.19.3` is still flagged through the remaining `deepmerge-ts` descendant | No supported non-breaking upstream fix for the remaining descendant in this line              | A forced downgrade/major migration is not accepted silently                                                         | **Open build-time debt.** Keep CLI/Client aligned at `6.19.3`, document the finding, and revisit on Prisma upstream fix.                                                                  |

## Runtime interpretation

`@prisma/client` is the runtime database client. The currently unresolved High chain (`prisma`, `@prisma/config`, `deepmerge-ts`) belongs to Prisma CLI/config tooling and is marked `devOptional` in the committed lockfile. It is not imported by request-time NestJS business logic.

npm's `--omit=dev` alone can still report `devOptional` packages because Prisma CLI is also represented through optional-peer metadata. Therefore the runtime gate intentionally uses:

```text
npm audit --omit=dev --omit=optional --audit-level=high
```

This is not suppression of a runtime finding; it selects the production dependency tree that is actually shipped. The complete unfiltered `npm audit --json` report and `npm ls --all --json` dependency tree are preserved as CI artifacts so the remaining build-time High findings stay visible and reviewable.

## Why the `deepmerge-ts` override was removed

A root override to `deepmerge-ts@8.0.0` was evaluated but did not remediate the installed/audited Prisma CLI tree in the deterministic run, and it crosses a transitive major boundary. Keeping an ineffective or unproven override would create false confidence. The override was therefore removed rather than forcing unsupported internals.

## Merge rule

Phase 0 may be reviewed only if all of the following are true on the same Head SHA:

1. `npm ci` succeeds from the committed lockfile.
2. Runtime audit has zero High/Critical findings.
3. The full audit artifact is retained and any build-time High/Critical finding is documented here.
4. Format, ESLint, Prisma validate/migrate/seed, API/Web builds, runtime smoke, and Foundation security integration tests all pass.

Any new runtime High/Critical advisory blocks merge. Any new build-time High/Critical advisory must be classified and documented before merge.
