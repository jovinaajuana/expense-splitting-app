import type { Group, Expense, Member, Settlement, SplitDetail } from "./types"

/**
 * Calculate how much each member owes from a single expense
 * Returns a map of memberId -> amount they should pay
 */
export function calculateExpenseShares(
  expense: Expense,
  members: Member[]
): Map<string, number> {
  const shares = new Map<string, number>()

  switch (expense.splitType) {
    case "equal": {
      const splitMembers =
        expense.splitDetails.length > 0
          ? expense.splitDetails.map((d) => d.memberId)
          : members.map((m) => m.id)
      const perPerson = expense.amount / splitMembers.length
      for (const memberId of splitMembers) {
        shares.set(memberId, perPerson)
      }
      break
    }

    case "exact": {
      for (const detail of expense.splitDetails) {
        shares.set(detail.memberId, detail.value)
      }
      break
    }

    case "percentage": {
      for (const detail of expense.splitDetails) {
        shares.set(detail.memberId, (detail.value / 100) * expense.amount)
      }
      break
    }

    case "proportional": {
      const totalWeight = expense.splitDetails.reduce(
        (sum, d) => sum + d.value,
        0
      )
      if (totalWeight > 0) {
        for (const detail of expense.splitDetails) {
          shares.set(
            detail.memberId,
            (detail.value / totalWeight) * expense.amount
          )
        }
      }
      break
    }
  }

  return shares
}

/**
 * Calculate net balances for all members in a group
 * Positive = is owed money, Negative = owes money
 * Includes recorded payments: when X pays Y, X's debt decreases (balance +amount), Y's credit decreases (balance -amount)
 */
export function calculateNetBalances(group: Group): Map<string, number> {
  const netBalances = new Map<string, number>()

  for (const member of group.members) {
    netBalances.set(member.id, 0)
  }

  for (const expense of group.expenses) {
    const shares = calculateExpenseShares(expense, group.members)

    const currentPayerBalance = netBalances.get(expense.paidById) || 0
    netBalances.set(expense.paidById, currentPayerBalance + expense.amount)

    for (const [memberId, share] of shares) {
      const current = netBalances.get(memberId) || 0
      netBalances.set(memberId, current - share)
    }
  }

  // Apply recorded payments: from paid to
  // Payer (from): debt decreases -> balance increases toward 0
  // Payee (to): credit decreases -> balance decreases toward 0
  const payments = group.payments ?? []
  for (const p of payments) {
    const fromCurrent = netBalances.get(p.fromMemberId) ?? 0
    const toCurrent = netBalances.get(p.toMemberId) ?? 0
    netBalances.set(p.fromMemberId, fromCurrent + p.amount)
    netBalances.set(p.toMemberId, toCurrent - p.amount)
  }

  return netBalances
}

/**
 * Minimize the number of transactions needed to settle all debts
 * Uses a greedy algorithm: match the largest creditor with the largest debtor
 */
export function simplifyDebts(group: Group): Settlement[] {
  const netBalances = calculateNetBalances(group)
  const memberMap = new Map(group.members.map((m) => [m.id, m]))

  const creditors: { memberId: string; amount: number }[] = []
  const debtors: { memberId: string; amount: number }[] = []

  for (const [memberId, balance] of netBalances) {
    const rounded = Math.round(balance * 100) / 100
    if (rounded > 0.01) {
      creditors.push({ memberId, amount: rounded })
    } else if (rounded < -0.01) {
      debtors.push({ memberId, amount: Math.abs(rounded) })
    }
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]

    const settleAmount = Math.min(creditor.amount, debtor.amount)
    const roundedAmount = Math.round(settleAmount * 100) / 100

    if (roundedAmount > 0.01) {
      const fromMember = memberMap.get(debtor.memberId)
      const toMember = memberMap.get(creditor.memberId)

      if (fromMember && toMember) {
        settlements.push({
          from: fromMember,
          to: toMember,
          amount: roundedAmount,
        })
      }
    }

    creditor.amount -= settleAmount
    debtor.amount -= settleAmount

    if (creditor.amount < 0.01) i++
    if (debtor.amount < 0.01) j++
  }

  return settlements
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Create default equal split details for all members
 */
export function createEqualSplit(members: Member[]): SplitDetail[] {
  return members.map((m) => ({ memberId: m.id, value: 1 }))
}

/**
 * Create default exact split details for all members
 */
export function createExactSplit(
  members: Member[],
  amount: number
): SplitDetail[] {
  const perPerson = Math.round((amount / members.length) * 100) / 100
  return members.map((m) => ({ memberId: m.id, value: perPerson }))
}

/**
 * Create default percentage split details
 */
export function createPercentageSplit(members: Member[]): SplitDetail[] {
  const percent = Math.floor(100 / members.length)
  const remainder = 100 - percent * members.length
  return members.map((m, i) => ({
    memberId: m.id,
    value: i === 0 ? percent + remainder : percent,
  }))
}

/**
 * Create default proportional split details
 */
export function createProportionalSplit(members: Member[]): SplitDetail[] {
  return members.map((m) => ({ memberId: m.id, value: 1 }))
}
