import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Edit, Trash2, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatExchangeRate, SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import type { ExchangeRate, InsertExchangeRate } from "@shared/schema";

const exchangeRateSchema = z.object({
  fromCurrency: z.string().min(1, "From currency is required"),
  toCurrency: z.string().min(1, "To currency is required"),
  rate: z.string().min(1, "Exchange rate is required"),
  date: z.string().min(1, "Date is required"),
  source: z.string().default("manual"),
});

type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;

export default function ExchangeRates() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const { toast } = useToast();

  const { data: exchangeRates, isLoading } = useQuery({
    queryKey: ["/api/exchange-rates"],
    enabled: false,
  });

  // Mock data for demonstration
  const mockRates: ExchangeRate[] = [
    {
      id: "1",
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: "0.847000",
      date: new Date("2024-01-15"),
      source: "manual",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      fromCurrency: "USD",
      toCurrency: "GBP",
      rate: "0.785000",
      date: new Date("2024-01-15"),
      source: "api",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "3",
      fromCurrency: "USD",
      toCurrency: "CAD",
      rate: "1.340000",
      date: new Date("2024-01-15"),
      source: "manual",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "4",
      fromCurrency: "EUR",
      toCurrency: "USD",
      rate: "1.180000",
      date: new Date("2024-01-15"),
      source: "api",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "5",
      fromCurrency: "GBP",
      toCurrency: "USD",
      rate: "1.274000",
      date: new Date("2024-01-15"),
      source: "manual",
      createdAt: new Date("2024-01-15"),
    },
  ];

  const displayRates = exchangeRates || mockRates;

  const createExchangeRateMutation = useMutation({
    mutationFn: async (data: InsertExchangeRate) => {
      const response = await apiRequest("POST", "/api/exchange-rates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      toast({
        title: "Success",
        description: "Exchange rate added successfully",
      });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ExchangeRateFormData>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: "",
      date: new Date().toISOString().split('T')[0],
      source: "manual",
    },
  });

  const onSubmit = (data: ExchangeRateFormData) => {
    const exchangeRateData: InsertExchangeRate = {
      ...data,
      rate: parseFloat(data.rate).toFixed(6),
      date: new Date(data.date),
    };

    createExchangeRateMutation.mutate(exchangeRateData);
  };

  const filteredRates = displayRates.filter((rate) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      rate.fromCurrency.toLowerCase().includes(searchLower) ||
      rate.toCurrency.toLowerCase().includes(searchLower) ||
      `${rate.fromCurrency}/${rate.toCurrency}`.toLowerCase().includes(searchLower)
    );
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "api":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">API</Badge>;
      case "manual":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Manual</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const getCurrencyName = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency ? `${currency.code} - ${currency.name}` : code;
  };

  const getRateChange = (rate: ExchangeRate) => {
    // Mock rate change calculation - in real app, compare with previous rate
    const change = Math.random() * 2 - 1; // Random change between -1 and 1
    return change;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center" data-testid="page-title">
            <RefreshCw className="h-6 w-6 mr-2" />
            Exchange Rates
          </h1>
          <p className="text-muted-foreground">Manage currency exchange rates for multi-currency transactions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-add-rate">
          <Plus className="h-4 w-4 mr-2" />
          Add Rate
        </Button>
      </div>

      {/* Currency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Rates</p>
                <p className="text-2xl font-bold" data-testid="text-total-rates">
                  {displayRates.length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">API Sources</p>
                <p className="text-2xl font-bold" data-testid="text-api-rates">
                  {displayRates.filter(r => r.source === "api").length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Manual Rates</p>
                <p className="text-2xl font-bold" data-testid="text-manual-rates">
                  {displayRates.filter(r => r.source === "manual").length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Last Updated</p>
                <p className="text-lg font-bold" data-testid="text-last-updated">
                  Today
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search currency pairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-rates"
                />
              </div>
            </div>
            <Select value={baseCurrency} onValueChange={setBaseCurrency} data-testid="select-base-currency">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Base Currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-refresh-rates">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates List */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates ({filteredRates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No exchange rates found matching your criteria.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                Add your first exchange rate
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRates.map((rate) => {
                const rateChange = getRateChange(rate);
                return (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    data-testid={`rate-item-${rate.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getSourceBadge(rate.source)}
                        <div>
                          <div className="font-semibold" data-testid={`rate-pair-${rate.id}`}>
                            {rate.fromCurrency}/{rate.toCurrency}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getCurrencyName(rate.fromCurrency)} → {getCurrencyName(rate.toCurrency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span data-testid={`rate-date-${rate.id}`}>
                              {formatDate(rate.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-mono font-semibold text-lg" data-testid={`rate-value-${rate.id}`}>
                          {formatExchangeRate(parseFloat(rate.rate))}
                        </div>
                        <div className={`text-sm flex items-center ${rateChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {rateChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          <span data-testid={`rate-change-${rate.id}`}>
                            {Math.abs(rateChange).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${rate.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${rate.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Exchange Rate Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="add-rate-dialog">
          <DialogHeader>
            <DialogTitle>Add Exchange Rate</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-from-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-to-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          {...field}
                          placeholder="1.234567"
                          data-testid="input-exchange-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-rate-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-rate-source">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="api">API Source</SelectItem>
                        <SelectItem value="bank">Bank Rate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExchangeRateMutation.isPending}
                  data-testid="button-save-rate"
                >
                  Add Exchange Rate
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
