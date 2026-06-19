import { useEffect, useState } from 'react';
import { ArrowRight, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';

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
];

export function LandingPage() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, graduated: 0 });

  useEffect(() => {
    let active = true;

    async function loadLandingStats() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!active) {
        return;
      }

      setIsSignedIn(Boolean(session));

      if (!session?.user.id) {
        setStats({ total: 0, active: 0, inactive: 0, graduated: 0 });
        return;
      }

      const { data: students } = await supabase
        .from('students')
        .select('status')
        .eq('user_id', session.user.id)
        .returns<Pick<Student, 'status'>[]>();

      if (!active) {
        return;
      }

      const records = students ?? [];
      setStats({
        total: records.length,
        active: records.filter((student) => student.status === 'active').length,
        inactive: records.filter((student) => student.status === 'inactive').length,
        graduated: records.filter((student) => student.status === 'graduated').length,
      });
    }

    void loadLandingStats();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));

      if (!session?.user.id) {
        setStats({ total: 0, active: 0, inactive: 0, graduated: 0 });
        return;
      }

      supabase
        .from('students')
        .select('status')
        .eq('user_id', session.user.id)
        .then(({ data: students }) => {
          const records = (students ?? []) as Pick<Student, 'status'>[];
          setStats({
            total: records.length,
            active: records.filter((student) => student.status === 'active').length,
            inactive: records.filter((student) => student.status === 'inactive').length,
            graduated: records.filter((student) => student.status === 'graduated').length,
          });
        });
    });

    const channel = supabase
      .channel('landing-students-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        async () => {
          const { data } = await supabase.auth.getSession();
          const session = data.session;

          if (!session?.user.id) {
            return;
          }

          const { data: students } = await supabase
            .from('students')
            .select('status')
            .eq('user_id', session.user.id)
            .returns<Pick<Student, 'status'>[]>();

          if (!active) {
            return;
          }

          const records = students ?? [];
          setStats({
            total: records.length,
            active: records.filter((student) => student.status === 'active').length,
            inactive: records.filter((student) => student.status === 'inactive').length,
            graduated: records.filter((student) => student.status === 'graduated').length,
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[128px] animate-float" />
        <div className="absolute -right-48 top-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/8 blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-indigo-500/8 blur-[100px] animate-float" style={{ animationDelay: '-1s' }} />
      </div>

      <header className="mx-auto mt-6 flex max-w-7xl items-center justify-between rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:px-6 animate-fade-down">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Scholar</p>
          <p className="text-sm text-muted-foreground">Student tracking for modern schools</p>
        </div>
        {isSignedIn ? (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" className="inline-flex items-center gap-2">
                Get started <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-20 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:pt-20">
        <div className="max-w-3xl">
          <div
            className="mb-6 inline-flex rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl animate-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            Built for secure student records and a calm, focused workflow.
          </div>
          <h1
            className="max-w-4xl text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl animate-fade-up-slow"
            style={{ animationDelay: '0.15s' }}
          >
            A polished student database tracker for teams that need clarity.
          </h1>
          <p
            className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground animate-fade-up"
            style={{ animationDelay: '0.25s' }}
          >
            Scholar combines authenticated record keeping, live dashboard insights, and a streamlined add/edit/delete flow
            so staff can manage student data with less friction.
          </p>
          <div
            className="mt-8 flex flex-wrap gap-3 animate-fade-up"
            style={{ animationDelay: '0.35s' }}
          >
            {isSignedIn ? (
              <>
                <Button asChild size="lg">
                  <Link to="/dashboard">Open dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/dashboard">Open dashboard</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(133,102,255,0.2),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(118,92,255,0.12),transparent_45%)] blur-3xl animate-pulse-glow" />
          <Card className="overflow-hidden">
            <CardHeader>
              <CardDescription>Workspace preview</CardDescription>
              <CardTitle>Everything you need in one secure place</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-[1.2rem] border border-white/[0.06] bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl">
                <p className="text-sm text-muted-foreground">Example roster size</p>
                <p className="mt-1 text-3xl font-semibold">{stats.total} students</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                  `Active ${stats.active}`,
                  `Inactive ${stats.inactive}`,
                  `Graduated ${stats.graduated}`,
                ].map((value) => (
                  <div
                    key={value}
                    className="rounded-full border border-white/[0.06] bg-white/[0.03] p-3 text-center backdrop-blur-2xl transition-all duration-200 hover:bg-white/[0.06] hover:scale-105"
                  >
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="animate-stagger"
                style={{ animationDelay: `${0.4 + index * 0.12}s` }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary backdrop-blur-xl transition-all duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
