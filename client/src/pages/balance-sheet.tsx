import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/currency-utils";
import { Scale, Download, Calendar } from "lucide-react";
import { useState } from "react";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

interface BalanceSheetItem {
  id: string;
  code: string;
  name: string;
  amount: number;
  children?: BalanceSheetItem[];
}

interface BalanceSheetData {
  assets: {
    current: BalanceSheetItem[];
    nonCurrent: BalanceSheetItem[];
    total: number;
  };
  liabilities: {
    current: BalanceSheetItem[];
    nonCurrent: BalanceSheetItem[];
    total: number;
  };
  equity: {
    items: BalanceSheetItem[];
    total: number;
  };
  asOfDate: Date;
}

export default function BalanceSheet() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedStandard, setSelectedStandard] = useState("US_GAAP");

  const { data: balanceSheetData, isLoading } = useQuery({
    queryKey: ["/api/reports/balance-sheet", MOCK_COMPANY_ID, selectedPeriod, selectedStandard],
    enabled: false,
  });

  // Mock data for demonstration - remove when API is connected
  const mockData: BalanceSheetData = {
    assets: {
      current: [
        { id: "1", code: "1000", name: "Cash and Cash Equivalents", amount: 125000 },
        { id: "2", code: "1200", name: "Accounts Receivable", amount: 89342.50 },
        { id: "3", code: "1300", name: "Inventory", amount: 45000 },
        { id: "4", code: "1400", name: "Prepaid Expenses", amount: 12500 },
      ],
      nonCurrent: [
        { id: "5", code: "1600", name: "Equipment", amount: 185000 },
        { id: "6", code: "1650", name: "Accumulated Depreciation - Equipment", amount: -25000 },
        { id: "7", code: "1700", name: "Intangible Assets", amount: 50000 },
      ],
      total: 481842.50,
    },
    liabilities: {
      current: [
        { id: "8", code: "2000", name: "Accounts Payable", amount: 42718.90 },
        { id: "9", code: "2100", name: "Accrued Liabilities", amount: 15300 },
        { id: "10", code: "2200", name: "Short-term Debt", amount: 25000 },
      ],
      nonCurrent: [
        { id: "11", code: "2500", name: "Long-term Debt", amount: 150000 },
        { id: "12", code: "2600", name: "Deferred Tax Liability", amount: 8500 },
      ],
      total: 241518.90,
    },
    equity: {
      items: [
        { id: "13", code: "3000", name: "Common Stock", amount: 100000 },
        { id: "14", code: "3100", name: "Retained Earnings", amount: 125323.60 },
        { id: "15", code: "3200", name: "Additional Paid-in Capital", amount: 15000 },
      ],
      total: 240323.60,
    },
    asOfDate: new Date(),
  };

  const data = balanceSheetData || mockData;

  const totalCurrentAssets = data.assets.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentAssets = data.assets.nonCurrent.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentLiabilities = data.liabilities.current.reduce((sum, item) => sum + item.amount, 0);
  const totalNonCurrentLiabilities = data.liabilities.nonCurrent.reduce((sum, item) => sum + item.amount, 0);

  const isBalanced = Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 0.01;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center" data-testid="page-title">
            <Scale className="h-6 w-6 mr-2" />
            Balance Sheet
          </h1>
          <p className="text-muted-foreground">Statement of financial position</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedStandard} onValueChange={setSelectedStandard} data-testid="select-accounting-standard">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US_GAAP">US GAAP</SelectItem>
              <SelectItem value="IFRS">IFRS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="select-period">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
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
          <h3 className="text-lg mb-2">Balance Sheet</h3>
          <p className="text-muted-foreground flex items-center justify-center">
            <Calendar className="h-4 w-4 mr-1" />
            As of {formatDate(data.asOfDate)}
          </p>
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              isBalanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {isBalanced ? '✓ Balanced' : '⚠ Not Balanced'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Assets */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-primary">Current Assets</h4>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.assets.current.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span data-testid={`asset-name-${item.id}`}>{item.name}</span>
                        <span className="font-mono" data-testid={`asset-amount-${item.id}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                      <span>Total Current Assets</span>
                      <span className="font-mono" data-testid="text-total-current-assets">
                        {formatCurrency(totalCurrentAssets)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Non-Current Assets */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-primary">Non-Current Assets</h4>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.assets.nonCurrent.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span data-testid={`asset-name-${item.id}`}>{item.name}</span>
                        <span className="font-mono" data-testid={`asset-amount-${item.id}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                      <span>Total Non-Current Assets</span>
                      <span className="font-mono" data-testid="text-total-non-current-assets">
                        {formatCurrency(totalNonCurrentAssets)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Assets */}
              <div className="border-t-2 border-foreground pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Assets</span>
                  <span className="font-mono" data-testid="text-total-assets">
                    {formatCurrency(data.assets.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liabilities and Equity */}
        <div className="space-y-6">
          {/* Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Liabilities */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-destructive">Current Liabilities</h4>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.liabilities.current.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span data-testid={`liability-name-${item.id}`}>{item.name}</span>
                        <span className="font-mono" data-testid={`liability-amount-${item.id}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                      <span>Total Current Liabilities</span>
                      <span className="font-mono" data-testid="text-total-current-liabilities">
                        {formatCurrency(totalCurrentLiabilities)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Non-Current Liabilities */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-destructive">Non-Current Liabilities</h4>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.liabilities.nonCurrent.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span data-testid={`liability-name-${item.id}`}>{item.name}</span>
                        <span className="font-mono" data-testid={`liability-amount-${item.id}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-2">
                      <span>Total Non-Current Liabilities</span>
                      <span className="font-mono" data-testid="text-total-non-current-liabilities">
                        {formatCurrency(totalNonCurrentLiabilities)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Liabilities */}
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total Liabilities</span>
                  <span className="font-mono" data-testid="text-total-liabilities">
                    {formatCurrency(data.liabilities.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shareholders' Equity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {data.equity.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span data-testid={`equity-name-${item.id}`}>{item.name}</span>
                      <span className="font-mono" data-testid={`equity-amount-${item.id}`}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total Shareholders' Equity</span>
                    <span className="font-mono" data-testid="text-total-equity">
                      {formatCurrency(data.equity.total)}
                    </span>
                  </div>
                </div>
              )}

              {/* Total Liabilities and Equity */}
              <div className="border-t-2 border-foreground pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Liabilities and Equity</span>
                  <span className="font-mono" data-testid="text-total-liabilities-equity">
                    {formatCurrency(data.liabilities.total + data.equity.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
