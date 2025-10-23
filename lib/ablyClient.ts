import Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;
let ablyClientId: string | null = null;

export function getAblyClient(clientId?: string) {
  if (typeof window === 'undefined') return null;

  if (ablyClient && (!clientId || clientId === ablyClientId)) {
    return ablyClient;
  }

  if (ablyClient) {
    try {
      ablyClient.close();
    } catch (error) {
      console.error('Failed to close Ably client', error);
    }
    ablyClient = null;
    ablyClientId = null;
  }

  const baseAuthUrl = process.env.NEXT_PUBLIC_ABLY_AUTH_URL || '/api/ably-auth';
  const authUrl = clientId ? `${baseAuthUrl}?clientId=${encodeURIComponent(clientId)}` : baseAuthUrl;

  ablyClient = new Ably.Realtime({ authUrl });
  ablyClientId = clientId ?? null;

  return ablyClient;
}
