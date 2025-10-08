export function getAccountTypeColor(type: string): string {
  switch (type) {
    case "ASSET":
      return "bg-primary/10 text-primary border-primary/20";
    case "LIABILITY":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "EQUITY":
      return "bg-success/10 text-success border-success/20";
    case "REVENUE":
      return "bg-warning/10 text-warning border-warning/20";
    case "EXPENSE":
      return "bg-muted/50 text-muted-foreground border-muted/20";
    default:
      return "bg-muted/10 text-muted-foreground border-muted/20";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-muted/50 text-muted-foreground border-muted/20";
    case "SENT":
    case "PENDING":
      return "bg-warning/10 text-warning border-warning/20";
    case "PAID":
    case "APPROVED":
      return "bg-success/10 text-success border-success/20";
    case "OVERDUE":
    case "CANCELLED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted/10 text-muted-foreground border-muted/20";
  }
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateDoubleEntry(lines: Array<{ debitAmount: number; creditAmount: number }>): ValidationResult {
  if (lines.length < 2) {
    return { isValid: false, error: "A journal entry must have at least 2 lines" };
  }

  const totalDebits = lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredits = lines.reduce((sum, line) => sum + line.creditAmount, 0);

  const difference = Math.abs(totalDebits - totalCredits);
  if (difference > 0.01) {
    return { isValid: false, error: `Entry is not balanced. Difference: ${difference.toFixed(2)}` };
  }

  if (totalDebits === 0 && totalCredits === 0) {
    return { isValid: false, error: "Entry must have non-zero amounts" };
  }

  return { isValid: true };
}

export function calculateAccountBalance(
  currentBalance: number,
  accountType: string,
  debitAmount: number,
  creditAmount: number
): number {
  // Assets and Expenses increase with debits, decrease with credits
  if (["ASSET", "EXPENSE"].includes(accountType)) {
    return currentBalance + debitAmount - creditAmount;
  }
  // Liabilities, Equity, and Revenue increase with credits, decrease with debits
  else {
    return currentBalance + creditAmount - debitAmount;
  }
}

export function isDebitNormal(accountType: string): boolean {
  return ["ASSET", "EXPENSE"].includes(accountType);
}

export function isCreditNormal(accountType: string): boolean {
  return ["LIABILITY", "EQUITY", "REVENUE"].includes(accountType);
}

export function formatAccountNumber(code: string): string {
  // Ensure account codes are properly formatted (e.g., "1000" stays "1000")
  return code.padStart(4, "0");
}

export function getAccountTypeOrder(): Record<string, number> {
  return {
    ASSET: 1,
    LIABILITY: 2,
    EQUITY: 3,
    REVENUE: 4,
    EXPENSE: 5,
  };
}

export function sortAccountsByType(accounts: Array<{ type: string; code: string }>): Array<{ type: string; code: string }> {
  const order = getAccountTypeOrder();
  return accounts.sort((a, b) => {
    const typeComparison = (order[a.type] || 999) - (order[b.type] || 999);
    if (typeComparison !== 0) return typeComparison;
    return a.code.localeCompare(b.code);
  });
}

export function calculateProfitLoss(revenue: number, expenses: number): number {
  return revenue - expenses;
}

export function calculateCurrentRatio(currentAssets: number, currentLiabilities: number): number {
  if (currentLiabilities === 0) return 0;
  return currentAssets / currentLiabilities;
}

export function calculateDebtToEquityRatio(totalDebt: number, totalEquity: number): number {
  if (totalEquity === 0) return 0;
  return totalDebt / totalEquity;
}

export function calculateROA(netIncome: number, totalAssets: number): number {
  if (totalAssets === 0) return 0;
  return (netIncome / totalAssets) * 100;
}

export function calculateROE(netIncome: number, totalEquity: number): number {
  if (totalEquity === 0) return 0;
  return (netIncome / totalEquity) * 100;
}

export const ACCOUNTING_STANDARDS = {
  US_GAAP: "US GAAP",
  IFRS: "IFRS",
} as const;

export function getStandardName(standard: string): string {
  return ACCOUNTING_STANDARDS[standard as keyof typeof ACCOUNTING_STANDARDS] || standard;
}

export function generateInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(3, "0")}`;
}

export function generateExpenseNumber(year: number, sequence: number): string {
  return `EXP-${year}-${String(sequence).padStart(3, "0")}`;
}

export function generateJournalEntryNumber(year: number, sequence: number): string {
  return `JE-${year}-${String(sequence).padStart(3, "0")}`;
}
