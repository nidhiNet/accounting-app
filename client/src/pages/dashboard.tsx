import FinancialMetrics from "@/components/accounting/financial-metrics";
import RecentTransactions from "@/components/accounting/recent-transactions";
import QuickActions from "@/components/accounting/quick-actions";
import { useState } from "react";
import CreateInvoiceModal from "@/components/accounting/create-invoice-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, CheckCircle, University, CreditCard, PieChart, TrendingUp, TrendingDown } from "lucide-react";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

export default function Dashboard() {
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  const { data: financialMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/reports/financial-metrics", MOCK_COMPANY_ID],
  });

  const { data: accountBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ["/api/reports/account-balances", MOCK_COMPANY_ID],
  });

  // Mock data for demonstration - remove when API is connected
  const mockMetrics = {
    totalRevenue: "2847392.00",
    totalExpenses: "1923481.00",
    netProfit: "923911.00",
    cashBalance: "1547823.00",
  };

  const mockBalances = {
    assets: "3247891.00",
    liabilities: "1523672.00",
    equity: "1724219.00",
    revenue: "2847392.00",
    expenses: "1923481.00",
  };

  const metrics = financialMetrics || mockMetrics;
  const balances = accountBalances || mockBalances;

  return (
    <div className="p-6 space-y-6">
      {/* Financial Overview Cards */}
      <FinancialMetrics />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          <QuickActions onCreateInvoice={() => setShowCreateInvoice(true)} />

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-warning/10 border border-warning/20 rounded-md">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Exchange Rate Update</p>
                  <p className="text-xs text-muted-foreground">EUR/USD rate updated to 1.0847</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <Clock className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Overdue Invoices</p>
                  <p className="text-xs text-muted-foreground">5 invoices past due date</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-success/10 border border-success/20 rounded-md">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Backup Complete</p>
                  <p className="text-xs text-muted-foreground">Daily backup successful</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accounts Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chart of Accounts Overview</CardTitle>
            <div className="flex items-center space-x-2">
              <select className="bg-secondary border border-border rounded-md px-3 py-1 text-sm" data-testid="accounting-standard-selector">
                <option value="US_GAAP">US GAAP</option>
                <option value="IFRS">IFRS</option>
              </select>
              <button className="text-primary hover:text-primary/80 text-sm font-medium" data-testid="button-manage-accounts">
                Manage Accounts
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {balancesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="w-16 h-16 rounded-lg mx-auto mb-3" />
                  <Skeleton className="h-6 w-24 mx-auto mb-1" />
                  <Skeleton className="h-4 w-16 mx-auto mb-1" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <University className="text-primary text-xl" />
                </div>
                <h4 className="font-semibold text-lg font-mono" data-testid="text-assets-total">
                  ${parseFloat(balances.assets).toLocaleString()}
                </h4>
                <p className="text-muted-foreground text-sm">Assets</p>
                <p className="text-xs text-muted-foreground mt-1">42 accounts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="text-destructive text-xl" />
                </div>
                <h4 className="font-semibold text-lg font-mono" data-testid="text-liabilities-total">
                  ${parseFloat(balances.liabilities).toLocaleString()}
                </h4>
                <p className="text-muted-foreground text-sm">Liabilities</p>
                <p className="text-xs text-muted-foreground mt-1">18 accounts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <PieChart className="text-success text-xl" />
                </div>
                <h4 className="font-semibold text-lg font-mono" data-testid="text-equity-total">
                  ${parseFloat(balances.equity).toLocaleString()}
                </h4>
                <p className="text-muted-foreground text-sm">Equity</p>
                <p className="text-xs text-muted-foreground mt-1">8 accounts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="text-warning text-xl" />
                </div>
                <h4 className="font-semibold text-lg font-mono" data-testid="text-revenue-total">
                  ${parseFloat(balances.revenue).toLocaleString()}
                </h4>
                <p className="text-muted-foreground text-sm">Revenue</p>
                <p className="text-xs text-muted-foreground mt-1">15 accounts</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="text-muted-foreground text-xl" />
                </div>
                <h4 className="font-semibold text-lg font-mono" data-testid="text-expenses-total">
                  ${parseFloat(balances.expenses).toLocaleString()}
                </h4>
                <p className="text-muted-foreground text-sm">Expenses</p>
                <p className="text-xs text-muted-foreground mt-1">28 accounts</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Items & Tax Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Items */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-md">
              <div>
                <p className="font-medium text-sm">Accounts Receivable</p>
                <p className="text-xs text-muted-foreground">23 outstanding invoices</p>
              </div>
              <p className="font-mono font-semibold" data-testid="text-receivable-amount">$89,342.50</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-md">
              <div>
                <p className="font-medium text-sm">Accounts Payable</p>
                <p className="text-xs text-muted-foreground">12 pending payments</p>
              </div>
              <p className="font-mono font-semibold" data-testid="text-payable-amount">$42,718.90</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-md">
              <div>
                <p className="font-medium text-sm">Tax Payable</p>
                <p className="text-xs text-muted-foreground">Q4 2023 taxes</p>
              </div>
              <p className="font-mono font-semibold" data-testid="text-tax-amount">$28,456.12</p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tax Summary</CardTitle>
              <select className="bg-secondary border border-border rounded-md px-3 py-1 text-sm" data-testid="tax-period-selector">
                <option value="2024-q1">2024 Q1</option>
                <option value="2023-q4">2023 Q4</option>
                <option value="2023-q3">2023 Q3</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Federal Income Tax</span>
              <span className="font-mono" data-testid="text-federal-tax">$18,245.67</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">State Income Tax</span>
              <span className="font-mono" data-testid="text-state-tax">$7,892.34</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sales Tax</span>
              <span className="font-mono" data-testid="text-sales-tax">$12,456.78</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payroll Tax</span>
              <span className="font-mono" data-testid="text-payroll-tax">$9,234.56</span>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Tax Liability</span>
                <span className="font-mono" data-testid="text-total-tax">$47,829.35</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal open={showCreateInvoice} onOpenChange={setShowCreateInvoice} />
    </div>
  );
}
