"use client"

import { useState } from "react"
import { Plus, ArrowLeft, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { BalancesList } from "@/components/balances-list"
import { SettlementPanel } from "@/components/settlement-panel"
import { MemberPanel } from "@/components/member-panel"
import type { Group, Expense } from "@/lib/types"
import { formatCurrency, simplifyDebts } from "@/lib/expense-logic"

interface GroupDetailProps {
  group: Group
  onBack?: () => void
  onAddMember: (name: string, email: string) => void
  onRemoveMember: (id: string) => void
  onAddExpense: (expense: Omit<Expense, "id" | "createdAt">) => void
  onUpdateExpense?: (expenseId: string, expense: Omit<Expense, "id" | "createdAt">) => void
  onRemoveExpense: (id: string) => void
  onRecordPayment?: (fromMemberId: string, toMemberId: string, amount: number) => void
}

export function GroupDetail({
  group,
  onBack,
  onAddMember,
  onRemoveMember,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
  onRecordPayment,
}: GroupDetailProps) {
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showSettleUp, setShowSettleUp] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const totalExpenses = group.expenses.reduce((sum, e) => sum + e.amount, 0)
  const settlements = simplifyDebts(group)
  const hasBalancesToSettle = settlements.length > 0

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Top section: back, group name + total, Settle up */}
      <header className="flex flex-wrap items-start gap-5 border-b border-border pb-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
            aria-label="Back to all groups"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.25rem] font-normal text-foreground truncate leading-tight">
            {group.name}
          </h1>
          <p className="text-[48px] font-normal tabular-nums text-foreground mt-4 leading-tight">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettleUp(true)}
            disabled={!hasBalancesToSettle}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
          >
            <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Settle up
          </button>
        </div>
      </header>

      {/* No members: empty state with add member CTA */}
      {group.members.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Add members to this group to start tracking expenses and balances.
          </p>
          <button
            type="button"
            onClick={() => setShowMembers(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Add member
          </button>
        </div>
      ) : (
        /* Two columns: Expenses Log (left) | Balances (right) */
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left: Expenses Log */}
          <section className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Expenses Log
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null)
                  setShowExpenseForm(true)
                }}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors shrink-0"
                disabled={group.members.length < 2}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                Add expense
              </button>
            </div>
            {group.members.length < 2 ? (
              <div className="rounded border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Add at least 2 members to record expenses
                </p>
              </div>
            ) : (
              <ExpenseList
                expenses={group.expenses}
                payments={group.payments ?? []}
                members={group.members}
                onEditExpense={(expense) => {
                  setEditingExpense(expense)
                  setShowExpenseForm(true)
                }}
                onRemoveExpense={onRemoveExpense}
              />
            )}
          </section>

          {/* Right: Balances */}
          <section className="lg:w-72 xl:w-80 shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Balances
              </h2>
              <button
                type="button"
                onClick={() => setShowMembers(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Manage members
              </button>
            </div>
            <div className="rounded border border-border bg-card flex flex-col min-h-0">
              <BalancesList
                group={group}
                onAddMember={() => setShowMembers(true)}
              />
            </div>
          </section>
        </div>
      )}

      {/* Members modal */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto receipt-slip rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-widest text-muted-foreground">
              Members
            </DialogTitle>
          </DialogHeader>
          <MemberPanel
            members={group.members}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
          />
        </DialogContent>
      </Dialog>

      {/* Settle up modal */}
      <Dialog open={showSettleUp} onOpenChange={setShowSettleUp}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto receipt-slip rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-widest text-muted-foreground">
              Settle up
            </DialogTitle>
          </DialogHeader>
          <SettlementPanel
            group={group}
            onRecordPayment={
              onRecordPayment
                ? (from, to, amount) => {
                    onRecordPayment(from, to, amount)
                    setShowSettleUp(false)
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      {/* Add / Edit Expense Modal */}
      <Dialog
        open={showExpenseForm}
        onOpenChange={(open) => {
          setShowExpenseForm(open)
          if (!open) setEditingExpense(null)
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto receipt-slip rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-widest text-muted-foreground">
              {editingExpense ? "Edit expense" : "New Expense"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            key={editingExpense?.id ?? "new"}
            members={group.members}
            initialExpense={editingExpense ?? undefined}
            onAddExpense={(expense) => {
              onAddExpense(expense)
              setShowExpenseForm(false)
            }}
            onUpdateExpense={
              editingExpense && onUpdateExpense
                ? (expense) => {
                    onUpdateExpense(editingExpense.id, expense)
                    setShowExpenseForm(false)
                    setEditingExpense(null)
                  }
                : undefined
            }
            onCancel={() => {
              setShowExpenseForm(false)
              setEditingExpense(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
