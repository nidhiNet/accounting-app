import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

export default function FinancialMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/reports/financial-metrics", MOCK_COMPANY_ID],
  });

  // Mock data for demonstration - remove when API is connected
  const mockMetrics = {
    totalRevenue: "2847392.00",
    totalExpenses: "1923481.00",
    netProfit: "923911.00",
    cashBalance: "1547823.00",
  };

  const data = metrics || mockMetrics;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold font-mono" data-testid="text-revenue">
                ${parseFloat(data.totalRevenue).toLocaleString()}
              </p>
              <p className="text-success text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>12.5%</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold font-mono" data-testid="text-expenses">
                ${parseFloat(data.totalExpenses).toLocaleString()}
              </p>
              <p className="text-destructive text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>8.2%</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Net Profit</p>
              <p className="text-2xl font-bold font-mono" data-testid="text-profit">
                ${parseFloat(data.netProfit).toLocaleString()}
              </p>
              <p className="text-success text-sm flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>18.7%</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <DollarSign className="text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Cash Balance</p>
              <p className="text-2xl font-bold font-mono" data-testid="text-cash">
                ${parseFloat(data.cashBalance).toLocaleString()}
              </p>
              <p className="text-muted-foreground text-sm flex items-center mt-1">
                <span className="mr-1">−</span>
                <span>2.1%</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Wallet className="text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
