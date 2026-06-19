import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, LoaderCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { authSchema, type AuthFormValues } from '@/lib/validation';

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (data.session) {
        navigate('/dashboard', { replace: true });
      }

      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function onSubmit(values: AuthFormValues) {
    setLoading(true);
    setStatusMessage('');

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          throw error;
        }

        navigate(from, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setStatusMessage('Account created. Check your email to confirm your account.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-sm text-muted-foreground animate-fade-in">Loading secure workspace...</div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-primary/12 blur-[120px] animate-float" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[120px] animate-float" style={{ animationDelay: '-2.5s' }} />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <Card>
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:bg-primary/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome to Scholar</CardTitle>
              <CardDescription>Use your Supabase account to sign in or create a new account.</CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/[0.04] p-1 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${mode === 'signin' ? 'glass-strong shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${mode === 'signup' ? 'glass-strong shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign up
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" placeholder="you@example.com" {...form.register('email')} />
              </Field>
              <Field label="Password" error={form.formState.errors.password?.message}>
                <Input type="password" placeholder="At least 8 characters" {...form.register('password')} />
              </Field>

              {statusMessage ? (
                <p className="text-sm text-muted-foreground animate-fade-in">{statusMessage}</p>
              ) : null}

              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/" className="font-medium text-primary transition-all duration-200 hover:text-primary/80 hover:underline">
                Back to landing page
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
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
      {error ? <p className="text-sm text-destructive animate-fade-in-fast">{error}</p> : null}
    </div>
  );
}
