import { useEffect, useState } from 'react';
import { ArrowRight, LayoutDashboard, ShieldCheck, Users, Sparkles, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FloatingAiAssistant } from '@/components/ui/ai-assistat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { SUGGESTED_QUERIES } from '@/lib/query-parser';
import { CursorGlow } from '@/components/cursor-glow';
import { FinisherHeaderEffect } from '@/components/finisher-header-effect';
import { ScrollReveal } from '@/components/scroll-reveal';
import { ScrollDemoSection } from '@/components/scroll-demo-section';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';

const features = [
  {
    icon: Users,
    title: 'Student records',
    description: 'Track names, grades, contact details, status, GPA, and notes in one clean workspace.',
  },
  {
    icon: LayoutDashboard,
    title: 'Live dashboard',
    description: 'Use fast search, filters, and metrics to see what is happening across your roster instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & secure',
    description: 'Supabase handles sign-in while each student row is scoped by the signed-in Supabase user id.',
  },
  {
    icon: BrainCircuit,
    title: 'AI-Powered Search',
    description: 'Ask natural language questions like "Show CSE students with attendance below 75%" and get instant results.',
  },
];

export function LandingPage() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [demoQuery, setDemoQuery] = useState('');

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setIsSignedIn(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="relative min-h-screen">
      <GeometricBackground />
      <CursorGlow />
      <div className="noise-overlay" />

      {/* Grid background pattern */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <header className="mx-auto mt-6 flex max-w-7xl items-center justify-between rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:px-6 animate-fade-down">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-purple-600/20 border border-white/15 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Scholar AI</p>
            <p className="text-sm text-muted-foreground">Student tracking for modern schools</p>
          </div>
        </Link>
        {isSignedIn ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/students">List Of Students</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" className="inline-flex items-center gap-2 ripple-btn">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </header>

      <FinisherHeaderEffect className="min-h-[90vh] overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-16 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:pt-20">
          <div className="max-w-3xl">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl animate-fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for secure student records and a calm, focused workflow.
            </div>
            <h1
              className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl animate-fade-up-slow text-gradient"
              style={{ animationDelay: '0.15s' }}
            >
              AI-powered student database tracking for teams that need clarity.
            </h1>
            <p
              className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground animate-fade-up"
              style={{ animationDelay: '0.25s' }}
            >
              Scholar combines authenticated record keeping, live dashboard insights, AI-powered natural language search,
              and a streamlined add/edit/delete flow so staff can manage student data with less friction.
            </p>
            <div
              className="mt-8 flex flex-wrap gap-3 animate-fade-up"
              style={{ animationDelay: '0.35s' }}
            >
              {isSignedIn ? (
                <>
                  <Button asChild size="lg">
                    <Link to="/dashboard" className="ripple-btn">Open dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to="/auth" className="ripple-btn">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/dashboard" className="ripple-btn">Open dashboard</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(133,102,255,0.25),transparent_60%)] blur-3xl" />
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-primary/25 to-purple-600/20 backdrop-blur-xl sm:h-24 sm:w-24 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <Sparkles className="h-8 w-8 text-primary sm:h-9 sm:w-9" />
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground">
                <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                AI-powered <span className="text-primary">Scholar</span>
              </p>
            </div>
          </div>
        </div>
      </FinisherHeaderEffect>

      {/* Scroll indicator */}
      <div className="flex justify-center pb-8 animate-fade-up" style={{ animationDelay: '0.6s' }}>
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/10">
          <div className="mt-1.5 h-2 w-1 animate-bounce rounded-full bg-primary/60" />
        </div>
      </div>

      <ScrollDemoSection />

      {/* AI Search Demo Section */}
      <ScrollReveal>
      <section className="mx-auto max-w-4xl px-6 pb-16 lg:px-8">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-xl">
            <BrainCircuit className="h-3.5 w-3.5" />
            Try AI Search
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Find students with natural language
          </h2>
          <p className="mt-3 text-muted-foreground">
            No complex filters. Just type what you need.
          </p>
        </div>

        <Card className="mt-8 overflow-hidden transition-all duration-300 hover:shadow-[0_0_60px_rgba(133,102,255,0.08)]">
          <CardHeader>
            <CardDescription>
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
              Type a query or click an example below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-2xl transition-all duration-300 focus-within:border-primary/30 focus-within:bg-white/[0.05]">
                <Sparkles className="mr-3 h-4 w-4 shrink-0 text-primary/60" />
                <input
                  type="text"
                  value={demoQuery}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  placeholder="Try: Show CSE students with attendance below 75%"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && demoQuery.trim()) {
                      if (isSignedIn) {
                        window.location.href = '/dashboard';
                      } else {
                        window.location.href = '/auth';
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="ml-2 shrink-0 rounded-xl ripple-btn"
                  onClick={() => {
                    if (demoQuery.trim()) {
                      if (isSignedIn) {
                        window.location.href = '/dashboard';
                      } else {
                        window.location.href = '/auth';
                      }
                    }
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.slice(0, 6).map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => {
                    setDemoQuery(query);
                    if (isSignedIn) {
                      window.location.href = '/dashboard';
                    } else {
                      window.location.href = '/auth';
                    }
                  }}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xl transition-all duration-200 hover:border-primary/20 hover:bg-primary/5 hover:text-primary hover:shadow-[0_0_20px_rgba(133,102,255,0.1)]"
                >
                  {query}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/60">
              <span className="font-medium">Examples:</span>
              {[
                'attendance below 75%',
                'marks above 85',
                'top 5 by marks',
                'CSE students',
                'final year',
              ].map((tag) => (
                <Badge
                  key={tag}
                  variant="muted"
                  className="cursor-pointer text-[10px] transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_12px_rgba(133,102,255,0.1)]"
                  onClick={() => {
                    setDemoQuery(tag);
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      </ScrollReveal>

      {/* Features */}
      <ScrollReveal>
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title}>
              <div
                className="group"
              >
                <Card className="h-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_50px_rgba(133,102,255,0.06)]">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary backdrop-blur-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_30px_rgba(133,102,255,0.15)]">
                      <Icon className="h-6 w-6 transition-all duration-300 group-hover:scale-105" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
      </ScrollReveal>

      <FloatingAiAssistant />
    </main>
  );
}
