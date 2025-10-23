import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { loginSchema } from '@/lib/auth/validators';
import { getUserByEmail } from '@/lib/auth/userStore';
import { applySessionCookie, createSessionToken } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user.id);
    const { passwordHash: _removed, ...sessionUser } = user;

    const response = NextResponse.json(
      { user: sessionUser },
      { status: 200 }
    );
    applySessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
