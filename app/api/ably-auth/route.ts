import { NextResponse } from 'next/server';
import Ably from 'ably'; // ✅ modern import

const ably = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function GET() {
  try {
    const clientId = 'anon-' + Math.random().toString(36).slice(2, 9);
    const tokenRequest = await ably.auth.createTokenRequest({ clientId });
    return NextResponse.json(tokenRequest);
  } catch (err: any) {
    console.error('Ably token request error', err);
    return NextResponse.json({ error: 'Failed to create token request' }, { status: 500 });
  }
}
