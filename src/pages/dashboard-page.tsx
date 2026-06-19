import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { format } from 'date-fns';
import { CalendarDays, Edit, GraduationCap, Plus, Search, Trash2, UserMinus, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { StudentDialog } from '@/components/student-dialog';
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

const statusStyles: Record<StudentStatus, 'default' | 'secondary' | 'success' | 'muted'> = {
  active: 'success',
  inactive: 'secondary',
  graduated: 'default',
};

export function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const studentsQuery = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [] as Student[];
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as Student[];
    },
    enabled: Boolean(isLoaded && isSignedIn && user?.id),
  });

  const filteredStudents = useMemo(() => {
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
  }, [search, statusFilter, studentsQuery.data]);

  const stats = useMemo(() => {
    const students = studentsQuery.data ?? [];
    return {
      total: students.length,
      active: students.filter((student) => student.status === 'active').length,
      inactive: students.filter((student) => student.status === 'inactive').length,
      graduated: students.filter((student) => student.status === 'graduated').length,
    };
  }, [studentsQuery.data]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: { values: StudentFormInput; id?: string }) => {
      if (!user?.id) {
        throw new Error('Not authenticated.');
      }

      const values = studentSchema.parse(payload.values);
      const normalized = {
        user_id: user.id,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        grade_level: values.grade_level?.trim() || null,
        status: values.status,
        enrollment_date: values.enrollment_date,
        gpa: values.gpa ?? null,
        notes: values.notes?.trim() || null,
      };

      if (payload.id) {
        const { error } = await supabase.from('students').update(normalized).eq('id', payload.id).eq('user_id', user.id);
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
      if (!user?.id) {
        throw new Error('Not authenticated.');
      }

      const { error } = await supabase.from('students').delete().eq('id', id).eq('user_id', user.id);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Scholar</p>
            <p className="text-sm text-muted-foreground">Student database dashboard</p>
          </div>
          <Button variant="outline" onClick={() => void signOut({ redirectUrl: '/' })}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total" value={stats.total} icon={CalendarDays} />
          <StatCard title="Active" value={stats.active} icon={UserPlus} tone="success" />
          <StatCard title="Inactive" value={stats.inactive} icon={UserMinus} tone="muted" />
          <StatCard title="Graduated" value={stats.graduated} icon={GraduationCap} tone="primary" />
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, or grade"
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

          <div className="mt-6 overflow-hidden rounded-xl border border-border">
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
                {studentsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No students match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </div>
                      </TableCell>
                      <TableCell>{student.email || '—'}</TableCell>
                      <TableCell>{student.grade_level || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusStyles[student.status]}>{student.status}</Badge>
                      </TableCell>
                      <TableCell>{student.gpa ?? '—'}</TableCell>
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
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
