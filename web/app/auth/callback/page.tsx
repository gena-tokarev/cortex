'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { LoginResponse } from '@/lib/auth';

type CallbackState = 'loading' | 'error';

function getCallbackErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case 'oauth_cancelled':
      return 'Google sign-in was cancelled before it completed.';
    case 'oauth_failed':
      return 'Google sign-in failed before we could finish the flow.';
    default:
      return 'We could not complete sign-in. Please try again.';
  }
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<LoginResponse>;

  return (
    typeof candidate.user?.id === 'string' &&
    typeof candidate.user?.email === 'string' &&
    Array.isArray(candidate.user?.roles)
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const code = searchParams.get('code');
  const errorCode = searchParams.get('error');
  const status = searchParams.get('status');

  const fallbackError = useMemo(
    () => getCallbackErrorMessage(errorCode),
    [errorCode],
  );

  useEffect(() => {
    if (status === 'error') {
      setState('error');
      setErrorMessage(fallbackError);
      return;
    }

    if (!code) {
      setState('error');
      setErrorMessage('The callback is missing the expected auth code.');
      return;
    }

    let cancelled = false;

    async function completeLogin() {
      try {
        const response = await fetch('/api/auth/google/exchange', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const payload = (await response.json()) as unknown;

        if (!response.ok) {
          throw new Error(
            typeof payload === 'object' &&
              payload !== null &&
              'message' in payload &&
              typeof payload.message === 'string'
              ? payload.message
              : 'The server rejected the Google auth code.',
          );
        }

        if (!isLoginResponse(payload)) {
          throw new Error('The backend returned an unexpected login payload.');
        }

        if (!cancelled) {
          router.replace('/dashboard');
        }
      } catch (error) {
        if (!cancelled) {
          setState('error');
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'We could not finish the Google login flow.',
          );
        }
      }
    }

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [code, fallbackError, router, status]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              {state === 'loading' ? 'Completing sign-in' : 'Login failed'}
            </CardTitle>
            <CardDescription>
              {state === 'loading'
                ? 'We are exchanging the Google auth code with the backend and preparing your session.'
                : 'The login flow did not complete successfully.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {state === 'loading' ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                <LoaderCircle className="size-5 animate-spin text-primary" />
                Redirecting you to the dashboard once the backend exchange
                completes.
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-muted-foreground">
                  <ShieldAlert className="mt-0.5 size-5 text-destructive" />
                  <span>{errorMessage ?? fallbackError}</span>
                </div>
                <Button onClick={() => router.replace('/auth')} type="button">
                  Back to auth
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function CallbackLoadingState() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Completing sign-in</CardTitle>
            <CardDescription>
              We are preparing your web session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin text-primary" />
              Redirecting you to the dashboard once the backend exchange
              completes.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
