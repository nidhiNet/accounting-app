import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/currency-utils";
import { HandCoins, Download, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

interface CashFlowItem {
  id: string;
  name: string;
  amount: number;
  isInflow: boolean;
}

interface CashFlowData {
  operatingActivities: CashFlowItem[];
  investingActivities: CashFlowItem[];
  financingActivities: CashFlowItem[];
  totals: {
    netCashFromOperations: number;
    netCashFromInvesting: number;
    netCashFromFinancing: number;
    netChangeInCash: number;
    beginningCash: number;
    endingCash: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export default function CashFlow() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-quarter");
  const [selectedMethod, setSelectedMethod] = useState("indirect");

  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ["/api/reports/cash-flow", MOCK_COMPANY_ID, selectedPeriod, selectedMethod],
    enabled: false,
  });

  // Mock data for demonstration - remove when API is connected
  const mockData: CashFlowData = {
    operatingActivities: [
      { id: "1", name: "Net Income", amount: 748302, isInflow: true },
      { id: "2", name: "Depreciation and Amortization", amount: 45000, isInflow: true },
      { id: "3", name: "Increase in Accounts Receivable", amount: -23450, isInflow: false },
      { id: "4", name: "Increase in Inventory", amount: -12000, isInflow: false },
      { id: "5", name: "Increase in Accounts Payable", amount: 15600, isInflow: true },
      { id: "6", name: "Increase in Accrued Liabilities", amount: 8900, isInflow: true },
    ],
    investingActivities: [
      { id: "7", name: "Purchase of Equipment", amount: -85000, isInflow: false },
      { id: "8", name: "Purchase of Software", amount: -25000, isInflow: false },
      { id: "9", name: "Investment in Securities", amount: -50000, isInflow: false },
      { id: "10", name: "Sale of Old Equipment", amount: 15000, isInflow: true },
    ],
    financingActivities: [
      { id: "11", name: "Proceeds from Long-term Debt", amount: 100000, isInflow: true },
      { id: "12", name: "Repayment of Short-term Debt", amount: -25000, isInflow: false },
      { id: "13", name: "Dividends Paid", amount: -45000, isInflow: false },
      { id: "14", name: "Interest Paid", amount: -8900, isInflow: false },
    ],
    totals: {
      netCashFromOperations: 782352,
      netCashFromInvesting: -145000,
      netCashFromFinancing: 21100,
      netChangeInCash: 658452,
      beginningCash: 125000,
      endingCash: 783452,
    },
    period: {
      start: new Date("2024-01-01"),
      end: new Date("2024-03-31"),
    },
  };

  const data = cashFlowData || mockData;

  const getCashFlowIcon = (isInflow: boolean) => {
    return isInflow ? (
      <ArrowUp className="h-4 w-4 text-success" />
    ) : (
      <ArrowDown className="h-4 w-4 text-destructive" />
    );
  };

  const getCashFlowColor = (amount: number) => {
    return amount >= 0 ? "text-success" : "text-destructive";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center" data-testid="page-title">
            <HandCoins className="h-6 w-6 mr-2" />
            Cash Flow Statement
          </h1>
          <p className="text-muted-foreground">Statement of cash flows</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedMethod} onValueChange={setSelectedMethod} data-testid="select-method">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="indirect">Indirect</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="select-period">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="previous-quarter">Previous Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">TechCorp Inc.</h2>
          <h3 className="text-lg mb-2">Statement of Cash Flows ({selectedMethod === "indirect" ? "Indirect Method" : "Direct Method"})</h3>
          <p className="text-muted-foreground flex items-center justify-center">
            <Calendar className="h-4 w-4 mr-1" />
            For the period {formatDate(data.period.start)} to {formatDate(data.period.end)}
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Operating Cash Flow</p>
                <p className={`text-2xl font-bold font-mono ${getCashFlowColor(data.totals.netCashFromOperations)}`} data-testid="text-operating-cash-flow">
                  {formatCurrency(data.totals.netCashFromOperations)}
                </p>
              </div>
              <HandCoins className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Investing Cash Flow</p>
                <p className={`text-2xl font-bold font-mono ${getCashFlowColor(data.totals.netCashFromInvesting)}`} data-testid="text-investing-cash-flow">
                  {formatCurrency(data.totals.netCashFromInvesting)}
                </p>
              </div>
              <HandCoins className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Financing Cash Flow</p>
                <p className={`text-2xl font-bold font-mono ${getCashFlowColor(data.totals.netCashFromFinancing)}`} data-testid="text-financing-cash-flow">
                  {formatCurrency(data.totals.netCashFromFinancing)}
                </p>
              </div>
              <HandCoins className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Net Change in Cash</p>
                <p className={`text-2xl font-bold font-mono ${getCashFlowColor(data.totals.netChangeInCash)}`} data-testid="text-net-change-cash">
                  {formatCurrency(data.totals.netChangeInCash)}
                </p>
              </div>
              <HandCoins className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Operating Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-success">Cash Flows from Operating Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data.operatingActivities.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      {getCashFlowIcon(item.isInflow)}
                      <span data-testid={`operating-name-${item.id}`}>{item.name}</span>
                    </div>
                    <span className={`font-mono ${getCashFlowColor(item.amount)}`} data-testid={`operating-amount-${item.id}`}>
                      {item.amount < 0 ? `(${formatCurrency(Math.abs(item.amount))})` : formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Cash from Operating Activities</span>
                    <span className={`font-mono ${getCashFlowColor(data.totals.netCashFromOperations)}`} data-testid="text-net-operating-cash">
                      {formatCurrency(data.totals.netCashFromOperations)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investing Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-warning">Cash Flows from Investing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data.investingActivities.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      {getCashFlowIcon(item.isInflow)}
                      <span data-testid={`investing-name-${item.id}`}>{item.name}</span>
                    </div>
                    <span className={`font-mono ${getCashFlowColor(item.amount)}`} data-testid={`investing-amount-${item.id}`}>
                      {item.amount < 0 ? `(${formatCurrency(Math.abs(item.amount))})` : formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Cash from Investing Activities</span>
                    <span className={`font-mono ${getCashFlowColor(data.totals.netCashFromInvesting)}`} data-testid="text-net-investing-cash">
                      {data.totals.netCashFromInvesting < 0 
                        ? `(${formatCurrency(Math.abs(data.totals.netCashFromInvesting))})`
                        : formatCurrency(data.totals.netCashFromInvesting)
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financing Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-primary">Cash Flows from Financing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data.financingActivities.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      {getCashFlowIcon(item.isInflow)}
                      <span data-testid={`financing-name-${item.id}`}>{item.name}</span>
                    </div>
                    <span className={`font-mono ${getCashFlowColor(item.amount)}`} data-testid={`financing-amount-${item.id}`}>
                      {item.amount < 0 ? `(${formatCurrency(Math.abs(item.amount))})` : formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Cash from Financing Activities</span>
                    <span className={`font-mono ${getCashFlowColor(data.totals.netCashFromFinancing)}`} data-testid="text-net-financing-cash">
                      {formatCurrency(data.totals.netCashFromFinancing)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Reconciliation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cash and Cash Equivalents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Cash and Cash Equivalents, Beginning of Period</span>
                <span className="font-mono" data-testid="text-beginning-cash">
                  {formatCurrency(data.totals.beginningCash)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Net Increase (Decrease) in Cash</span>
                <span className={`font-mono ${getCashFlowColor(data.totals.netChangeInCash)}`} data-testid="text-net-increase-cash">
                  {formatCurrency(data.totals.netChangeInCash)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Cash and Cash Equivalents, End of Period</span>
                  <span className="font-mono" data-testid="text-ending-cash">
                    {formatCurrency(data.totals.endingCash)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
