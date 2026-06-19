# Student-Database

## Setup

Create a `.env` file from `.env.example` and provide your Supabase project URL and anon key.

Supabase handles authentication for sign in and sign up. The `auth.users` table stores the login details, and the app scopes each student row to the signed-in Supabase user id stored in `user_id`.

Run the SQL in `supabase-schema.sql` before using the dashboard.