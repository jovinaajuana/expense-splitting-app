-- Allow authenticated users to check if an email is registered (for adding group members).
-- Uses SECURITY DEFINER so the function can read auth.users; callers only get a boolean.

create or replace function public.user_exists_by_email(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where email = lower(trim(check_email))
  );
$$;

comment on function public.user_exists_by_email(text) is
  'Returns true if a user with the given email exists in auth.users. Used when adding group members.';

grant execute on function public.user_exists_by_email(text) to authenticated;
grant execute on function public.user_exists_by_email(text) to service_role;
