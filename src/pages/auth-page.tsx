import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignInButton, useSignUp, useAuth } from '@clerk/clerk-react';
import { BookOpen, LoaderCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authSchema, type AuthFormValues } from '@/lib/validation';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  async function onSubmit(values: AuthFormValues) {
    setLoading(true);
    try {
      if (!signUp) {
        throw new Error('Clerk sign-up is not ready.');
      }

      const result = await signUp.create({
        emailAddress: values.email,
        password: values.password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        toast.success('Account created.');
        navigate('/dashboard', { replace: true });
        return;
      }

      toast.success('Account created. Check your email to finish signing in.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/80 bg-card shadow-soft">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to Scholar</CardTitle>
            <CardDescription>Sign in or create an account to manage your private student database.</CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'signin' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              Sign up
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {mode === 'signin' ? (
            <div className="grid gap-4">
              <SignInButton mode="modal" forceRedirectUrl={from}>
                <Button type="button" className="mt-2 w-full">
                  Sign in with Clerk
                </Button>
              </SignInButton>
              <p className="text-center text-sm text-muted-foreground">
                Use your Clerk account to continue into the dashboard.
              </p>
            </div>
          ) : (
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" placeholder="you@example.com" {...form.register('email')} />
              </Field>
              <Field label="Password" error={form.formState.errors.password?.message}>
                <Input type="password" placeholder="At least 8 characters" {...form.register('password')} />
              </Field>

              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/" className="font-medium text-primary hover:underline">
              Back to landing page
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
