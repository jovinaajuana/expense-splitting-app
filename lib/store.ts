"use client"

import { createContext, useContext } from "react"
import type { Group, Member, Expense } from "./types"
import { generateId } from "./expense-logic"

export interface AppState {
  groups: Group[]
}

export type AppAction =
  | {
      type: "ADD_GROUP"
      payload: {
        name: string
        id?: string
        members?: Omit<Member, "id">[]
      }
    }
  | { type: "DELETE_GROUP"; payload: { groupId: string } }
  | {
      type: "ADD_MEMBER"
      payload: { groupId: string; member: Omit<Member, "id"> }
    }
  | {
      type: "REMOVE_MEMBER"
      payload: { groupId: string; memberId: string }
    }
  | {
      type: "ADD_EXPENSE"
      payload: {
        groupId: string
        expense: Omit<Expense, "id" | "createdAt">
      }
    }
  | {
      type: "DELETE_EXPENSE"
      payload: { groupId: string; expenseId: string }
    }
  | {
      type: "UPDATE_EXPENSE"
      payload: {
        groupId: string
        expenseId: string
        expense: Omit<Expense, "id" | "createdAt">
      }
    }
  | {
      type: "RECORD_PAYMENT"
      payload: {
        groupId: string
        payment: {
          fromMemberId: string
          toMemberId: string
          amount: number
        }
      }
    }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_GROUP": {
      const members = (action.payload.members ?? []).map((m) => ({
        ...m,
        id: generateId(),
      }))
      const newGroup: Group = {
        id: action.payload.id ?? generateId(),
        name: action.payload.name,
        members,
        expenses: [],
        payments: [],
        createdAt: Date.now(),
      }
      return { ...state, groups: [...state.groups, newGroup] }
    }
    case "DELETE_GROUP": {
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.payload.groupId),
      }
    }
    case "ADD_MEMBER": {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId
            ? {
                ...g,
                members: [
                  ...g.members,
                  { ...action.payload.member, id: generateId() },
                ],
              }
            : g
        ),
      }
    }
    case "REMOVE_MEMBER": {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId
            ? {
                ...g,
                members: g.members.filter(
                  (m) => m.id !== action.payload.memberId
                ),
              }
            : g
        ),
      }
    }
    case "ADD_EXPENSE": {
      const newExpense: Expense = {
        ...action.payload.expense,
        id: generateId(),
        createdAt: Date.now(),
      }
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId
            ? { ...g, expenses: [...g.expenses, newExpense] }
            : g
        ),
      }
    }
    case "DELETE_EXPENSE": {
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId
            ? {
                ...g,
                expenses: g.expenses.filter(
                  (e) => e.id !== action.payload.expenseId
                ),
              }
            : g
        ),
      }
    }
    case "UPDATE_EXPENSE": {
      const { groupId, expenseId, expense } = action.payload
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === groupId
            ? {
                ...g,
                expenses: g.expenses.map((e) =>
                  e.id === expenseId
                    ? {
                        ...e,
                        ...expense,
                        id: e.id,
                        createdAt: e.createdAt,
                      }
                    : e
                ),
              }
            : g
        ),
      }
    }
    case "RECORD_PAYMENT": {
      const payment = {
        ...action.payload.payment,
        id: generateId(),
        createdAt: Date.now(),
      }
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId
            ? { ...g, payments: [...g.payments, payment] }
            : g
        ),
      }
    }
    default:
      return state
  }
}

export const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppState must be used within AppProvider")
  }
  return context
}
