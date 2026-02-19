"use client"

import { createClient } from "@/lib/supabase/client"
import type { Group } from "@/lib/types"

const TABLE_NAME = "user_groups"

export interface UserGroupsRow {
  user_id: string
  groups: Group[]
  updated_at: string
}

/**
 * Fetch persisted groups for the current user. Returns null if not logged in or no row.
 */
export async function fetchUserGroups(): Promise<Group[] | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return null

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("groups")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[persistence] fetchUserGroups error:", error)
    return null
  }
  if (!data?.groups) return []
  return data.groups as Group[]
}

/**
 * Save groups for the current user. No-op if not logged in.
 */
export async function saveUserGroups(groups: Group[]): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        user_id: user.id,
        groups,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    console.error("[persistence] saveUserGroups error:", error)
  }
}

/**
 * Check if an email is registered in the app (auth.users). Used when adding group members
 * so we only allow linking to existing accounts.
 */
export async function checkUserExistsByEmail(email: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("user_exists_by_email", {
    check_email: email.trim().toLowerCase(),
  })
  if (error) {
    console.error("[persistence] checkUserExistsByEmail error:", error)
    return false
  }
  return data === true
}

/**
 * Sync a group into another user's account (by email) so they see the group when added as a member.
 * Call this after adding a member so the other user gets the group in their list.
 */
export async function syncGroupToMember(memberEmail: string, group: Group): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("sync_group_to_member", {
    member_email: memberEmail.trim().toLowerCase(),
    group_data: group,
  })
  if (error) {
    console.error("[persistence] syncGroupToMember error:", error)
    return false
  }
  return data === true
}

/**
 * Push the full group (expenses, payments, members) to every member's user_groups
 * so balances and expenses stay in sync for all users in the group.
 * Call this whenever groups are saved so other members see the latest data.
 */
export async function syncGroupToAllMembers(group: Group): Promise<void> {
  if (group.members.length === 0) return
  const supabase = createClient()
  const { error } = await supabase.rpc("sync_group_to_all_members", {
    group_data: group,
  })
  if (error) {
    console.error("[persistence] syncGroupToAllMembers error:", error)
  }
}
