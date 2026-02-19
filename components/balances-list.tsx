"use client"

import { Plus } from "lucide-react"
import type { Group } from "@/lib/types"
import {
  calculateNetBalances,
  formatCurrency,
} from "@/lib/expense-logic"
import { cn } from "@/lib/utils"

interface BalancesListProps {
  group: Group
  onAddMember?: () => void
}

export function BalancesList({ group, onAddMember }: BalancesListProps) {
  const netBalances = calculateNetBalances(group)

  if (group.members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 py-12">
        <p className="text-sm text-muted-foreground mb-4">
          Add members to see balance
        </p>
        {onAddMember && (
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add member
          </button>
        )}
      </div>
    )
  }

  if (group.expenses.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Add expenses to see balances
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {group.members.map((member) => {
        const balance =
          Math.round((netBalances.get(member.id) ?? 0) * 100) / 100
        const owes = balance < -0.01
        const getsBack = balance > 0.01
        return (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
              {member.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {owes ? "owes" : getsBack ? "gets back" : "settled"}
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums shrink-0",
                owes ? "text-destructive" : getsBack ? "text-[var(--success)]" : "text-muted-foreground"
              )}
            >
              {owes ? "" : getsBack ? "+" : ""}
              {formatCurrency(balance)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
