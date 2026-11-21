import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth/cookie';

export function GET(request: Request): NextResponse {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
