'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type AuthMode = 'login' | 'register';

const config: Record<
  AuthMode,
  {
    title: string;
    endpoint: string;
    submitLabel: string;
    altLabel: string;
    altHref: string;
    altCta: string;
  }
> = {
  login: {
    title: 'Welcome back',
    endpoint: '/api/auth/login',
    submitLabel: 'Sign in',
    altLabel: "Don't have an account?",
    altHref: '/register',
    altCta: 'Create one',
  },
  register: {
    title: 'Create your account',
    endpoint: '/api/auth/register',
    submitLabel: 'Sign up',
    altLabel: 'Already registered?',
    altHref: '/login',
    altCta: 'Sign in',
  },
};

type FormState = {
  email: string;
  password: string;
  name?: string;
};

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    name: mode === 'register' ? '' : undefined,
  });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const { title, endpoint, submitLabel, altLabel, altHref, altCta } = config[mode];
  const isRegister = mode === 'register';

  function updateField(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);

    try {
      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
      };
      if (isRegister) {
        payload.name = (form.name ?? '').trim();
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          typeof data?.error === 'string' ? data.error : 'Something went wrong. Please try again.'
        );
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (err) {
      console.error('auth submit error', err);
      setError('Unexpected error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
          <p className="text-sm text-slate-500">
            {isRegister ? 'Join the conversation by signing up.' : 'Enter your credentials to continue.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name ?? ''}
                onChange={event => updateField('name', event.target.value)}
                required
                minLength={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={event => updateField('email', event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={event => updateField('password', event.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className={clsx(
              'w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-200',
              pending && 'opacity-70'
            )}
          >
            {pending ? 'Please wait...' : submitLabel}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          {altLabel}{' '}
          <Link href={altHref} className="font-semibold text-blue-600 hover:text-blue-500">
            {altCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
