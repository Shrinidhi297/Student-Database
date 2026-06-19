# Student-Database

## Setup

Create a `.env` file from `.env.example` and provide your Clerk publishable key plus your Supabase project URL and anon key.

Clerk handles authentication for sign in and sign up. Supabase is used for the student database, and each row is scoped by the signed-in Clerk user id stored in `user_id`.

Run the SQL in `supabase-schema.sql` before using the dashboard.