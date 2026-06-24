import { NextResponse } from 'next/server';
import { TOKEN_NAME, verifyToken } from '@/lib/auth';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token   = request.cookies.get(TOKEN_NAME)?.value;
  const isValid = !!verifyToken(token);

  const isProtectedApi = pathname.startsWith('/api/clients') || pathname.startsWith('/api/products') || pathname.startsWith('/api/quotations');

  if (isProtectedApi && !isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (pathname === '/login' && isValid) {
    return NextResponse.redirect(new URL('/clients', request.url));
  }

  if (!pathname.startsWith('/api/') && pathname !== '/login' && !isValid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/clients/:path*', '/products/:path*', '/quotations/:path*', '/api/clients/:path*', '/api/products/:path*', '/api/quotations/:path*'],
};
