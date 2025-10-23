import { redirect } from 'next/navigation';
import ChatRoom from '@/components/ChatRoom';
import { getSessionUser } from '@/lib/auth/session';

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return <ChatRoom user={user} />;
}
