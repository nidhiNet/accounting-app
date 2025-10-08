import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/reports/recent-transactions", MOCK_COMPANY_ID],
  });

  // Mock data for demonstration - remove when API is connected
  const mockTransactions = [
    {
      id: "1",
      date: new Date("2024-01-15"),
      description: "Software License Payment",
      account: "6000 - Software Expenses",
      totalAmount: "-2400.00",
    },
    {
      id: "2",
      date: new Date("2024-01-14"),
      description: "Client Payment - Invoice #INV-2024-001",
      account: "1200 - Accounts Receivable",
      totalAmount: "15750.00",
    },
    {
      id: "3",
      date: new Date("2024-01-13"),
      description: "Office Rent Payment",
      account: "7100 - Rent Expense",
      totalAmount: "-4200.00",
    },
    {
      id: "4",
      date: new Date("2024-01-12"),
      description: "Consulting Services Revenue",
      account: "4000 - Service Revenue",
      totalAmount: "8500.00",
    },
    {
      id: "5",
      date: new Date("2024-01-11"),
      description: "Equipment Purchase",
      account: "1600 - Equipment",
      totalAmount: "-12300.00",
    },
  ];

  const data = transactions || mockTransactions;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <button className="text-primary hover:text-primary/80 text-sm font-medium" data-testid="button-view-all-transactions">
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="font-medium pb-3">Date</th>
                  <th className="font-medium pb-3">Description</th>
                  <th className="font-medium pb-3">Account</th>
                  <th className="font-medium pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border/50 last:border-b-0">
                    <td className="py-3 text-sm font-mono" data-testid={`transaction-date-${transaction.id}`}>
                      {format(new Date(transaction.date), "yyyy-MM-dd")}
                    </td>
                    <td className="py-3 text-sm" data-testid={`transaction-description-${transaction.id}`}>
                      {transaction.description}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground" data-testid={`transaction-account-${transaction.id}`}>
                      {transaction.account}
                    </td>
                    <td className={`py-3 text-sm font-mono text-right ${
                      parseFloat(transaction.totalAmount) >= 0 ? "text-success" : "text-destructive"
                    }`} data-testid={`transaction-amount-${transaction.id}`}>
                      {parseFloat(transaction.totalAmount) >= 0 ? "+" : ""}${Math.abs(parseFloat(transaction.totalAmount)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
