  "use client"

import { useReducer, useState, useCallback, useEffect, useRef } from "react"
import { MacWindow } from "@/components/mac-window"
import { GroupSidebar } from "@/components/group-sidebar"
import { GroupDetail } from "@/components/group-detail"
import { AddGroupModal } from "@/components/add-group-modal"
import { appReducer, type AppState } from "@/lib/store"
import type { Expense, Group } from "@/lib/types"
import { generateId } from "@/lib/expense-logic"
import { createClient } from "@/lib/supabase/client"
import { fetchUserGroups, saveUserGroups, checkUserExistsByEmail, syncGroupToMember, syncGroupToAllMembers } from "@/lib/persistence"
import { Layers } from "lucide-react"

const initialState: AppState = {
  groups: [],
}

const SAVE_DEBOUNCE_MS = 1500

export default function Home() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [hydrationDone, setHydrationDone] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedGroup = state.groups.find((g) => g.id === selectedGroupId)

  // Load persisted groups when user is logged in
  useEffect(() => {
    let cancelled = false
    async function load() {
      const groups = await fetchUserGroups()
      if (!cancelled && groups !== null) {
        dispatch({ type: "HYDRATE", payload: { groups } })
      }
      if (!cancelled) setHydrationDone(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Persist groups when state changes (debounced), only after initial hydration.
  // Also push each group to all members so expenses and balances stay in sync.
  useEffect(() => {
    if (!hydrationDone) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      saveTimeoutRef.current = null
      await saveUserGroups(state.groups)
      for (const group of state.groups) {
        if (group.members.length > 0) {
          await syncGroupToAllMembers(group)
        }
      }
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [hydrationDone, state.groups])

  const handleAddGroupWithMembers = useCallback(
    async (name: string, members: { name: string; email: string }[]) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const creatorMember = user
        ? {
            name:
              (user.user_metadata?.full_name as string) ??
              user.email?.split("@")[0] ??
              "Me",
            email: user.email ?? "",
          }
        : null
      const allMembers = creatorMember
        ? [
            creatorMember,
            ...members.filter(
              (m) => m.email.toLowerCase() !== creatorMember.email.toLowerCase()
            ),
          ]
        : members
      const id = generateId()
      dispatch({
        type: "ADD_GROUP",
        payload: { name, id, members: allMembers },
      })
      setSelectedGroupId(id)
      setShowAddGroupModal(false)
    },
    [dispatch]
  )

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      dispatch({ type: "DELETE_GROUP", payload: { groupId } })
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null)
      }
    },
    [dispatch, selectedGroupId]
  )

  const handleSelectGroup = useCallback((id: string) => {
    setSelectedGroupId(id)
  }, [])

  // Auto-select the newest group if we don't have one selected
  const effectiveSelectedId =
    selectedGroupId && state.groups.some((g) => g.id === selectedGroupId)
      ? selectedGroupId
      : null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - receipt slip stack */}
        <aside className="w-64 shrink-0 border-r-2 border-border bg-card hidden md:block receipt-slip">
          <GroupSidebar
            groups={state.groups}
            selectedGroupId={effectiveSelectedId}
            onSelectGroup={handleSelectGroup}
            onOpenAddGroupModal={() => setShowAddGroupModal(true)}
            onDeleteGroup={handleDeleteGroup}
          />
        </aside>

        {/* Mobile sidebar */}
        <div className="md:hidden">
          {!effectiveSelectedId && (
            <div className="h-full">
              <GroupSidebar
                groups={state.groups}
                selectedGroupId={effectiveSelectedId}
                onSelectGroup={handleSelectGroup}
                onOpenAddGroupModal={() => setShowAddGroupModal(true)}
                onDeleteGroup={handleDeleteGroup}
              />
            </div>
          )}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {effectiveSelectedId && selectedGroup ? (
            <div className="p-4 lg:p-6">
              <GroupDetail
                group={selectedGroup}
                onBack={() => setSelectedGroupId(null)}
                onAddMember={async (name, email) => {
                  const exists = await checkUserExistsByEmail(email)
                  if (!exists) {
                    return { ok: false as const, message: "No account found with this email. They need to sign up first." }
                  }
                  const memberId = generateId()
                  const newMember = { id: memberId, name, email }
                  const groupWithNewMember: Group = {
                    ...selectedGroup,
                    members: [...selectedGroup.members, newMember],
                  }
                  await syncGroupToMember(email, groupWithNewMember)
                  dispatch({
                    type: "ADD_MEMBER",
                    payload: {
                      groupId: selectedGroup.id,
                      member: newMember,
                    },
                  })
                  return { ok: true as const }
                }}
                onRemoveMember={(memberId) =>
                  dispatch({
                    type: "REMOVE_MEMBER",
                    payload: {
                      groupId: selectedGroup.id,
                      memberId,
                    },
                  })
                }
                onAddExpense={(expense: Omit<Expense, "id" | "createdAt">) =>
                  dispatch({
                    type: "ADD_EXPENSE",
                    payload: {
                      groupId: selectedGroup.id,
                      expense,
                    },
                  })
                }
                onUpdateExpense={(expenseId, expense) =>
                  dispatch({
                    type: "UPDATE_EXPENSE",
                    payload: {
                      groupId: selectedGroup.id,
                      expenseId,
                      expense,
                    },
                  })
                }
                onRemoveExpense={(expenseId) =>
                  dispatch({
                    type: "DELETE_EXPENSE",
                    payload: {
                      groupId: selectedGroup.id,
                      expenseId,
                    },
                  })
                }
                onRecordPayment={(fromMemberId, toMemberId, amount) =>
                  dispatch({
                    type: "RECORD_PAYMENT",
                    payload: {
                      groupId: selectedGroup.id,
                      payment: { fromMemberId, toMemberId, amount },
                    },
                  })
                }
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <MacWindow title="Welcome!" className="max-w-md mx-4 min-w-[250px] min-h-[250px] receipt-slip">
                <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm border-2 border-border bg-muted/50">
                    <Layers className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-widest uppercase">
                      Settle Up
                    </h2>
                  </div>
                </div>
              </MacWindow>
            </div>
          )}
        </main>
      </div>

      <AddGroupModal
        open={showAddGroupModal}
        onOpenChange={setShowAddGroupModal}
        onSubmit={handleAddGroupWithMembers}
      />
    </div>
  )
}
