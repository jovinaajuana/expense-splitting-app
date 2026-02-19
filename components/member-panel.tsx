"use client"

import { useState } from "react"
import { Plus, X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Member } from "@/lib/types"

export type AddMemberResult = { ok: true } | { ok: false; message: string }

interface MemberPanelProps {
  members: Member[]
  onAddMember: (name: string, email: string) => Promise<AddMemberResult>
  onRemoveMember: (id: string) => void
}

const addMemberButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors w-full sm:w-auto"

export function MemberPanel({ members, onAddMember, onRemoveMember }: MemberPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      const result = await onAddMember(name.trim(), email.trim())
      if (result.ok) {
        setName("")
        setEmail("")
        setIsAdding(false)
      } else {
        setError(result.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setName("")
    setEmail("")
    setError(null)
  }

  /* Empty state: add member form/button aligned to top, like first member row */
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-stretch justify-start">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2">
            <div className="flex items-end gap-2">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                placeholder="Name"
                className="h-8 flex-1 min-w-0 text-sm border-border bg-card"
                autoFocus
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="Email"
                className="h-8 flex-1 min-w-0 text-sm border-border bg-card"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 shrink-0 px-3 text-xs"
                disabled={!name.trim() || !email.trim() || submitting}
              >
                {submitting ? "…" : "Add"}
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={cancelAdd} aria-label="Cancel">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={addMemberButtonClass}
          >
            <Plus className="h-4 w-4" />
            Add member
          </button>
        )}
      </div>
    )
  }

  /* With members: list first, then "Add member" at the bottom */
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0">
        {members.map((member) => (
          <div
            key={member.id}
            className="group flex items-center gap-3 rounded-sm px-2 py-2.5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[10px] font-medium text-muted-foreground">
              {member.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight text-foreground">
                {member.name}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground truncate leading-tight">
                <Mail className="h-3 w-3 shrink-0" />
                {member.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onRemoveMember(member.id)}
              aria-label={`Remove ${member.name}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add member at bottom: button or inline form */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-end gap-2">
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="Name"
              className="h-8 flex-1 min-w-0 text-sm border-border bg-card"
              autoFocus
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="Email"
              className="h-8 flex-1 min-w-0 text-sm border-border bg-card"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 shrink-0 px-3 text-xs"
              disabled={!name.trim() || !email.trim() || submitting}
            >
              {submitting ? "…" : "Add"}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={cancelAdd} aria-label="Cancel">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={addMemberButtonClass}
        >
          <Plus className="h-4 w-4" />
          Add member
        </button>
      )}
    </div>
  )
}
