"use client"

import { useState, useEffect } from "react"
import { Plus, X, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, members: { name: string; email: string }[]) => void
}

export function AddGroupModal({
  open,
  onOpenChange,
  onSubmit,
}: AddGroupModalProps) {
  const [name, setName] = useState("")
  const [members, setMembers] = useState<{ name: string; email: string }[]>([])
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [memberEmail, setMemberEmail] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("")
      setMembers([])
      setIsAddingMember(false)
      setMemberName("")
      setMemberEmail("")
    }
  }, [open])

  const addCurrentMember = () => {
    if (memberName.trim() && memberEmail.trim()) {
      setMembers((prev) => [
        ...prev,
        { name: memberName.trim(), email: memberEmail.trim() },
      ])
      setMemberName("")
      setMemberEmail("")
      setIsAddingMember(false)
    }
  }

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), members)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto receipt-slip rounded-sm">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-widest text-muted-foreground">
            New group
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="group-name"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5"
            >
              Group name
            </label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Roommates, Trip to Paris"
              className="h-9 text-sm bg-background border border-input"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Members
              </label>
              {members.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {members.length > 0 && (
              <div className="flex flex-col gap-0 rounded border border-border bg-card divide-y divide-border max-h-40 overflow-y-auto">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-[10px] font-medium text-muted-foreground">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {member.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {member.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeMember(index)}
                      aria-label={`Remove ${member.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {isAddingMember ? (
              <div
                className="flex flex-wrap items-end gap-2 mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCurrentMember()
                  }
                }}
              >
                <Input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Name"
                  className="h-8 flex-1 min-w-[100px] text-sm border border-input bg-background"
                  autoFocus
                />
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Email"
                  className="h-8 flex-1 min-w-[100px] text-sm border border-input bg-background"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 px-3 text-xs"
                  disabled={!memberName.trim() || !memberEmail.trim()}
                  onClick={addCurrentMember}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setIsAddingMember(false)
                    setMemberName("")
                    setMemberEmail("")
                  }}
                  aria-label="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-9 w-full border border-input"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsAddingMember(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add member
              </Button>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
