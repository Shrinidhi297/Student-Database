import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const studentSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required.'),
  last_name: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  grade_level: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'graduated']),
  enrollment_date: z.string().min(1, 'Enrollment date is required.'),
  gpa: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }

      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? parsed : null;
    })
    .refine((value) => value === null || (value >= 0 && value <= 4), 'GPA must be between 0 and 4.'),
  notes: z.string().trim().optional().or(z.literal('')),
});

export type AuthFormValues = z.infer<typeof authSchema>;
export type AuthFormInput = z.input<typeof authSchema>;
export type StudentFormInput = z.input<typeof studentSchema>;
export type StudentFormValues = z.infer<typeof studentSchema>;
