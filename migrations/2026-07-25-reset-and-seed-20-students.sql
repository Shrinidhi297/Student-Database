-- Reset students table and seed 20 students
-- WARNING: This will permanently remove all rows in public.students.
-- Run as an admin (Supabase SQL editor or psql) to bypass RLS and FK issues.

BEGIN;

TRUNCATE TABLE public.students RESTART IDENTITY CASCADE;

-- Insert 20 students (user_id matches existing seed user from seed-data.sql)
INSERT INTO public.students (user_id, first_name, last_name, usn, department, semester, attendance, marks, email, phone, year, status, enrollment_date, gpa, notes) VALUES
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Aarav', 'Sharma', '2JH25CS001', 'CSE', 5, 92.5, 88, 'aarav.sharma@college.edu', '9876543201', 'Year 10', 'active', '2024-08-15', 9.50, 'Top performer in algorithms'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Priya', 'Patel', '2JH25CS002', 'CSE', 5, 88.0, 91, 'priya.patel@college.edu', '9876543202', 'Year 10', 'active', '2024-08-15', 9.75, 'Strong in data structures'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Rahul', 'Verma', '2JH25CS003', 'CSE', 4, 72.3, 76, 'rahul.verma@college.edu', '9876543203', 'Year 9', 'active', '2024-08-15', 8.00, NULL),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Sneha', 'Reddy', '2JH25CS004', 'CSE', 6, 95.1, 94, 'sneha.reddy@college.edu', '9876543204', 'Year 11', 'active', '2023-08-15', 9.90, 'Class topper'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Aditya', 'Nair', '2JH25CS005', 'CSE', 3, 65.0, 58, 'aditya.nair@college.edu', '9876543205', 'Year 8', 'inactive', '2024-08-15', 6.25, 'Low attendance - needs follow-up'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Diya', 'Iyer', '2JH25CS006', 'AIML', 5, 89.7, 85, 'diya.iyer@college.edu', '9876543206', 'Year 10', 'active', '2024-08-15', 9.25, 'Interested in machine learning'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Karthik', 'Menon', '2JH25CS007', 'AIML', 4, 78.2, 72, 'karthik.menon@college.edu', '9876543207', 'Year 9', 'active', '2024-08-15', 7.75, NULL),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Ananya', 'Gupta', '2JH25CS008', 'AIML', 6, 91.4, 89, 'ananya.gupta@college.edu', '9876543208', 'Year 11', 'active', '2023-08-15', 9.60, 'Published research paper on NLP'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Vikram', 'Singh', '2JH25CS009', 'AIML', 3, 55.0, 48, 'vikram.singh@college.edu', '9876543209', 'Year 8', 'inactive', '2024-08-15', 5.25, 'On academic probation'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Meera', 'Joshi', '2JH25CS010', 'AIML', 5, 82.6, 80, 'meera.joshi@college.edu', '9876543210', 'Year 10', 'active', '2024-08-15', 8.75, NULL),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Arjun', 'Das', '2JH25CS011', 'ECE', 5, 87.3, 83, 'arjun.das@college.edu', '9876543211', 'Year 10', 'active', '2024-08-15', 9.00, 'Good at embedded systems'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Nisha', 'Kumar', '2JH25CS012', 'ECE', 4, 90.1, 87, 'nisha.kumar@college.edu', '9876543212', 'Year 9', 'active', '2024-08-15', 9.35, NULL),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Rohan', 'Mishra', '2JH25CS013', 'ECE', 6, 68.9, 62, 'rohan.mishra@college.edu', '9876543213', 'Year 11', 'active', '2023-08-15', 7.00, 'Needs improvement in circuits'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Pooja', 'Rao', '2JH25CS014', 'ECE', 3, 94.5, 92, 'pooja.rao@college.edu', '9876543214', 'Year 8', 'active', '2024-08-15', 9.75, 'Electronics lab star'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Siddharth', 'Chatterjee', '2JH25CS015', 'ECE', 5, 76.0, 71, 'siddharth.ch@college.edu', '9876543215', 'Year 10', 'graduated', '2022-08-15', 7.75, 'Graduated - placed at TCS'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Tanvi', 'Bose', '2JH25CS016', 'ME', 4, 83.2, 79, 'tanvi.bose@college.edu', '9876543216', 'Year 9', 'active', '2024-08-15', 8.50, NULL),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Kiran', 'Pillai', '2JH25CS017', 'ME', 5, 70.5, 65, 'kiran.pillai@college.edu', '9876543217', 'Year 10', 'active', '2024-08-15', 7.25, 'Weak in thermodynamics'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Shruti', 'Agarwal', '2JH25CS018', 'ME', 6, 88.8, 86, 'shruti.agarwal@college.edu', '9876543218', 'Year 11', 'active', '2023-08-15', 9.25, 'Mechanical design specialist'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Varun', 'Tiwari', '2JH25CS019', 'ME', 2, 60.0, 52, 'varun.tiwari@college.edu', '9876543219', 'Year 7', 'active', '2025-01-15', 5.75, 'First semester - adjusting'),
('293a2034-7cfe-437e-9da5-0a2cd92c55bf', 'Ishita', 'Banerjee', '2JH25CS020', 'ME', 5, 96.2, 95, 'ishita.banerjee@college.edu', '9876543220', 'Year 10', 'active', '2024-08-15', 9.95, 'University rank holder');

COMMIT;
