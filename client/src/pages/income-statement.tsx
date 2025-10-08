import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/currency-utils";
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

interface IncomeStatementItem {
  id: string;
  code: string;
  name: string;
  currentPeriod: number;
  previousPeriod: number;
  children?: IncomeStatementItem[];
}

interface IncomeStatementData {
  revenue: IncomeStatementItem[];
  costOfGoodsSold: IncomeStatementItem[];
  operatingExpenses: IncomeStatementItem[];
  otherIncome: IncomeStatementItem[];
  otherExpenses: IncomeStatementItem[];
  totals: {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    operatingIncome: number;
    totalOtherIncome: number;
    totalOtherExpenses: number;
    netIncome: number;
    previousTotalRevenue: number;
    previousNetIncome: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export default function IncomeStatement() {
  const [selectedPeriod, setSelectedPeriod] = useState("current-quarter");
  const [selectedStandard, setSelectedStandard] = useState("US_GAAP");
  const [showComparative, setShowComparative] = useState(true);

  const { data: incomeStatementData, isLoading } = useQuery({
    queryKey: ["/api/reports/income-statement", MOCK_COMPANY_ID, selectedPeriod, selectedStandard],
    enabled: false,
  });

  // Mock data for demonstration - remove when API is connected
  const mockData: IncomeStatementData = {
    revenue: [
      { id: "1", code: "4000", name: "Service Revenue", currentPeriod: 2847392, previousPeriod: 2456780 },
      { id: "2", code: "4100", name: "Product Sales", currentPeriod: 156890, previousPeriod: 134567 },
      { id: "3", code: "4200", name: "Other Revenue", currentPeriod: 23450, previousPeriod: 18900 },
    ],
    costOfGoodsSold: [
      { id: "4", code: "5000", name: "Cost of Services", currentPeriod: 1245000, previousPeriod: 1089000 },
      { id: "5", code: "5100", name: "Cost of Products", currentPeriod: 78450, previousPeriod: 67280 },
    ],
    operatingExpenses: [
      { id: "6", code: "6000", name: "Software Expenses", currentPeriod: 156780, previousPeriod: 142000 },
      { id: "7", code: "6100", name: "Marketing Expenses", currentPeriod: 89500, previousPeriod: 76000 },
      { id: "8", code: "7000", name: "Salaries and Wages", currentPeriod: 456000, previousPeriod: 398000 },
      { id: "9", code: "7100", name: "Rent Expense", currentPeriod: 50400, previousPeriod: 48000 },
      { id: "10", code: "7200", name: "Utilities", currentPeriod: 12000, previousPeriod: 11500 },
      { id: "11", code: "7300", name: "Professional Services", currentPeriod: 34500, previousPeriod: 29000 },
    ],
    otherIncome: [
      { id: "12", code: "8000", name: "Interest Income", currentPeriod: 2500, previousPeriod: 1800 },
      { id: "13", code: "8100", name: "Investment Income", currentPeriod: 5600, previousPeriod: 4200 },
    ],
    otherExpenses: [
      { id: "14", code: "9000", name: "Interest Expense", currentPeriod: 8900, previousPeriod: 9500 },
      { id: "15", code: "9100", name: "Tax Expense", currentPeriod: 156000, previousPeriod: 134000 },
    ],
    totals: {
      totalRevenue: 3027732,
      totalCOGS: 1323450,
      grossProfit: 1704282,
      totalOperatingExpenses: 799180,
      operatingIncome: 905102,
      totalOtherIncome: 8100,
      totalOtherExpenses: 164900,
      netIncome: 748302,
      previousTotalRevenue: 2610247,
      previousNetIncome: 645780,
    },
    period: {
      start: new Date("2024-01-01"),
      end: new Date("2024-03-31"),
    },
  };

  const data = incomeStatementData || mockData;

  const grossProfitMargin = (data.totals.grossProfit / data.totals.totalRevenue) * 100;
  const operatingMargin = (data.totals.operatingIncome / data.totals.totalRevenue) * 100;
  const netProfitMargin = (data.totals.netIncome / data.totals.totalRevenue) * 100;

  const revenueGrowth = ((data.totals.totalRevenue - data.totals.previousTotalRevenue) / data.totals.previousTotalRevenue) * 100;
  const netIncomeGrowth = ((data.totals.netIncome - data.totals.previousNetIncome) / data.totals.previousNetIncome) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center" data-testid="page-title">
            <BarChart3 className="h-6 w-6 mr-2" />
            Income Statement
          </h1>
          <p className="text-muted-foreground">Statement of comprehensive income</p>
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
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="previous-quarter">Previous Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
              <SelectItem value="previous-year">Previous Year</SelectItem>
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
          <h3 className="text-lg mb-2">Income Statement</h3>
          <p className="text-muted-foreground flex items-center justify-center">
            <Calendar className="h-4 w-4 mr-1" />
            For the period {formatDate(data.period.start)} to {formatDate(data.period.end)}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-sm">Gross Margin</p>
            <p className="text-xl font-bold" data-testid="text-gross-margin">
              {formatPercentage(grossProfitMargin)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-sm">Operating Margin</p>
            <p className="text-xl font-bold" data-testid="text-operating-margin">
              {formatPercentage(operatingMargin)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-sm">Net Margin</p>
            <p className="text-xl font-bold" data-testid="text-net-margin">
              {formatPercentage(netProfitMargin)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-sm">Revenue Growth</p>
            <p className={`text-xl font-bold flex items-center justify-center ${revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-revenue-growth">
              {revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {formatPercentage(Math.abs(revenueGrowth))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground text-sm">Income Growth</p>
            <p className={`text-xl font-bold flex items-center justify-center ${netIncomeGrowth >= 0 ? 'text-success' : 'text-destructive'}`} data-testid="text-income-growth">
              {netIncomeGrowth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {formatPercentage(Math.abs(netIncomeGrowth))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Income Statement Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Revenue Section */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-success">Revenue</h4>
                <div className="space-y-2 ml-4">
                  {data.revenue.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span data-testid={`revenue-name-${item.id}`}>{item.name}</span>
                      <div className="flex space-x-8">
                        <span className="font-mono w-24 text-right" data-testid={`revenue-current-${item.id}`}>
                          {formatCurrency(item.currentPeriod)}
                        </span>
                        {showComparative && (
                          <span className="font-mono w-24 text-right text-muted-foreground" data-testid={`revenue-previous-${item.id}`}>
                            {formatCurrency(item.previousPeriod)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Revenue</span>
                    <div className="flex space-x-8">
                      <span className="font-mono w-24 text-right" data-testid="text-total-revenue">
                        {formatCurrency(data.totals.totalRevenue)}
                      </span>
                      {showComparative && (
                        <span className="font-mono w-24 text-right text-muted-foreground" data-testid="text-previous-total-revenue">
                          {formatCurrency(data.totals.previousTotalRevenue)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost of Goods Sold */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-destructive">Cost of Goods Sold</h4>
                <div className="space-y-2 ml-4">
                  {data.costOfGoodsSold.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span data-testid={`cogs-name-${item.id}`}>{item.name}</span>
                      <div className="flex space-x-8">
                        <span className="font-mono w-24 text-right" data-testid={`cogs-current-${item.id}`}>
                          {formatCurrency(item.currentPeriod)}
                        </span>
                        {showComparative && (
                          <span className="font-mono w-24 text-right text-muted-foreground">
                            {formatCurrency(item.previousPeriod)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Cost of Goods Sold</span>
                    <div className="flex space-x-8">
                      <span className="font-mono w-24 text-right" data-testid="text-total-cogs">
                        {formatCurrency(data.totals.totalCOGS)}
                      </span>
                      {showComparative && (
                        <span className="font-mono w-24 text-right text-muted-foreground">
                          {formatCurrency(data.costOfGoodsSold.reduce((sum, item) => sum + item.previousPeriod, 0))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Gross Profit</span>
                  <div className="flex space-x-8">
                    <span className="font-mono w-24 text-right" data-testid="text-gross-profit">
                      {formatCurrency(data.totals.grossProfit)}
                    </span>
                    {showComparative && (
                      <span className="font-mono w-24 text-right text-muted-foreground">
                        {formatCurrency(data.totals.previousTotalRevenue - data.costOfGoodsSold.reduce((sum, item) => sum + item.previousPeriod, 0))}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div>
                <h4 className="font-semibold text-base mb-3 text-destructive">Operating Expenses</h4>
                <div className="space-y-2 ml-4">
                  {data.operatingExpenses.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span data-testid={`expense-name-${item.id}`}>{item.name}</span>
                      <div className="flex space-x-8">
                        <span className="font-mono w-24 text-right" data-testid={`expense-current-${item.id}`}>
                          {formatCurrency(item.currentPeriod)}
                        </span>
                        {showComparative && (
                          <span className="font-mono w-24 text-right text-muted-foreground">
                            {formatCurrency(item.previousPeriod)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total Operating Expenses</span>
                    <div className="flex space-x-8">
                      <span className="font-mono w-24 text-right" data-testid="text-total-operating-expenses">
                        {formatCurrency(data.totals.totalOperatingExpenses)}
                      </span>
                      {showComparative && (
                        <span className="font-mono w-24 text-right text-muted-foreground">
                          {formatCurrency(data.operatingExpenses.reduce((sum, item) => sum + item.previousPeriod, 0))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Income */}
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Operating Income</span>
                  <div className="flex space-x-8">
                    <span className="font-mono w-24 text-right" data-testid="text-operating-income">
                      {formatCurrency(data.totals.operatingIncome)}
                    </span>
                    {showComparative && (
                      <span className="font-mono w-24 text-right text-muted-foreground">
                        {formatCurrency(
                          data.totals.previousTotalRevenue - 
                          data.costOfGoodsSold.reduce((sum, item) => sum + item.previousPeriod, 0) - 
                          data.operatingExpenses.reduce((sum, item) => sum + item.previousPeriod, 0)
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Income/Expenses */}
              <div>
                <h4 className="font-semibold text-base mb-3">Other Income and Expenses</h4>
                <div className="space-y-2 ml-4">
                  {data.otherIncome.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span data-testid={`other-income-name-${item.id}`}>{item.name}</span>
                      <div className="flex space-x-8">
                        <span className="font-mono w-24 text-right text-success" data-testid={`other-income-current-${item.id}`}>
                          {formatCurrency(item.currentPeriod)}
                        </span>
                        {showComparative && (
                          <span className="font-mono w-24 text-right text-muted-foreground">
                            {formatCurrency(item.previousPeriod)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.otherExpenses.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span data-testid={`other-expense-name-${item.id}`}>{item.name}</span>
                      <div className="flex space-x-8">
                        <span className="font-mono w-24 text-right text-destructive" data-testid={`other-expense-current-${item.id}`}>
                          ({formatCurrency(item.currentPeriod)})
                        </span>
                        {showComparative && (
                          <span className="font-mono w-24 text-right text-muted-foreground">
                            ({formatCurrency(item.previousPeriod)})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Net Income */}
              <div className="border-t-2 border-foreground pt-4">
                <div className="flex justify-between font-bold text-xl">
                  <span>Net Income</span>
                  <div className="flex space-x-8">
                    <span className="font-mono w-24 text-right" data-testid="text-net-income">
                      {formatCurrency(data.totals.netIncome)}
                    </span>
                    {showComparative && (
                      <span className="font-mono w-24 text-right text-muted-foreground" data-testid="text-previous-net-income">
                        {formatCurrency(data.totals.previousNetIncome)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
