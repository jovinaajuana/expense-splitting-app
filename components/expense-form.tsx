"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Member, SplitType, SplitDetail, Expense } from "@/lib/types"
import {
  createEqualSplit,
  createExactSplit,
  createPercentageSplit,
  createProportionalSplit,
} from "@/lib/expense-logic"
import { cn } from "@/lib/utils"
import { Divide, DollarSign, Percent, Scale } from "lucide-react"

interface ExpenseFormProps {
  members: Member[]
  initialExpense?: Expense
  onAddExpense: (expense: Omit<Expense, "id" | "createdAt">) => void
  onUpdateExpense?: (expense: Omit<Expense, "id" | "createdAt">) => void
  onCancel: () => void
}

const SPLIT_TYPES: {
  value: SplitType
  icon: React.ComponentType<{ className?: string }>
  ariaLabel: string
}[] = [
  { value: "equal", icon: Divide, ariaLabel: "Split equally" },
  { value: "exact", icon: DollarSign, ariaLabel: "Exact amounts" },
  { value: "percentage", icon: Percent, ariaLabel: "By percentage" },
  { value: "proportional", icon: Scale, ariaLabel: "By proportion" },
]

export function ExpenseForm({
  members,
  initialExpense,
  onAddExpense,
  onUpdateExpense,
  onCancel,
}: ExpenseFormProps) {
  const isEdit = !!initialExpense
  const [description, setDescription] = useState(initialExpense?.description ?? "")
  const [amount, setAmount] = useState(
    initialExpense ? String(initialExpense.amount) : ""
  )
  const [paidById, setPaidById] = useState(
    initialExpense?.paidById ?? members[0]?.id ?? ""
  )
  const [splitType, setSplitType] = useState<SplitType>(
    initialExpense?.splitType ?? "equal"
  )
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>(() => {
    if (initialExpense?.splitDetails?.length) {
      return members.map((m) => {
        const d = initialExpense.splitDetails.find((x) => x.memberId === m.id)
        return { memberId: m.id, value: d?.value ?? 0 }
      })
    }
    return createEqualSplit(members)
  })

  const handleSplitTypeChange = (type: SplitType) => {
    setSplitType(type)
    const parsedAmount = parseFloat(amount) || 0
    switch (type) {
      case "equal":
        setSplitDetails(createEqualSplit(members))
        break
      case "exact":
        setSplitDetails(createExactSplit(members, parsedAmount))
        break
      case "percentage":
        setSplitDetails(createPercentageSplit(members))
        break
      case "proportional":
        setSplitDetails(createProportionalSplit(members))
        break
    }
  }

  const updateSplitDetail = (memberId: string, value: number) => {
    setSplitDetails((prev) =>
      prev.map((d) => (d.memberId === memberId ? { ...d, value } : d))
    )
  }

  const toggleEqualMember = (memberId: string) => {
    setSplitDetails((prev) => {
      const existing = prev.find((d) => d.memberId === memberId)
      if (existing) {
        return prev.filter((d) => d.memberId !== memberId)
      }
      return [...prev, { memberId, value: 1 }]
    })
  }

  const percentageTotal =
    splitType === "percentage"
      ? splitDetails.reduce((sum, d) => sum + d.value, 0)
      : 0

  const exactTotal =
    splitType === "exact"
      ? splitDetails.reduce((sum, d) => sum + d.value, 0)
      : 0

  const parsedAmount = parseFloat(amount) || 0

  const isValid =
    description.trim() &&
    parsedAmount > 0 &&
    paidById &&
    (splitType !== "percentage" || Math.abs(percentageTotal - 100) < 0.01) &&
    (splitType !== "exact" ||
      Math.abs(exactTotal - parsedAmount) < 0.01) &&
    splitDetails.some((d) => d.value > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    const payload = {
      description: description.trim(),
      amount: parsedAmount,
      paidById,
      splitType,
      splitDetails: splitDetails.filter((d) => d.value > 0),
    }
    if (isEdit && onUpdateExpense) {
      onUpdateExpense(payload)
    } else {
      onAddExpense(payload)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Description
        </Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dinner, groceries, taxi..."
          className="h-9 text-sm font-mono bg-background"
          autoFocus
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-9 pl-7 text-sm font-mono bg-background"
            />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Paid by
          </Label>
          <select
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Split type
        </Label>
        <div className="flex gap-1.5">
          {SPLIT_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleSplitTypeChange(type.value)}
                aria-label={type.ariaLabel}
                title={type.ariaLabel}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
                  splitType === type.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                )}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Split details */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Split details
          {splitType === "percentage" && (
            <span
              className={cn(
                "ml-2 text-[10px]",
                Math.abs(percentageTotal - 100) < 0.01
                  ? "text-[var(--success)]"
                  : "text-destructive"
              )}
            >
              ({percentageTotal.toFixed(1)}% / 100%)
            </span>
          )}
          {splitType === "exact" && parsedAmount > 0 && (
            <span
              className={cn(
                "ml-2 text-[10px]",
                Math.abs(exactTotal - parsedAmount) < 0.01
                  ? "text-[var(--success)]"
                  : "text-destructive"
              )}
            >
              (${exactTotal.toFixed(2)} / ${parsedAmount.toFixed(2)})
            </span>
          )}
        </Label>

        <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-2">
          {members.map((member) => {
            const detail = splitDetails.find((d) => d.memberId === member.id)
            const isIncluded = splitType === "equal" ? !!detail : true

            return (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded px-2 py-1.5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-mono font-bold text-muted-foreground shrink-0">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 text-xs font-medium truncate">
                  {member.name}
                </span>

                {splitType === "equal" && (
                  <button
                    type="button"
                    onClick={() => toggleEqualMember(member.id)}
                    className={cn(
                      "h-5 w-5 rounded border text-[10px] flex items-center justify-center transition-colors",
                      isIncluded
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border bg-background"
                    )}
                    aria-label={`${isIncluded ? "Exclude" : "Include"} ${member.name}`}
                  >
                    {isIncluded && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                )}

                {splitType === "exact" && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={detail?.value ?? 0}
                      onChange={(e) =>
                        updateSplitDetail(
                          member.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-7 w-20 text-right text-xs font-mono bg-card"
                    />
                  </div>
                )}

                {splitType === "percentage" && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={detail?.value ?? 0}
                      onChange={(e) =>
                        updateSplitDetail(
                          member.id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-7 w-16 text-right text-xs font-mono bg-card"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      %
                    </span>
                  </div>
                )}

                {splitType === "proportional" && (
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={detail?.value ?? 0}
                    onChange={(e) =>
                      updateSplitDetail(
                        member.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="h-7 w-16 text-right text-xs font-mono bg-card"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="flex-1 h-8 text-xs font-mono"
          disabled={!isValid}
        >
          {isEdit ? "Save changes" : "Add Expense"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-mono"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
