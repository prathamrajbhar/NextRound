import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const hasToken = !!(accessToken || refreshToken);

  const { pathname } = request.nextUrl;

  const targetDashboard = userRole === 'hr' ? '/hr/dashboard' : '/candidate/dashboard';

  const redirectToLogin = (pathname: string) => {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  };

  if (pathname.startsWith('/hr')) {
    if (!hasToken) return redirectToLogin(pathname);
    if (userRole !== 'hr') return NextResponse.redirect(new URL('/candidate/dashboard', request.url));
  }

  if (pathname.startsWith('/candidate')) {
    if (!hasToken) return redirectToLogin(pathname);
    if (userRole !== 'candidate') return NextResponse.redirect(new URL('/hr/dashboard', request.url));
  }

  if (hasToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/hr/:path*', '/candidate/:path*', '/login', '/signup'],
};
