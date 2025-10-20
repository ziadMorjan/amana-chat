import Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;

export function getAblyClient(clientId?: string) {
  if (typeof window === 'undefined') return null;
  if (ablyClient) return ablyClient;

  const baseAuthUrl = process.env.NEXT_PUBLIC_ABLY_AUTH_URL || '/api/ably-auth';
  const authUrl = clientId ? `${baseAuthUrl}?clientId=${encodeURIComponent(clientId)}` : baseAuthUrl;

  ablyClient = new Ably.Realtime({ authUrl });

  return ablyClient;
}
