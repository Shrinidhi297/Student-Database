import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import type { Student } from '@/lib/types';
import { studentSchema, type StudentFormInput } from '@/lib/validation';

const today = new Date().toISOString().slice(0, 10);

const emptyValues: StudentFormInput = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  grade_level: '',
  status: 'active',
  enrollment_date: today,
  gpa: '',
  notes: '',
  usn: '',
  department: '',
  semester: '',
  attendance: '',
  marks: '',
};

export function StudentDialog({
  open,
  onOpenChange,
  initialStudent,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStudent: Student | null;
  onSubmit: (values: StudentFormInput) => Promise<void>;
  loading?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      initialStudent
        ? {
            first_name: initialStudent.first_name,
            last_name: initialStudent.last_name,
            email: initialStudent.email ?? '',
            phone: initialStudent.phone ?? '',
            grade_level: initialStudent.grade_level ?? '',
            status: initialStudent.status,
            enrollment_date: initialStudent.enrollment_date,
            gpa: initialStudent.gpa ?? '',
            notes: initialStudent.notes ?? '',
            usn: initialStudent.usn ?? '',
            department: initialStudent.department ?? '',
            semester: initialStudent.semester ?? '',
            attendance: initialStudent.attendance ?? '',
            marks: initialStudent.marks ?? '',
          }
        : emptyValues,
    );
  }, [form, initialStudent, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={initialStudent ? 'Edit student' : 'Add student'}
        description="Enrollment details, status, and academic progress."
        onClose={() => onOpenChange(false)}
      >
        <form
          ref={formRef}
          className="grid gap-3 overflow-y-auto p-4 pb-4 sm:gap-4 sm:p-5 sm:pb-4 max-h-[80dvh]"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          })}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            <Field label="First name *" error={form.formState.errors.first_name?.message}>
              <Input placeholder="Ava" {...form.register('first_name')} />
            </Field>
            <Field label="Last name *" error={form.formState.errors.last_name?.message}>
              <Input placeholder="Patel" {...form.register('last_name')} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" placeholder="ava@school.edu" {...form.register('email')} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input type="tel" placeholder="(555) 555-0199" {...form.register('phone')} />
            </Field>
            <Field label="USN" error={form.formState.errors.usn?.message}>
              <Input placeholder="1KS20CS001" {...form.register('usn')} />
            </Field>
            <Field label="Department" error={form.formState.errors.department?.message}>
              <Input placeholder="CSE, AIML, ECE..." {...form.register('department')} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            <Field label="Grade level" error={form.formState.errors.grade_level?.message}>
              <Input placeholder="Grade 11" {...form.register('grade_level')} />
            </Field>
            <Field label="Semester" error={form.formState.errors.semester?.message as string | undefined}>
              <Input type="number" min="1" max="8" placeholder="3" {...form.register('semester')} />
            </Field>
            <Field label="Status *" error={form.formState.errors.status?.message}>
              <Select
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Graduated', value: 'graduated' },
                ]}
                {...form.register('status')}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <Field label="Enrollment date *" error={form.formState.errors.enrollment_date?.message}>
              <Input type="date" {...form.register('enrollment_date')} />
            </Field>
            <Field label="Attendance %" error={form.formState.errors.attendance?.message as string | undefined}>
              <Input type="number" min="0" max="100" placeholder="85" {...form.register('attendance')} />
            </Field>
            <Field label="Marks" error={form.formState.errors.marks?.message as string | undefined}>
              <Input type="number" min="0" max="100" placeholder="92" {...form.register('marks')} />
            </Field>
            <Field label="GPA" error={form.formState.errors.gpa?.message as string | undefined}>
              <Input type="number" step="0.01" min="0" max="10" placeholder="8.50" {...form.register('gpa')} />
            </Field>
          </div>

          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <textarea
              className="glass-input flex min-h-[60px] w-full rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
              placeholder="Academic interests, interventions, advisories..."
              rows={2}
              {...form.register('notes')}
            />
          </Field>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px] sm:min-h-0">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-h-[44px] sm:min-h-0">
              {loading ? 'Saving...' : initialStudent ? 'Update student' : 'Add student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
    <div className="grid gap-1.5">
      <Label className="text-xs sm:text-sm leading-tight">{label}</Label>
      {children}
      {error ? <p className="text-[11px] text-destructive leading-tight">{error}</p> : null}
    </div>
  );
}
