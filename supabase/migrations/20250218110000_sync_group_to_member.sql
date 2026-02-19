-- When a user adds someone to a group, sync that group into the new member's account
-- so they see it in their list. Uses SECURITY DEFINER to write to the target user's row.

create or replace function public.sync_group_to_member(member_email text, group_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
  current_groups jsonb;
  new_groups jsonb;
begin
  -- Resolve member email to user id
  select id into target_user_id
  from auth.users
  where email = lower(trim(member_email))
  limit 1;

  if target_user_id is null then
    return false;
  end if;

  -- Get target user's current groups (or empty array)
  select coalesce(groups, '[]'::jsonb) into current_groups
  from public.user_groups
  where user_id = target_user_id;

  if current_groups is null then
    current_groups := '[]'::jsonb;
  end if;

  -- Replace existing group with same id, or append
  new_groups := (
    select coalesce(jsonb_agg(elem), '[]'::jsonb)
    from jsonb_array_elements(current_groups) as elem
    where (elem->>'id') is distinct from (group_data->>'id')
  ) || jsonb_build_array(group_data);

  -- Upsert target user's groups
  insert into public.user_groups (user_id, groups, updated_at)
  values (target_user_id, new_groups, now())
  on conflict (user_id) do update
  set groups = new_groups, updated_at = now();

  return true;
end;
$$;

comment on function public.sync_group_to_member(text, jsonb) is
  'Adds or updates a group in the given member''s user_groups so they see the group when added.';

grant execute on function public.sync_group_to_member(text, jsonb) to authenticated;
grant execute on function public.sync_group_to_member(text, jsonb) to service_role;
