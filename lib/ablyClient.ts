import Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;

export function getAblyClient() {
  if (typeof window === 'undefined') return null;
  if (ablyClient) return ablyClient;

  // ✅ modern API
  ablyClient = new Ably.Realtime({
    authUrl: process.env.NEXT_PUBLIC_ABLY_AUTH_URL || '/api/ably-auth',
  });

  return ablyClient;
}
