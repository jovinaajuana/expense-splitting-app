-- When any user updates a group (expenses, payments, members), push that group
-- into every member's user_groups so balances and expenses stay in sync for everyone.

create or replace function public.sync_group_to_all_members(group_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_elem jsonb;
  member_email text;
  target_user_id uuid;
  current_groups jsonb;
  new_groups jsonb;
  group_id text;
begin
  group_id := group_data->>'id';
  if group_id is null or group_id = '' then
    return;
  end if;

  for member_elem in select * from jsonb_array_elements(group_data->'members')
  loop
    member_email := lower(trim(member_elem->>'email'));
    if member_email is null or member_email = '' then
      continue;
    end if;

    select id into target_user_id
    from auth.users
    where email = member_email
    limit 1;

    if target_user_id is null then
      continue;
    end if;

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
      where (elem->>'id') is distinct from group_id
    ) || jsonb_build_array(group_data);

    insert into public.user_groups (user_id, groups, updated_at)
    values (target_user_id, new_groups, now())
    on conflict (user_id) do update
    set groups = new_groups, updated_at = now();
  end loop;
end;
$$;

comment on function public.sync_group_to_all_members(jsonb) is
  'Writes the given group (expenses, payments, members) into every member''s user_groups so all members see the same balances and expenses.';

grant execute on function public.sync_group_to_all_members(jsonb) to authenticated;
grant execute on function public.sync_group_to_all_members(jsonb) to service_role;
