import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeRedirectPath } from './redirect.ts';

void test('sanitizeRedirectPath acepta rutas relativas seguras del mismo origen', () => {
  assert.equal(sanitizeRedirectPath('/organizations'), '/organizations');
  assert.equal(sanitizeRedirectPath('/invitations'), '/invitations');
  assert.equal(
    sanitizeRedirectPath('/organizations/acme?tab=members'),
    '/organizations/acme?tab=members',
  );
});

void test('sanitizeRedirectPath bloquea open redirects y rutas inválidas', () => {
  const malicious = [
    'https://evil.example/phish',
    'http://localhost:3000/organizations',
    '//evil.example/steal',
    '/\\evil.example',
    'javascript:alert(1)',
    '/organizations\r\nSet-Cookie: bad=1',
    '/login',
    '/register?foo=1',
    '/session-expired',
    '',
    'relative-without-slash',
    null,
    undefined,
  ];

  for (const candidate of malicious) {
    assert.equal(
      sanitizeRedirectPath(candidate, '/organizations'),
      '/organizations',
      `debió rechazar: ${String(candidate)}`,
    );
  }
});
