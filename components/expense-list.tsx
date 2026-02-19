"use client"

import { Trash2, Receipt, ArrowRightLeft, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Expense, Member, RecordedPayment } from "@/lib/types"
import { formatCurrency } from "@/lib/expense-logic"

type LogItem =
  | { type: "expense"; id: string; createdAt: number; expense: Expense }
  | { type: "payment"; id: string; createdAt: number; payment: RecordedPayment }

interface ExpenseListProps {
  expenses: Expense[]
  payments?: RecordedPayment[]
  members: Member[]
  onEditExpense?: (expense: Expense) => void
  onRemoveExpense: (id: string) => void
}

function getItemsByDate(expenses: Expense[], payments: RecordedPayment[]): [string, LogItem[]][] {
  const items: LogItem[] = [
    ...expenses.map((e) => ({ type: "expense" as const, id: e.id, createdAt: e.createdAt, expense: e })),
    ...(payments ?? []).map((p) => ({ type: "payment" as const, id: p.id, createdAt: p.createdAt, payment: p })),
  ]
  const sorted = items.sort((a, b) => b.createdAt - a.createdAt)
  const byDate = new Map<string, LogItem[]>()
  for (const item of sorted) {
    const key = new Date(item.createdAt).toDateString()
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(item)
  }
  return Array.from(byDate.entries())
}

export function ExpenseList({
  expenses,
  payments = [],
  members,
  onEditExpense,
  onRemoveExpense,
}: ExpenseListProps) {
  const getMemberName = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "Unknown"

  const hasAny = expenses.length > 0 || payments.length > 0

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center rounded border border-border bg-card">
        <Receipt className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No expenses recorded yet
        </p>
      </div>
    )
  }

  const grouped = getItemsByDate(expenses, payments)

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden">
      {grouped.map(([dateKey, dateItems]) => (
        <div key={dateKey} className="flex flex-col">
          <p className="text-xs text-muted-foreground px-4 pt-3 pb-1.5 font-medium">
            {new Date(dateKey).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {dateItems.map((item) =>
            item.type === "expense" ? (
              <div
                key={item.id}
                className="group flex items-center gap-3 px-4 py-3 border-t border-border hover:bg-muted/60 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-muted text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {item.expense.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getMemberName(item.expense.paidById)} paid
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                  {formatCurrency(item.expense.amount)}
                </span>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditExpense && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditExpense(item.expense)}
                      aria-label={`Edit ${item.expense.description}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRemoveExpense(item.id)}
                    aria-label={`Remove ${item.expense.description}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 border-t border-border hover:bg-muted/60 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {getMemberName(item.payment.fromMemberId)} paid{" "}
                    {getMemberName(item.payment.toMemberId)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Settlement
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                  {formatCurrency(item.payment.amount)}
                </span>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  )
}
