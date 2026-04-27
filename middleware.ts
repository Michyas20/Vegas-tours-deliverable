import { NextRequest, NextResponse } from 'next/server';

// ─── HTTP Basic Auth Middleware for /admin routes ────────────────────
// Triggers the browser's native login popup on any /admin/* request.

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'vegas2026';

function isAuthenticated(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  const base64 = authHeader.slice(6);
  const decoded = atob(base64);
  const [user, pass] = decoded.split(':');

  return user === ADMIN_USER && pass === ADMIN_PASS;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── /admin root → redirect to verification hub ──────────────────
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/verification-hub', req.url));
  }

  // ── Protect all /admin/* routes with Basic Auth ─────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated(req)) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Vegas Horizon Admin"',
        },
      });
    }
  }

  return NextResponse.next();
}

// Only run middleware on /admin paths — ignore all public routes
export const config = {
  matcher: ['/admin/:path*'],
};
