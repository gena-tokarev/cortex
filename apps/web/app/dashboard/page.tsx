'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AuthUser } from '@/lib/auth';

interface MeResponse {
  user: AuthUser;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch('/web-api/auth/me', {
          cache: 'no-store',
        });

        if (response.status === 401) {
          router.replace('/auth');
          return;
        }

        const payload = (await response.json()) as Partial<MeResponse>;

        if (
          !response.ok ||
          typeof payload.user?.id !== 'string' ||
          typeof payload.user?.email !== 'string' ||
          !Array.isArray(payload.user?.roles)
        ) {
          throw new Error('Failed to load the active session.');
        }

        if (!cancelled) {
          setUser(payload.user as AuthUser);
          setIsReady(true);
        }
      } catch {
        if (!cancelled) {
          router.replace('/auth');
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!isReady || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Dashboard
            </p>
            <h1 className="mt-2 font-serif text-4xl text-balance">
              Welcome back, {user.email}
            </h1>
          </div>
          <Button
            onClick={async () => {
              setIsSigningOut(true);

              try {
                await fetch('/web-api/auth/logout', {
                  method: 'POST',
                });
              } finally {
                router.replace('/auth');
              }
            }}
            disabled={isSigningOut}
            type="button"
            variant="outline"
          >
            <LogOut className="size-4" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-primary" />
                Google login completed
              </CardTitle>
              <CardDescription>
                This dashboard confirms the OAuth redirect and code exchange
                flow is connected from the web app to `auth-api`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/60 p-4">
                <p className="text-sm text-muted-foreground">
                  Logged in as
                </p>
                <p className="mt-1 text-base font-medium">{user.email}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/60 p-4">
                <p className="text-sm text-muted-foreground">
                  Session transport
                </p>
                <p className="mt-1 text-base font-medium">
                  cookie
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session preview</CardTitle>
              <CardDescription>
                The web app now relies on the backend cookie session instead of
                storing tokens in client-side storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  User ID
                </p>
                <p className="mt-1 break-all text-sm">{user.id}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Roles
                </p>
                <p className="mt-1 text-sm">
                  {user.roles.length > 0
                    ? user.roles.join(', ')
                    : 'No roles assigned'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Session source
                </p>
                <p className="mt-1 text-sm">
                  `auth-api` cookies via same-origin Next routes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
