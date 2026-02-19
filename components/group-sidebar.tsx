"use client"

import { LogOut, Plus, Users, Trash2 } from "lucide-react"
import { signOutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Group } from "@/lib/types"

interface GroupSidebarProps {
  groups: Group[]
  selectedGroupId: string | null
  onSelectGroup: (id: string) => void
  onOpenAddGroupModal: () => void
  onDeleteGroup: (id: string) => void
}

export function GroupSidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  onOpenAddGroupModal,
  onDeleteGroup,
}: GroupSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between receipt-divider px-4 py-3">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Groups
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onOpenAddGroupModal()
          }}
          aria-label="Add group"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-1" data-group-list>
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
              No groups yet
            </p>
          </div>
        )}
        {groups.map((group) => (
          <div
            key={group.id}
            className={cn(
              "group flex items-center gap-2 mx-1.5 rounded-sm px-3 py-2 cursor-pointer transition-colors border border-transparent hover:border-border",
              selectedGroupId === group.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
            onClick={() => onSelectGroup(group.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectGroup(group.id)
            }}
          >
            <Users
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                selectedGroupId === group.id
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{group.name}</p>
              <p
                className={cn(
                  "text-[10px] font-mono",
                  selectedGroupId === group.id
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {group.members.length} member{group.members.length !== 1 ? "s" : ""} &middot;{" "}
                {group.expenses.length} expense{group.expenses.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                selectedGroupId === group.id
                  ? "text-primary-foreground hover:bg-primary-foreground/10"
                  : "text-muted-foreground hover:bg-accent"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteGroup(group.id)
              }}
              aria-label={`Delete ${group.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="receipt-divider border-t border-border px-2 py-2">
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
