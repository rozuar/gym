import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'session';
const ROLE_COOKIE = 'role';

/** Rutas públicas: no requieren sesión */
const PUBLIC_PATHS = ['/', '/login', '/register'];

/** Rutas solo para admin (requieren role=admin) */
const ADMIN_ONLY_PATHS: string[] = [];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (!session || session !== '1') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAdminOnlyPath(pathname) && role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile',
    '/profile/:path*',
    '/bookings',
    '/bookings/:path*',
    '/schedule',
    '/schedule/:path*',
    '/plans',
    '/plans/:path*',
    '/results',
    '/results/:path*',
  ],
};
