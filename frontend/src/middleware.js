import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Use access_token as the primary auth signal (15 min); fall back to session_token
  // to allow the client-side refresh interceptor to kick in before hard redirect
  const token = request.cookies.get('access_token')?.value ||
    request.cookies.get('session_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const isAdminRoute  = pathname.startsWith('/admin');
  const isClientRoute = pathname.startsWith('/dashboard');
  const isPublicRoute = pathname.startsWith('/i/') || pathname === '/' || pathname.startsWith('/pricing') || pathname === '/register';

  if (isPublicRoute) return NextResponse.next();

  // Redirect unauthenticated users to login
  if ((isAdminRoute || isClientRoute) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
};
