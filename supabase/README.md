# Supabase setup

## Persisting groups and balances

To persist groups and balance details across logout/login, run the migration once:

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**.
2. Paste and run the contents of `migrations/20250218000000_create_user_groups.sql`.

This creates the `user_groups` table and RLS policies so each user only sees their own data.
