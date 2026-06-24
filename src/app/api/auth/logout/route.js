import { NextResponse } from 'next/server';
import { clearAuthCookieOptions, TOKEN_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_NAME, '', clearAuthCookieOptions());
  return response;
}
