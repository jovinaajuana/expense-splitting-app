"use client"

import { cn } from "@/lib/utils"

interface MacWindowProps {
  title: string
  children: React.ReactNode
  className?: string
  headerActions?: React.ReactNode
  variant?: "default" | "compact"
}

export function MacWindow({
  children,
  className,
}: MacWindowProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-sm border border-border bg-card receipt-slip",
        className
      )}
    >
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
