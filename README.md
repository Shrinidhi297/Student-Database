# Student-Database

A polished student record manager built with Supabase, React, and modern glassmorphism UI.

## Highlights

- **Export data with filters:** One-click export opens a modal to select format, enrollment date range, attendance range, marks range, GPA range, and grade range.
- **CSV / JSON / Excel / PDF export:** Download current student records in the format you need.
- **AI-powered student search:** Natural language search finds students by status, department, performance, and more.
- **Live updates:** Student list refreshes automatically when new records are added or updated.
- **Secure per-user data:** Each user only sees their own student records through Supabase row-level scoping.
- **Modern dashboard UI:** Dark glass styling, responsive tables, and refined controls for a premium experience.

## Setup

1. Create a `.env` file from `.env.example`.
2. Add your Supabase project URL and anon key.
3. Run the SQL in `supabase-schema.sql` to initialize the database schema.

Supabase handles authentication for sign in and sign up. The `auth.users` table stores login details, and student rows are scoped to the signed-in user by `user_id`.