import { useEffect, useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { CalendarDays, Edit, GraduationCap, Plus, Search, Trash2, UserMinus, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { StudentDialog } from '@/components/student-dialog';
import { AiSearch } from '@/components/ai-search';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import type { Student, StudentStatus } from '@/lib/types';
import { studentSchema, type StudentFormInput } from '@/lib/validation';
import { buildFilterQuery } from '@/lib/filter-builder';
import type { AiSearchFilters, AiSearchResult } from '@/lib/ai-search';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { CursorGlow } from '@/components/cursor-glow';

const statusStyles: Record<StudentStatus, 'default' | 'secondary' | 'success' | 'muted'> = {
  active: 'success',
  inactive: 'secondary',
  graduated: 'default',
};

export function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const [aiFilters, setAiFilters] = useState<AiSearchFilters | null>(null);
  const [aiResults, setAiResults] = useState<Student[] | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const studentsQuery = useQuery({
    queryKey: ['students', userId],
    queryFn: async () => {
      if (!userId) {
        return [] as Student[];
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as Student[];
    },
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`students-live-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await queryClient.invalidateQueries({ queryKey: ['students', userId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const handleAiSearch = useCallback(
    async (result: AiSearchResult) => {
      if (!userId) {
        return;
      }

      setAiFilters(result.filters);
      setAiSearching(true);

      try {
        const query = buildFilterQuery(userId, result.filters);
        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setAiResults((data ?? []) as Student[]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'AI search failed.');
        setAiResults([]);
      } finally {
        setAiSearching(false);
      }
    },
    [userId],
  );

  const handleAiClear = useCallback(() => {
    setAiFilters(null);
    setAiResults(null);
  }, []);

  const filteredStudents = useMemo(() => {
    if (aiResults !== null) {
      return aiResults;
    }

    const students = studentsQuery.data ?? [];
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesSearch =
        !query ||
        [student.first_name, student.last_name, student.email ?? '', student.grade_level ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, studentsQuery.data, aiResults]);

  const stats = useMemo(() => {
    const students = aiResults ?? studentsQuery.data ?? [];
    return {
      total: students.length,
      active: students.filter((student) => student.status === 'active').length,
      inactive: students.filter((student) => student.status === 'inactive').length,
      graduated: students.filter((student) => student.status === 'graduated').length,
    };
  }, [studentsQuery.data, aiResults]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: { values: StudentFormInput; id?: string }) => {
      if (!userId) {
        throw new Error('Not authenticated.');
      }

      const values = studentSchema.parse(payload.values);
      const normalized = {
        user_id: userId,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        grade_level: values.grade_level?.trim() || null,
        status: values.status,
        enrollment_date: values.enrollment_date,
        gpa: values.gpa ?? null,
        notes: values.notes?.trim() || null,
        usn: values.usn?.trim() || null,
        department: values.department?.trim() || null,
        semester: values.semester ?? null,
        attendance: values.attendance ?? null,
        marks: values.marks ?? null,
      };

      if (payload.id) {
        const { error } = await supabase.from('students').update(normalized).eq('id', payload.id).eq('user_id', userId);
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase.from('students').insert(normalized);
      if (error) {
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(variables.id ? 'Student updated.' : 'Student added.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to save student.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) {
        throw new Error('Not authenticated.');
      }

      const { error } = await supabase.from('students').delete().eq('id', id).eq('user_id', userId);
      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to delete student.');
    },
  });

  async function handleSubmit(values: StudentFormInput) {
    await upsertMutation.mutateAsync({ values, id: editingStudent?.id });
    setEditingStudent(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  }

  const isLoading = studentsQuery.isLoading || aiSearching;

  return (
    <div className="relative min-h-screen bg-background">
      <GeometricBackground />
      <CursorGlow />
      <div className="noise-overlay" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl animate-fade-down">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link to="/" className="block">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Scholar</p>
            <p className="text-sm text-muted-foreground">Student database dashboard</p>
          </Link>
          <Button variant="outline" onClick={() => setShowSignOutConfirm(true)}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-8">
        <section
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up"
          style={{ animationDelay: '0.05s' }}
        >
          <div>
            <p className="text-sm font-medium text-primary">Authenticated workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Manage students without losing the thread.</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Search across records, update status, and keep each student profile current from one secure dashboard.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add student
          </Button>
        </section>

        <section className="animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <AiSearch
            onSearch={handleAiSearch}
            onClear={handleAiClear}
            activeFilters={aiFilters}
            isSearching={aiSearching}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="animate-stagger" style={{ animationDelay: '0.1s' }}>
            <StatCard title="Total" value={stats.total} icon={CalendarDays} />
          </div>
          <div className="animate-stagger" style={{ animationDelay: '0.15s' }}>
            <StatCard title="Active" value={stats.active} icon={UserPlus} tone="success" />
          </div>
          <div className="animate-stagger" style={{ animationDelay: '0.2s' }}>
            <StatCard title="Inactive" value={stats.inactive} icon={UserMinus} tone="muted" />
          </div>
          <div className="animate-stagger" style={{ animationDelay: '0.25s' }}>
            <StatCard title="Graduated" value={stats.graduated} icon={GraduationCap} tone="primary" />
          </div>
        </section>

        <section
          className="glass-card rounded-[1.6rem] p-4 sm:p-6 animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by name, email, or grade..."
                className="pl-9"
              />
            </div>
            <Select
              className="w-full lg:w-52"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StudentStatus | 'all')}
              options={[
                { label: 'All statuses', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Graduated', value: 'graduated' },
              ]}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.06]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <span className="animate-fade-in">
                        {aiSearching ? 'AI is searching...' : 'Loading students...'}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <span className="animate-fade-in">
                        {aiFilters ? 'No students match your AI search.' : 'No students match your search.'}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow
                      key={student.id}
                      className="animate-stagger-fast"
                      style={{ animationDelay: `${0.3 + index * 0.03}s` }}
                    >
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </div>
                      </TableCell>
                      <TableCell>{student.email || '\u2014'}</TableCell>
                      <TableCell>{student.grade_level || '\u2014'}</TableCell>
                      <TableCell>
                        <Badge variant={statusStyles[student.status]}>{student.status}</Badge>
                      </TableCell>
                      <TableCell>{student.gpa ?? '\u2014'}</TableCell>
                      <TableCell>{format(new Date(student.enrollment_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingStudent(student);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(student)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingStudent(null);
          }
        }}
        initialStudent={editingStudent}
        onSubmit={handleSubmit}
        loading={upsertMutation.isPending}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete student"
        description={deleteTarget ? `Remove ${deleteTarget.first_name} ${deleteTarget.last_name} from the roster?` : undefined}
        onConfirm={() => {
          if (deleteTarget) {
            void deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
      />

      <AlertDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign out"
        description="Are you sure you want to sign out? Your data is saved and will be here when you return."
        onConfirm={() => void handleSignOut()}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'primary',
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'primary' | 'success' | 'muted';
}) {
  const toneClasses = {
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    muted: 'bg-white/6 text-muted-foreground',
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight transition-all duration-500 group-hover:scale-105">
            {value}
          </p>
        </div>
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-110 ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
