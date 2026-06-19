import { ArrowRight, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    description: 'Clerk handles sign-in while each student row is scoped by the signed-in Clerk user id.',
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Scholar</p>
          <p className="text-sm text-muted-foreground">Student tracking for modern schools</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" className="inline-flex items-center gap-2">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-20 pt-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:pt-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            Built for secure student records and a calm, focused workflow.
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
            A polished student database tracker for teams that need clarity.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Scholar combines authenticated record keeping, live dashboard insights, and a streamlined add/edit/delete flow
            so staff can manage student data with less friction.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_50%)] blur-2xl" />
          <Card className="overflow-hidden border-border/80 bg-card/90 shadow-soft backdrop-blur">
            <CardHeader>
              <CardDescription>Workspace preview</CardDescription>
              <CardTitle>Everything you need in one secure place</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Example roster size</p>
                <p className="mt-1 text-3xl font-semibold">248 students</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {['Active 182', 'Inactive 31', 'Graduated 35'].map((value) => (
                  <div key={value} className="rounded-xl border border-border bg-background p-3 text-center">
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
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border/80 bg-card shadow-sm">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
