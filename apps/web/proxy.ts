import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth/cookie';

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
      return NextResponse.redirect(new URL(HOME_PATH, request.url));
    }

    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/organizations/:path*', '/login'],
};
