import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/auth/validators';
import { createUser, getUserByEmail } from '@/lib/auth/userStore';
import { applySessionCookie, createSessionToken } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = registerSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    const token = await createSessionToken(user.id);

    const { passwordHash: _removed, ...sessionUser } = user;
    const response = NextResponse.json(
      { user: sessionUser },
      { status: 201 }
    );
    applySessionCookie(response, token);

    return response;
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    console.error('Register error', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
