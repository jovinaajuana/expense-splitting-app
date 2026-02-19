import useSWR from "swr"
import type { Group, Member, Expense } from "@/lib/types"
import { generateId } from "@/lib/expense-logic"

const STORE_KEY = "splitledger-data"

function getStoredGroups(): Group[] {
  if (typeof window === "undefined") return []
  try {
    const data = window.localStorage.getItem(STORE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveGroups(groups: Group[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORE_KEY, JSON.stringify(groups))
}

export function useStore() {
  const { data: groups = [], mutate } = useSWR<Group[]>(
    STORE_KEY,
    () => getStoredGroups(),
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  )

  const addGroup = async (name: string) => {
    const newGroup: Group = {
      id: generateId(),
      name,
      members: [],
      expenses: [],
      payments: [],
      createdAt: Date.now(),
    }
    const updated = [...groups, newGroup]
    saveGroups(updated)
    await mutate(updated, false)
    return newGroup
  }

  const deleteGroup = async (groupId: string) => {
    const updated = groups.filter((g) => g.id !== groupId)
    saveGroups(updated)
    await mutate(updated, false)
  }

  const addMember = async (groupId: string, name: string, email: string) => {
    const member: Member = { id: generateId(), name, email }
    const updated = groups.map((g) =>
      g.id === groupId ? { ...g, members: [...g.members, member] } : g
    )
    saveGroups(updated)
    await mutate(updated, false)
    return member
  }

  const removeMember = async (groupId: string, memberId: string) => {
    const updated = groups.map((g) =>
      g.id === groupId
        ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
        : g
    )
    saveGroups(updated)
    await mutate(updated, false)
  }

  const addExpense = async (groupId: string, expense: Omit<Expense, "id" | "createdAt">) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: Date.now(),
    }
    const updated = groups.map((g) =>
      g.id === groupId ? { ...g, expenses: [...g.expenses, newExpense] } : g
    )
    saveGroups(updated)
    await mutate(updated, false)
    return newExpense
  }

  const removeExpense = async (groupId: string, expenseId: string) => {
    const updated = groups.map((g) =>
      g.id === groupId
        ? { ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }
        : g
    )
    saveGroups(updated)
    await mutate(updated, false)
  }

  return {
    groups,
    addGroup,
    deleteGroup,
    addMember,
    removeMember,
    addExpense,
    removeExpense,
  }
}
