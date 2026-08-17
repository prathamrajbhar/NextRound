import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const hasToken = !!(accessToken || refreshToken);

  const { pathname } = request.nextUrl;

  const targetDashboard = userRole === 'hr' ? '/hr/dashboard' : '/candidate/dashboard';

  const redirectToLogin = (path: string) => {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  };

  // Protect HR routes and HR onboarding
  if (pathname.startsWith('/hr') || pathname.startsWith('/onboarding/company')) {
    if (!hasToken) return redirectToLogin(pathname);
    if (userRole !== 'hr') {
      return NextResponse.redirect(new URL('/candidate/dashboard', request.url));
    }
  }

  // Protect Candidate routes and Candidate onboarding
  if (pathname.startsWith('/candidate') || pathname.startsWith('/onboarding/candidate')) {
    if (!hasToken) return redirectToLogin(pathname);
    if (userRole !== 'candidate') {
      return NextResponse.redirect(new URL('/hr/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from login/signup
  if (hasToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/hr/:path*',
    '/candidate/:path*',
    '/login',
    '/signup',
    '/onboarding/:path*',
  ],
};
