import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, write } from 'xlsx';
import { AiSearch } from '@/components/ai-search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import type { Student, StudentStatus } from '@/lib/types';
import { buildFilterQuery } from '@/lib/filter-builder';
import type { AiSearchFilters, AiSearchResult } from '@/lib/ai-search';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/interfaces-tooltip';
import { TextReveal } from '@/components/ui/cascade-text';
import { toast } from 'sonner';

const statusStyles: Record<StudentStatus, 'default' | 'secondary' | 'success' | 'muted'> = {
  active: 'success',
  inactive: 'secondary',
  graduated: 'default',
};

function exportToCSV(students: Student[]) {
  const headers = [
    'USN', 'First Name', 'Last Name', 'Email', 'Phone', 'Department',
    'Semester', 'Status', 'Year', 'Attendance', 'Marks', 'GPA',
    'Enrollment Date', 'Notes',
  ];

  const rows = students.map((s) => [
    s.usn ?? '', s.first_name, s.last_name, s.email ?? '', s.phone ?? '',
    s.department ?? '', s.semester ?? '', s.status, s.year ?? '',
    s.attendance ?? '', s.marks ?? '', s.gpa ?? '',
    format(new Date(s.enrollment_date), 'yyyy-MM-dd'), s.notes ?? '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON(students: Student[]) {
  const data = students.map(({ created_at, updated_at, user_id, ...rest }) => rest);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students_${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(students: Student[]) {
  const headers = [
    'USN', 'First Name', 'Last Name', 'Email', 'Phone', 'Department',
    'Semester', 'Status', 'Year', 'Attendance', 'Marks', 'GPA',
    'Enrollment Date', 'Notes',
  ];

  const rows = students.map((s) => [
    s.usn ?? '', s.first_name, s.last_name, s.email ?? '', s.phone ?? '',
    s.department ?? '', s.semester ?? '', s.status, s.year ?? '',
    s.attendance != null ? `${s.attendance}%` : '', s.marks ?? '', s.gpa ?? '',
    format(new Date(s.enrollment_date), 'yyyy-MM-dd'), s.notes ?? '',
  ]);

  const worksheet = utils.aoa_to_sheet([headers, ...rows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Students');
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToPDF(students: Student[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const title = `Student Records - ${format(new Date(), 'MMM d, yyyy')}`;
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.text(`Total: ${students.length} students`, 14, 22);

  const headers = [
    'USN', 'First Name', 'Last Name', 'Email', 'Phone', 'Department',
    'Sem', 'Status', 'Year', 'Attend.', 'Marks', 'GPA', 'Enrolled',
  ];

  const body = students.map((s) => [
    s.usn ?? '', s.first_name, s.last_name, s.email ?? '', s.phone ?? '',
    s.department ?? '', s.semester ?? '', s.status, s.year ?? '',
    s.attendance != null ? `${s.attendance}%` : '', s.marks ?? '', s.gpa ?? '',
    format(new Date(s.enrollment_date), 'MMM d, yyyy'),
  ]);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 28,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [80, 60, 160], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} | Generated by Scholar AI`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 8,
      );
    },
  });

  doc.save(`students_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';

type ExportFilters = {
  format: ExportFormat;
  dateFrom: string;
  dateTo: string;
  attendanceMin: string;
  attendanceMax: string;
  marksMin: string;
  marksMax: string;
  gpaMin: string;
  gpaMax: string;
  yearMin: string;
  yearMax: string;
};

const defaultExportFilters: ExportFilters = {
  format: 'csv',
  dateFrom: '',
  dateTo: '',
  attendanceMin: '',
  attendanceMax: '',
  marksMin: '',
  marksMax: '',
  gpaMin: '',
  gpaMax: '',
  yearMin: '',
  yearMax: '',
};

function parseGradeLevel(value: string | null) {
  if (!value) return null;
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function filterStudentsForExport(students: Student[], filters: ExportFilters) {
  return students.filter((student) => {
    const enrolled = new Date(student.enrollment_date);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (enrolled < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (enrolled > to) return false;
    }
    if (filters.attendanceMin && (student.attendance ?? 0) < Number(filters.attendanceMin)) return false;
    if (filters.attendanceMax && (student.attendance ?? 0) > Number(filters.attendanceMax)) return false;
    if (filters.marksMin && (student.marks ?? 0) < Number(filters.marksMin)) return false;
    if (filters.marksMax && (student.marks ?? 0) > Number(filters.marksMax)) return false;
    if (filters.gpaMin && (student.gpa ?? 0) < Number(filters.gpaMin)) return false;
    if (filters.gpaMax && (student.gpa ?? 0) > Number(filters.gpaMax)) return false;

      const gradeValue = parseGradeLevel(student.year);
      if (filters.yearMin && gradeValue != null && gradeValue < Number(filters.yearMin)) return false;
      if (filters.yearMax && gradeValue != null && gradeValue > Number(filters.yearMax)) return false;
      if ((filters.yearMin || filters.yearMax) && gradeValue == null) return false;

    return true;
  });
}

function ExportDialog({
  open,
  filters,
  onChange,
  onClose,
  onExport,
}: {
  open: boolean;
  filters: ExportFilters;
  onChange: (value: Partial<ExportFilters>) => void;
  onClose: () => void;
  onExport: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
        onClick={onClose}
      />
      <div className="glass-strong relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 p-6 shadow-[0_32px_80px_rgba(0,0,0,0.65)] animate-scale-in">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Export filtered student data</h2>
            <p className="text-sm text-slate-400">Pick the export format and optional ranges before downloading.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Export format</span>
            <select
              value={filters.format}
              onChange={(event) => onChange({ format: event.target.value as ExportFormat })}
              className="glass-input h-12 w-full appearance-none bg-slate-950/20 text-slate-100"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Enrollment date from</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => onChange({ dateFrom: event.target.value })}
              className="glass-input h-12 w-full text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Enrollment date to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => onChange({ dateTo: event.target.value })}
              className="glass-input h-12 w-full text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Attendance range</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Min"
                value={filters.attendanceMin}
                onChange={(event) => onChange({ attendanceMin: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Max"
                value={filters.attendanceMax}
                onChange={(event) => onChange({ attendanceMax: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Marks range</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.marksMin}
                onChange={(event) => onChange({ marksMin: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.marksMax}
                onChange={(event) => onChange({ marksMax: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">GPA range</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Min"
                value={filters.gpaMin}
                onChange={(event) => onChange({ gpaMin: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Max"
                value={filters.gpaMax}
                onChange={(event) => onChange({ gpaMax: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
            </div>
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Year range</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                placeholder="From"
                value={filters.yearMin}
                onChange={(event) => onChange({ yearMin: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
              <input
                type="number"
                min="0"
                placeholder="To"
                value={filters.yearMax}
                onChange={(event) => onChange({ yearMax: event.target.value })}
                className="glass-input h-12 w-full text-slate-100"
              />
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onExport}>Export now</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StudentsListPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState<ExportFilters>(defaultExportFilters);
  const [aiFilters, setAiFilters] = useState<AiSearchFilters | null>(null);
  const [aiResults, setAiResults] = useState<Student[] | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      const userId = data.session?.user.id;

      if (!userId) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .order('first_name')
        .then(({ data: students }) => {
          if (active) {
            setStudents(students ?? []);
            setLoading(false);
          }
        });
    });

    const channel = supabase
      .channel('students-list-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        supabase.auth.getSession().then(({ data }) => {
          const userId = data.session?.user.id;
          if (!userId) {
            return;
          }
          supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .order('first_name')
            .then(({ data: students }) => {
              if (active) {
                setStudents(students ?? []);
              }
            });
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  }

  const handleAiSearch = useCallback(
    async (result: AiSearchResult) => {
      const userId = session?.user.id;
      if (!userId) {
        return;
      }

      setAiFilters(result.filters);
      setAiExplanation(result.explanation ?? null);
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
    [session],
  );

  const handleAiClear = useCallback(() => {
    setAiFilters(null);
    setAiResults(null);
    setAiExplanation(null);
  }, []);

  const stats = useMemo(() => {
    const source = aiResults ?? students;
    return {
      total: source.length,
      active: source.filter((s) => s.status === 'active').length,
      departments: new Set(source.map((s) => s.department).filter(Boolean)).size,
    };
  }, [students, aiResults]);

  const displayStudents = aiResults ?? students;

  return (
    <div className="relative min-h-screen">
      <GeometricBackground />
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

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl animate-fade-down">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-purple-600/20 border border-white/15 backdrop-blur-xl sm:h-9 sm:w-9">
              <Users className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            </div>
            <div className="hidden sm:block">
              <TextReveal
                text="Scholar"
                as="span"
                fontSize="0.875rem"
                color="hsl(var(--primary))"
                hoverColor="#b2c73a"
                staggerDelay={20}
                duration={200}
                className="font-semibold tracking-[0.24em] p-0 leading-normal"
              />
              <p className="text-xs text-muted-foreground">Student records</p>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 sm:flex sm:px-2.5 sm:py-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium text-primary">
                {(session?.user.user_metadata?.first_name ?? session?.user.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                {[session?.user.user_metadata?.first_name, session?.user.user_metadata?.last_name].filter(Boolean).join(' ') || session?.user.email}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="sm" className="min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Go to dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowSignOutConfirm(true)} className="min-h-[36px] sm:min-h-0">
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sign out of your account</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div>
            <p className="text-sm font-medium text-primary">Student directory</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">List Of Students</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              View all student credentials and export records.
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={displayStudents.length === 0}
                  className="min-h-[40px] sm:min-h-0"
                >
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open export menu</TooltipContent>
            </Tooltip>
            <ExportDialog
              open={exportDialogOpen}
              filters={exportFilters}
              onClose={() => setExportDialogOpen(false)}
              onChange={(value) => setExportFilters((prev) => ({ ...prev, ...value }))}
              onExport={() => {
                const studentsToExport = filterStudentsForExport(displayStudents, exportFilters);
                if (exportFilters.format === 'csv') exportToCSV(studentsToExport);
                if (exportFilters.format === 'json') exportToJSON(studentsToExport);
                if (exportFilters.format === 'excel') exportToExcel(studentsToExport);
                if (exportFilters.format === 'pdf') exportToPDF(studentsToExport);
                setExportDialogOpen(false);
              }}
            />
          </div>
        </section>

        <section className="animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <AiSearch
            onSearch={handleAiSearch}
            onClear={handleAiClear}
            activeFilters={aiFilters}
            isSearching={aiSearching}
            explanation={aiExplanation}
          />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{loading || aiSearching ? '...' : stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{loading || aiSearching ? '...' : stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Departments</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{loading || aiSearching ? '...' : stats.departments}</p>
            </CardContent>
          </Card>
        </section>

        <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>{displayStudents.length} record{displayStudents.length !== 1 ? 's' : ''}{aiFilters ? ' (AI filtered)' : ''}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USN</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Sem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading || aiSearching ? (
                      <TableRow>
                        <TableCell colSpan={12} className="py-12 text-center text-muted-foreground">
                          <span className="animate-fade-in">
                            {aiSearching ? 'AI is searching...' : 'Loading students...'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : displayStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="py-12 text-center text-muted-foreground">
                          <span className="animate-fade-in">
                            {aiFilters ? 'No students match your AI search.' : 'No students found. Add some from the dashboard.'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayStudents.map((student, index) => (
                        <TableRow key={student.id} className="animate-stagger-fast" style={{ animationDelay: `${index * 0.02}s` }}>
                          <TableCell className="font-mono text-xs">{student.usn || '\u2014'}</TableCell>
                          <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                          <TableCell className="text-xs">{student.email || '\u2014'}</TableCell>
                          <TableCell className="text-xs">{student.phone || '\u2014'}</TableCell>
                          <TableCell>{student.department || '\u2014'}</TableCell>
                          <TableCell>{student.semester ?? '\u2014'}</TableCell>
                          <TableCell>
                            <Badge variant={statusStyles[student.status]}>{student.status}</Badge>
                          </TableCell>
                          <TableCell>{student.year || '\u2014'}</TableCell>
                          <TableCell>{student.attendance ?? '\u2014'}{student.attendance != null ? '%' : ''}</TableCell>
                          <TableCell>{student.marks ?? '\u2014'}</TableCell>
                          <TableCell>{student.gpa ?? '\u2014'}</TableCell>
                          <TableCell className="text-xs">{format(new Date(student.enrollment_date), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <AlertDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign out"
        description="Are you sure you want to sign out?"
        onConfirm={() => void handleSignOut()}
        confirmLabel="Sign out"
      />
    </div>
  );
}
