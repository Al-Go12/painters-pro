import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const TOKEN_NAME = 'pq_token';

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  return request.cookies?.get(TOKEN_NAME)?.value || null;
}

export function requireAuth(request) {
  const token = getTokenFromRequest(request);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value || null;
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
}

export { TOKEN_NAME };
