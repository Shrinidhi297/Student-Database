import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ScrollDemoSection() {
  const [stats, setStats] = useState({ total: 0, active: 0, departments: 0, avgGpa: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchStats() {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      const { data: students } = await supabase
        .from('students')
        .select('status,department,gpa')
        .eq('user_id', userId);

      if (!active || !students) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      const total = students.length;
      const activeCount = students.filter((s) => s.status === 'active').length;
      const depts = new Set(students.map((s) => s.department).filter(Boolean));
      const gpas = students.map((s) => s.gpa).filter((g): g is number => g !== null);
      const avg = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

      if (active) {
        setStats({ total, active: activeCount, departments: depts.size, avgGpa: Math.round(avg * 10) / 10 });
        setLoading(false);
      }
    }

    fetchStats();

    const channel = supabase
      .channel('scroll-demo-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const statItems = [
    { label: 'Students', value: loading ? '...' : stats.total.toLocaleString(), color: 'from-primary/30 to-purple-600/20' },
    { label: 'Active', value: loading ? '...' : stats.active.toLocaleString(), color: 'from-emerald-500/30 to-emerald-600/20' },
    { label: 'Departments', value: loading ? '...' : String(stats.departments), color: 'from-blue-500/30 to-indigo-600/20' },
    { label: 'Avg GPA', value: loading ? '...' : String(stats.avgGpa), color: 'from-amber-500/30 to-orange-600/20' },
  ];

  return (
    <ContainerScroll
      titleComponent={
        <>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" />
            Scroll to explore
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Manage everything in
            <br />
            <span className="mt-2 block bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
              one dashboard
            </span>
          </h2>
        </>
      }
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="grid w-full grid-cols-2 gap-3 md:gap-4">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-gradient-to-br ${stat.color} p-4 md:p-6 backdrop-blur-xl`}
            >
              <span className="text-2xl font-bold text-foreground md:text-4xl">{stat.value}</span>
              <span className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
        <Link to="/dashboard" className="mt-2 w-full md:mt-4">
          <div className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-300 hover:bg-primary/5 hover:shadow-[0_0_30px_rgba(133,102,255,0.1)] md:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition-all duration-300 group-hover:bg-primary/30 group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">AI Search ready</p>
              <p className="text-xs text-muted-foreground">Ask anything about your students</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </Link>
      </div>
    </ContainerScroll>
  );
}
