import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth/cookie';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';

const LOGIN_PATH = '/login';
const HOME_PATH = '/organizations';

/**
 * Redirect optimista: solo comprueba que la cookie exista.
 * La validez real del token la decide la API (GET /auth/me) en el layout.
 */
export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = token !== undefined && token !== '';

  if (request.nextUrl.pathname === LOGIN_PATH) {
    if (hasSession) {
      const nextPath = sanitizeRedirectPath(request.nextUrl.searchParams.get('next'), HOME_PATH);
      return NextResponse.redirect(new URL(nextPath, request.url));
    }

    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const safeNext = sanitizeRedirectPath(requestedPath, '');
    if (safeNext !== '') {
      loginUrl.searchParams.set('next', safeNext);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/organizations/:path*', '/invitations', '/invitations/:path*', '/login'],
};
