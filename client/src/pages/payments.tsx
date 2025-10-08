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
import { Plus, Search, CreditCard, Edit, Trash2, DollarSign, ArrowUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/currency-utils";
import type { Payment, InsertPayment } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Mock company ID and user ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";
const MOCK_USER_ID = "mock-user-id";

const paymentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  method: z.enum(["CASH", "CHECK", "CREDIT_CARD", "BANK_TRANSFER", "OTHER"]),
  reference: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  fromAccountId: z.string().min(1, "From account is required"),
  toAccountId: z.string().optional(),
  invoiceId: z.string().optional(),
  expenseId: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Payments() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  // Mock data for demonstration
  const mockPayments: Payment[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      date: new Date("2024-01-15"),
      amount: "15750.00",
      currency: "USD",
      exchangeRate: "1.000000",
      method: "BANK_TRANSFER",
      reference: "TXN-2024-001",
      description: "Client Payment - Invoice INV-2024-001",
      fromAccountId: "account-checking",
      toAccountId: "account-ar",
      invoiceId: "invoice-1",
      expenseId: null,
      journalEntryId: "je-1",
      createdBy: MOCK_USER_ID,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      date: new Date("2024-01-14"),
      amount: "2400.00",
      currency: "USD",
      exchangeRate: "1.000000",
      method: "CHECK",
      reference: "CHK-1001",
      description: "Software License Payment",
      fromAccountId: "account-checking",
      toAccountId: null,
      invoiceId: null,
      expenseId: "expense-1",
      journalEntryId: "je-2",
      createdBy: MOCK_USER_ID,
      createdAt: new Date("2024-01-14"),
      updatedAt: new Date("2024-01-14"),
    },
    {
      id: "3",
      companyId: MOCK_COMPANY_ID,
      date: new Date("2024-01-12"),
      amount: "8500.00",
      currency: "USD",
      exchangeRate: "1.000000",
      method: "CREDIT_CARD",
      reference: "CC-ENDING-4567",
      description: "Equipment Purchase",
      fromAccountId: "account-credit",
      toAccountId: "account-equipment",
      invoiceId: null,
      expenseId: null,
      journalEntryId: "je-3",
      createdBy: MOCK_USER_ID,
      createdAt: new Date("2024-01-12"),
      updatedAt: new Date("2024-01-12"),
    },
  ];

  const displayPayments = payments || mockPayments;

  const createPaymentMutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/company", MOCK_COMPANY_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
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

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      currency: "USD",
      method: "BANK_TRANSFER",
      reference: "",
      description: "",
      fromAccountId: "",
      toAccountId: "",
      invoiceId: "",
      expenseId: "",
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    const paymentData: InsertPayment = {
      ...data,
      companyId: MOCK_COMPANY_ID,
      date: new Date(data.date),
      amount: parseFloat(data.amount).toFixed(2),
      exchangeRate: "1.000000",
      toAccountId: data.toAccountId || null,
      invoiceId: data.invoiceId || null,
      expenseId: data.expenseId || null,
      journalEntryId: null,
      createdBy: MOCK_USER_ID,
    };

    createPaymentMutation.mutate(paymentData);
  };

  const filteredPayments = displayPayments.filter((payment) => {
    const matchesSearch = payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalPayments = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const bankTransferCount = displayPayments.filter(p => p.method === "BANK_TRANSFER").length;
  const checkCount = displayPayments.filter(p => p.method === "CHECK").length;
  const creditCardCount = displayPayments.filter(p => p.method === "CREDIT_CARD").length;

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return <ArrowUpDown className="h-4 w-4" />;
      case "CHECK":
        return <CreditCard className="h-4 w-4" />;
      case "CREDIT_CARD":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return "bg-primary/10 text-primary border-primary/20";
      case "CHECK":
        return "bg-warning/10 text-warning border-warning/20";
      case "CREDIT_CARD":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Payments</h1>
          <p className="text-muted-foreground">Record and track all payment transactions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-record-payment">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold font-mono" data-testid="text-total-payments">
                  {formatCurrency(totalPayments, "USD")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Bank Transfers</p>
                <p className="text-2xl font-bold" data-testid="text-bank-transfer-count">
                  {bankTransferCount}
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Check Payments</p>
                <p className="text-2xl font-bold" data-testid="text-check-count">
                  {checkCount}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Credit Card</p>
                <p className="text-2xl font-bold" data-testid="text-credit-card-count">
                  {creditCardCount}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-destructive" />
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
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-payments"
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter} data-testid="select-method-filter">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payments ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payments found matching your criteria.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                Record your first payment
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`payment-item-${payment.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getMethodColor(payment.method)}>
                        <span className="flex items-center space-x-1">
                          {getMethodIcon(payment.method)}
                          <span>{payment.method.replace("_", " ")}</span>
                        </span>
                      </Badge>
                      <div>
                        <div className="font-semibold" data-testid={`payment-description-${payment.id}`}>
                          {payment.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span data-testid={`payment-date-${payment.id}`}>
                            {formatDate(payment.date)}
                          </span>
                          {payment.reference && (
                            <span className="ml-2" data-testid={`payment-reference-${payment.id}`}>
                              • {payment.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold" data-testid={`payment-amount-${payment.id}`}>
                        {formatCurrency(parseFloat(payment.amount), payment.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">{payment.currency}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${payment.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" data-testid="record-payment-dialog">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-payment-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          placeholder="0.00"
                          data-testid="input-payment-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe the payment..." data-testid="input-payment-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="CHECK">Check</SelectItem>
                          <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Check #, Transaction ID, etc." data-testid="input-payment-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Account</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-from-account">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="account-checking">1000 - Checking Account</SelectItem>
                          <SelectItem value="account-savings">1001 - Savings Account</SelectItem>
                          <SelectItem value="account-credit">2000 - Credit Card</SelectItem>
                          <SelectItem value="account-cash">1010 - Petty Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-to-account">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="account-ar">1200 - Accounts Receivable</SelectItem>
                          <SelectItem value="account-equipment">1600 - Equipment</SelectItem>
                          <SelectItem value="account-inventory">1500 - Inventory</SelectItem>
                          <SelectItem value="account-ap">2100 - Accounts Payable</SelectItem>
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
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Invoice (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-invoice">
                            <SelectValue placeholder="Select invoice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="invoice-1">INV-2024-001</SelectItem>
                          <SelectItem value="invoice-2">INV-2024-002</SelectItem>
                          <SelectItem value="invoice-3">INV-2024-003</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Expense (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-expense">
                            <SelectValue placeholder="Select expense" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense-1">EXP-2024-001</SelectItem>
                          <SelectItem value="expense-2">EXP-2024-002</SelectItem>
                          <SelectItem value="expense-3">EXP-2024-003</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-record-payment-submit"
                >
                  Record Payment
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
