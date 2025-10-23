import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/auth/session';
import { fetchRecentMessages, saveChatMessage } from '@/lib/messages/store';

const messageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be 1000 characters or fewer'),
});

export async function GET(request: Request) {
  await requireSessionUser();
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const messages = await fetchRecentMessages(Number.isFinite(limit) ? limit : 50);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  const payload = await request.json();
  const parsed = messageSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().formErrors?.[0] ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const saved = await saveChatMessage({
    userId: user.id,
    username: user.name,
    text: parsed.data.text,
  });

  return NextResponse.json({ message: saved }, { status: 201 });
}
