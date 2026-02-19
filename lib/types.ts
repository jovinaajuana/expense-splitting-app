export interface Member {
  id: string
  name: string
  email: string
}

/** A recorded payment: one person paid another (reduces debt) */
export interface RecordedPayment {
  id: string
  fromMemberId: string
  toMemberId: string
  amount: number
  createdAt: number
}

export interface Group {
  id: string
  name: string
  members: Member[]
  expenses: Expense[]
  payments: RecordedPayment[]
  createdAt: number
}

export type SplitType = "equal" | "exact" | "percentage" | "proportional"

export interface SplitDetail {
  memberId: string
  value: number // exact amount, percentage (0-100), or proportion weight
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidById: string
  splitType: SplitType
  splitDetails: SplitDetail[]
  createdAt: number
}

export interface Settlement {
  from: Member
  to: Member
  amount: number
}
