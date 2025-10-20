import { NextResponse } from 'next/server';
import Ably from 'ably';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      console.error('Ably auth error: missing ABLY_API_KEY');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const url = new URL(request.url);
    const providedClientId = url.searchParams.get('clientId') || undefined;
    const clientId = providedClientId || 'anon-' + Math.random().toString(36).slice(2, 9);

    const ably = new Ably.Rest(apiKey);
    const tokenRequest = await ably.auth.createTokenRequest({ clientId });
    return NextResponse.json(tokenRequest);
  } catch (err: any) {
    console.error('Ably token request error', err);
    return NextResponse.json({ error: 'Failed to create token request' }, { status: 500 });
  }
}
