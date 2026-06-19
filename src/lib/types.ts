export type StudentStatus = 'active' | 'inactive' | 'graduated';

export type Student = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  grade_level: string | null;
  status: StudentStatus;
  enrollment_date: string;
  gpa: number | null;
  notes: string | null;
  usn: string | null;
  department: string | null;
  semester: number | null;
  attendance: number | null;
  marks: number | null;
  created_at: string;
  updated_at: string;
};

export type AuthFormMode = 'signin' | 'signup';
