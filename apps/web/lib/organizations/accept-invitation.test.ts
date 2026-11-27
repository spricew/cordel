import assert from 'node:assert/strict';
import test from 'node:test';

import {
  executeAcceptInvitation,
  isAcceptedInvitation,
  readInvitationTokenFromSearchParams,
  validateInvitationToken,
} from './accept-invitation.ts';

function createFormData(token: string): FormData {
  const formData = new FormData();
  formData.set('token', token);
  return formData;
}

void test('validateInvitationToken recorta espacios y rechaza formatos inválidos', () => {
  assert.deepEqual(validateInvitationToken('  tok_123  '), { token: 'tok_123' });
  assert.equal(validateInvitationToken('   ').error, 'El código de invitación es obligatorio');
  assert.equal(
    validateInvitationToken('tok con espacios').error,
    'El código de invitación no tiene un formato válido',
  );
  assert.equal(
    validateInvitationToken('a'.repeat(257)).error,
    'El código de invitación no tiene un formato válido',
  );
});

void test('readInvitationTokenFromSearchParams acepta string o array y recorta el valor', () => {
  assert.equal(readInvitationTokenFromSearchParams('  tok_123  '), 'tok_123');
  assert.equal(readInvitationTokenFromSearchParams(['tok_array', 'otro']), 'tok_array');
  assert.equal(readInvitationTokenFromSearchParams(undefined), '');
  assert.equal(readInvitationTokenFromSearchParams('a'.repeat(300)).length, 256);
});

void test('executeAcceptInvitation acepta invitación válida, revalida rutas y no filtra el token', async () => {
  const revalidated: string[] = [];
  let requestedUrl = '';

  const state = await executeAcceptInvitation(createFormData('  secret-token-xyz  '), {
    fetchWithAuth: async (path, init) => {
      requestedUrl = path;
      assert.equal(init?.method, 'POST');
      assert.equal(init?.body, JSON.stringify({ token: 'secret-token-xyz' }));
      return {
        ok: true,
        response: new Response(
          JSON.stringify({
            userId: 'u1',
            organizationId: 'o1',
            role: 'ADMIN',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            organization: { id: 'o1', name: 'Acme', slug: 'acme' },
          }),
          { status: 201 },
        ),
      };
    },
    revalidate: (path) => {
      revalidated.push(path);
    },
  });

  assert.equal(requestedUrl, '/api/v1/me/invitations/accept');
  assert.deepEqual(state, {
    status: 'success',
    organization: { id: 'o1', name: 'Acme', slug: 'acme' },
    role: 'ADMIN',
  });
  assert.deepEqual(revalidated, ['/organizations', '/organizations/acme']);
  assert.equal(JSON.stringify(state).includes('secret-token-xyz'), false);
});

void test('executeAcceptInvitation maneja 404 sin filtrar existencia ni estado y maneja 429', async () => {
  const notFound = await executeAcceptInvitation(createFormData('tok-x'), {
    fetchWithAuth: async () => ({
      ok: true,
      response: new Response(JSON.stringify({ message: 'Invitación no encontrada' }), {
        status: 404,
      }),
    }),
    revalidate: () => {},
  });

  assert.equal(notFound.status, 'error');
  assert.match(notFound.message ?? '', /No encontramos una invitación válida/);
  assert.equal(JSON.stringify(notFound).includes('tok-x'), false);

  const throttled = await executeAcceptInvitation(createFormData('tok-x'), {
    fetchWithAuth: async () => ({
      ok: true,
      response: new Response(JSON.stringify({ message: 'Too many' }), { status: 429 }),
    }),
    revalidate: () => {},
  });

  assert.equal(throttled.status, 'error');
  assert.match(throttled.message ?? '', /Demasiados intentos fallidos/);
});

void test('executeAcceptInvitation maneja errores de sesión, red y respuestas malformadas', async () => {
  const noSession = await executeAcceptInvitation(createFormData('tok-x'), {
    fetchWithAuth: async () => ({ ok: false, reason: 'no-session' }),
    revalidate: () => {},
  });
  assert.equal(noSession.status, 'error');
  assert.match(noSession.message ?? '', /sesión expiró/);

  const badShape = await executeAcceptInvitation(createFormData('tok-x'), {
    fetchWithAuth: async () => ({
      ok: true,
      response: new Response(JSON.stringify({ unexpected: true }), { status: 201 }),
    }),
    revalidate: () => {},
  });
  assert.equal(badShape.status, 'error');
  assert.match(badShape.message ?? '', /respuesta inesperada/);
});

void test('isAcceptedInvitation valida la forma estricta de la respuesta', () => {
  assert.equal(
    isAcceptedInvitation({
      userId: 'u1',
      organizationId: 'o1',
      role: 'MEMBER',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      organization: { id: 'o1', name: 'Acme', slug: 'acme' },
    }),
    true,
  );
  assert.equal(
    isAcceptedInvitation({ userId: 'u1', organization: { id: 'o1', name: 'Acme', slug: '' } }),
    false,
  );
});
