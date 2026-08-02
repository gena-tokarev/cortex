import { ArrowRight, Globe, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AuthPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(246,173,85,0.34),_transparent_66%)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[18%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.18),_transparent_68%)] blur-3xl" />
        <div className="absolute left-[-7rem] bottom-[-5rem] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.16),_transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden space-y-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/72 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-primary" />
              Web auth is being prepared for production flows
            </div>
            <div className="max-w-xl space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Cortex
              </p>
              <h1 className="font-serif text-5xl leading-tight text-balance text-foreground">
                A clean entry point for the future product experience.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-muted-foreground">
                This placeholder page gives us the shell for web authentication
                while the real `auth-api` flows land next. The UI is ready for
                Google, password, and magic-link patterns without locking us in
                too early.
              </p>
            </div>
            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-border bg-card/76 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)] backdrop-blur">
                <Globe className="mb-4 size-5 text-primary" />
                <h2 className="mb-2 text-base font-semibold">Social entry</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  A dedicated slot for Google sign-in that will later hand off
                  to the backend OAuth flow.
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-card/76 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)] backdrop-blur">
                <KeyRound className="mb-4 size-5 text-primary" />
                <h2 className="mb-2 text-base font-semibold">Flexible fallback</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Password and magic-link areas are already laid out so the next
                  iteration can plug in real behavior with minimal reshaping.
                </p>
              </div>
            </div>
          </section>

          <Card className="mx-auto w-full max-w-xl">
            <CardHeader>
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                Auth Preview
              </div>
              <CardTitle>Welcome to Cortex Web</CardTitle>
              <CardDescription>
                The page is styled and ready. Backend auth wiring is the next
                step, so the actions below are placeholders for now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                asChild
                className="w-full justify-between"
                size="lg"
              >
                <a href="/web-api/auth/google/start">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="size-4" />
                    Continue with Google
                  </span>
                  <ArrowRight className="size-4" />
                </a>
              </Button>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Coming next
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    disabled
                    placeholder="you@cortex.com"
                    type="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    disabled
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  disabled
                >
                  Sign in with email
                </Button>
              </div>

              <div className="rounded-[22px] border border-dashed border-border bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
                Google auth is now wired through the backend redirect flow. The
                email form still stays placeholder-only in this iteration.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
