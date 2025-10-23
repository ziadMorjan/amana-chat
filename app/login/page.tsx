import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getSessionUser } from '@/lib/auth/session';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect('/');
  }

  return <AuthForm mode="login" />;
}
