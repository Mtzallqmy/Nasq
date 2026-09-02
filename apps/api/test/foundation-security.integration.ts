import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import { PermissionEffect, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiBase = `http://localhost:${process.env.API_PORT ?? '4000'}/api/v1`;
const password = 'correct-horse-battery-staple';

type JsonRecord = Record<string, unknown>;

function refreshCookie(response: Response): string {
  const value = response.headers.get('set-cookie');
  const match = value?.match(/nasq_refresh=([^;]+)/);
  assert.ok(match?.[1], 'refresh cookie was not set');
  return `nasq_refresh=${match[1]}`;
}

async function json(response: Response): Promise<JsonRecord> {
  return (await response.json()) as JsonRecord;
}

async function expectStatus(response: Response, expected: number, label: string): Promise<void> {
  if (response.status !== expected) {
    const body = await response.text();
    assert.equal(
      response.status,
      expected,
      `${label}: expected ${expected}, got ${response.status}: ${body}`,
    );
  }
}

async function register(email: string, displayName: string) {
  const response = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  await expectStatus(response, 201, `register ${email}`);
  const body = await json(response);
  return {
    body,
    user: body.user as JsonRecord,
    accessToken: body.accessToken as string,
    sessionId: body.sessionId as string,
    cookie: refreshCookie(response),
  };
}

async function login(email: string) {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  await expectStatus(response, 201, `login ${email}`);
  const body = await json(response);
  return {
    accessToken: body.accessToken as string,
    sessionId: body.sessionId as string,
    cookie: refreshCookie(response),
  };
}

async function refresh(cookie: string) {
  const response = await fetch(`${apiBase}/auth/refresh`, {
    method: 'POST',
    headers: { cookie },
  });
  const body = response.status < 400 ? await json(response) : undefined;
  return {
    response,
    body,
    cookie: response.status < 400 ? refreshCookie(response) : undefined,
  };
}

async function createWorkspace(accessToken: string, name: string) {
  const response = await fetch(`${apiBase}/workspaces`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  await expectStatus(response, 201, `create workspace ${name}`);
  return json(response);
}

function bearer(accessToken: string, workspaceId?: string): HeadersInit {
  return {
    authorization: `Bearer ${accessToken}`,
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
  };
}

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function expiredAccessToken(userId: string, email: string, sessionId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  assert.ok(secret, 'JWT_ACCESS_SECRET is required for integration tests');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      sid: sessionId,
      email,
      type: 'access',
      iat: now - 120,
      exp: now - 60,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

async function run(): Promise<void> {
  const suffix = Date.now();
  const emailA = `foundation-a-${suffix}@nasq.local`;
  const emailB = `foundation-b-${suffix}@nasq.local`;
  const emailC = `foundation-c-${suffix}@nasq.local`;

  const registeredA = await register(emailA, 'User A');
  const loggedInA = await login(emailA);

  const rotated = await refresh(loggedInA.cookie);
  await expectStatus(rotated.response, 201, 'refresh rotation');
  assert.ok(
    rotated.body?.accessToken && rotated.cookie,
    'rotation must issue access token and new cookie',
  );
  const accessA = rotated.body.accessToken as string;
  const rotatedCookieA = rotated.cookie;

  const oldRefresh = await refresh(loggedInA.cookie);
  await expectStatus(oldRefresh.response, 401, 'old refresh token after rotation');

  const workspaceA = await createWorkspace(accessA, 'مساحة أ');
  const workspaceAId = workspaceA.id as string;

  const registeredB = await register(emailB, 'User B');
  const workspaceB = await createWorkspace(registeredB.accessToken, 'مساحة ب');
  const workspaceBId = workspaceB.id as string;

  const crossWorkspace = await fetch(`${apiBase}/workspaces/current`, {
    headers: bearer(accessA, workspaceBId),
  });
  await expectStatus(crossWorkspace, 403, 'User A cannot access Workspace B');

  const memberBInWorkspaceB = await prisma.workspaceMember.findUniqueOrThrow({
    where: {
      workspaceId_userId: { workspaceId: workspaceBId, userId: registeredB.user.id as string },
    },
  });
  const ownerRoleA = await prisma.role.findUniqueOrThrow({
    where: { workspaceId_key: { workspaceId: workspaceAId, key: 'owner' } },
  });

  let crossRoleRejected = false;
  try {
    await prisma.workspaceMemberRole.create({
      data: {
        workspaceMemberId: memberBInWorkspaceB.id,
        roleId: ownerRoleA.id,
        workspaceId: workspaceBId,
      },
    });
  } catch (error) {
    crossRoleRejected =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
  }
  assert.ok(
    crossRoleRejected,
    'DB must reject assigning a Workspace A role to a Workspace B member',
  );

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspaceAId,
      userId: registeredB.user.id as string,
      status: 'ACTIVE',
    },
  });

  const unauthorizedMemberRead = await fetch(`${apiBase}/workspaces/current/members`, {
    headers: bearer(registeredB.accessToken, workspaceAId),
  });
  await expectStatus(
    unauthorizedMemberRead,
    403,
    'member without permission cannot read workspace members',
  );

  const ownerCanManageRoles = await fetch(`${apiBase}/workspaces/current/roles`, {
    headers: bearer(accessA, workspaceAId),
  });
  await expectStatus(ownerCanManageRoles, 200, 'owner inherits roles.manage');

  const memberA = await prisma.workspaceMember.findUniqueOrThrow({
    where: {
      workspaceId_userId: { workspaceId: workspaceAId, userId: registeredA.user.id as string },
    },
  });
  const rolesManage = await prisma.permission.findUniqueOrThrow({ where: { key: 'roles.manage' } });
  await prisma.memberPermissionOverride.upsert({
    where: {
      workspaceMemberId_permissionId: {
        workspaceMemberId: memberA.id,
        permissionId: rolesManage.id,
      },
    },
    update: { effect: PermissionEffect.DENY },
    create: {
      workspaceMemberId: memberA.id,
      permissionId: rolesManage.id,
      effect: PermissionEffect.DENY,
    },
  });

  const denyBeatsRole = await fetch(`${apiBase}/workspaces/current/roles`, {
    headers: bearer(accessA, workspaceAId),
  });
  await expectStatus(denyBeatsRole, 403, 'DENY override beats inherited ALLOW');

  const invalidAccess = await fetch(`${apiBase}/users/me`, {
    headers: bearer('not-a-valid-jwt'),
  });
  await expectStatus(invalidAccess, 401, 'invalid access token');

  const expiredJwt = expiredAccessToken(
    registeredB.user.id as string,
    emailB,
    registeredB.sessionId,
  );
  const expiredAccess = await fetch(`${apiBase}/users/me`, {
    headers: bearer(expiredJwt),
  });
  await expectStatus(expiredAccess, 401, 'expired access token');

  const logout = await fetch(`${apiBase}/auth/logout`, {
    method: 'POST',
    headers: bearer(accessA),
  });
  await expectStatus(logout, 201, 'logout current session');

  const afterRevocation = await fetch(`${apiBase}/users/me`, {
    headers: bearer(accessA),
  });
  await expectStatus(afterRevocation, 401, 'revoked session rejects next request');

  const revokedRefresh = await refresh(rotatedCookieA);
  await expectStatus(revokedRefresh.response, 401, 'revoked refresh token');

  const registeredC = await register(emailC, 'User C');
  await prisma.session.update({
    where: { id: registeredC.sessionId },
    data: { expiresAt: new Date(Date.now() - 1_000) },
  });
  const expiredRefresh = await refresh(registeredC.cookie);
  await expectStatus(expiredRefresh.response, 401, 'expired refresh token');

  console.info('Foundation security integration tests passed');
}

run()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
