import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LayoutDashboard, Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  inactive: { label: 'Inactive', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  graduated: { label: 'Graduated', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
};

export function StudentDropdown() {
  type StudentBrief = Pick<Student, 'id' | 'first_name' | 'last_name' | 'usn' | 'status'>;
  const [students, setStudents] = useState<StudentBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id;
      if (!userId || !active) {
        setLoading(false);
        return;
      }

      supabase
        .from('students')
        .select('id,first_name,last_name,usn,status')
        .eq('user_id', userId)
        .order('first_name')
        .returns<StudentBrief[]>()
        .then(({ data: students }) => {
          if (!active) {
            return;
          }
          setStudents(students ?? []);
          setLoading(false);
        });
    });

    return () => {
      active = false;
    };
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) {
      return true;
    }
    const q = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      (s.usn ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className="group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground data-[state=open]:bg-white/[0.04] data-[state=open]:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-300 group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d1f]/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] animate-scale-in"
        >
          {/* Header */}
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary/60" />
              <span>
                Students
                {!loading && (
                  <span className="ml-1 text-primary/60">({students.length})</span>
                )}
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter students..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/40 transition-all duration-200 focus:border-primary/20 focus:bg-white/[0.05]"
              />
            </div>
          </div>

          {/* Student list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground/60">
                {search ? 'No students match your filter' : 'No students yet'}
              </div>
            ) : (
              filtered.map((student, index) => {
                const status = statusConfig[student.status];
                return (
                  <DropdownMenu.Item
                    key={student.id}
                    asChild
                    className="animate-stagger-fast outline-none"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-white/[0.04] hover:text-foreground data-[highlighted]:bg-white/[0.04] data-[highlighted]:text-foreground"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-semibold text-primary/80 transition-all duration-200 group-hover:bg-primary/15">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {student.first_name} {student.last_name}
                          </span>
                          {student.usn && (
                            <span className="shrink-0 text-[10px] text-muted-foreground/50">
                              {student.usn}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 border px-1.5 py-0 text-[9px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </Link>
                  </DropdownMenu.Item>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.06] p-1">
            <DropdownMenu.Item asChild>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/10"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Go to Dashboard
              </Link>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Arrow className="fill-[#0d0d1f]" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
