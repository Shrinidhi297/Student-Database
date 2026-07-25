import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  first_name: z.string().trim().min(1, 'First name is required.').optional().or(z.literal('')),
  last_name: z.string().trim().min(1, 'Last name is required.').optional().or(z.literal('')),
});

export const studentSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required.'),
  last_name: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  year: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === '' || value === undefined || value === null) return '';
      const parsed = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : Number(value);
      if (!Number.isFinite(parsed) || isNaN(parsed)) return '';
      const capped = Math.min(Math.max(Math.floor(parsed), 1), 4);
      return `Year ${capped}`;
    }),
  status: z.enum(['active', 'inactive', 'graduated']),
  enrollment_date: z.string().min(1, 'Enrollment date is required.'),
  gpa: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine((value) => value === null || (value >= 0 && value <= 10), 'CGPA must be between 0 and 10.'),
  notes: z.string().trim().optional().or(z.literal('')),
  usn: z.string().trim().optional().or(z.literal('')),
  department: z.string().trim().optional().or(z.literal('')),
  semester: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine((value) => value === null || (value >= 1 && value <= 8), 'Semester must be between 1 and 8.'),
  attendance: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine((value) => value === null || (value >= 0 && value <= 100), 'Attendance must be between 0 and 100.'),
  marks: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine((value) => value === null || (value >= 0 && value <= 100), 'Marks must be between 0 and 100.'),
});

export type AuthFormValues = z.infer<typeof authSchema>;
export type AuthFormInput = z.input<typeof authSchema>;
export type StudentFormInput = z.input<typeof studentSchema>;
export type StudentFormValues = z.infer<typeof studentSchema>;
