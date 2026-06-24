import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword } from '@/lib/password';
import { authCookieOptions, signToken, TOKEN_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({ userId: String(user._id) });
    const response = NextResponse.json({
      user: { _id: user._id, email: user.email, name: user.name },
    });
    response.cookies.set(TOKEN_NAME, token, authCookieOptions());
    return response;
  } catch (error) {
    const msg = String(error?.message || 'Login failed.');
    const isDb = ['MONGODB_URI', 'querySrv', 'ECONNREFUSED', 'MongoServerSelectionError', 'ENOTFOUND']
      .some((s) => msg.includes(s));
    return NextResponse.json(
      { error: isDb ? 'Database connection failed.' : msg },
      { status: isDb ? 503 : 500 }
    );
  }
}
