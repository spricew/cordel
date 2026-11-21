import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth/cookie';

/**
 * Redirect optimista: solo comprueba que la cookie exista.
 * La validez real del token la decide la API (GET /auth/me) en el layout.
 */
export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (token === undefined || token === '') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// rutas
export const config = {
  matcher: ['/organizations/:path*'],
};
