"use client"

import { useState } from "react"
import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Group } from "@/lib/types"

interface SettlementPanelProps {
  group: Group
  onRecordPayment?: (fromMemberId: string, toMemberId: string, amount: number) => void
}

export function SettlementPanel({ group, onRecordPayment }: SettlementPanelProps) {
  const [payerId, setPayerId] = useState("")
  const [payeeId, setPayeeId] = useState("")
  const [amount, setAmount] = useState("")

  const canRecord =
    onRecordPayment &&
    group.members.length >= 2 &&
    payerId &&
    payeeId &&
    payerId !== payeeId &&
    /^\d*\.?\d{0,2}$/.test(amount) &&
    parseFloat(amount) > 0

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canRecord || !onRecordPayment) return
    const value = Math.round(parseFloat(amount) * 100) / 100
    onRecordPayment(payerId, payeeId, value)
  }

  if (group.members.length < 2) {
    return (
      <p className="text-[11px] text-muted-foreground py-4 text-center uppercase tracking-wide">
        Add at least 2 members to record a payment
      </p>
    )
  }

  return (
    <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground block mb-1">
            Who paid
          </label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select</option>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground block mb-1">
            Paid to
          </label>
          <select
            value={payeeId}
            onChange={(e) => setPayeeId(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select</option>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground block mb-1">
          Amount
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const v = e.target.value
              if (/^\d*\.?\d{0,2}$/.test(v) || v === "") setAmount(v)
            }}
            className="pl-9 h-9 text-sm border-l border-border"
          />
        </div>
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={!canRecord}>
        Record payment
      </Button>
    </form>
  )
}
