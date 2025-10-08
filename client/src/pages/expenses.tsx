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
import { Plus, Search, Receipt, Edit, Trash2, Upload, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/currency-utils";
import { getStatusColor } from "@/lib/accounting-utils";
import type { Expense, InsertExpense } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Mock company ID and user ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";
const MOCK_USER_ID = "mock-user-id";

const expenseSchema = z.object({
  vendorId: z.string().optional(),
  expenseNumber: z.string().min(1, "Expense number is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  taxAmount: z.string().default("0"),
  currency: z.string().default("USD"),
  accountId: z.string().min(1, "Account is required"),
  receipt: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function Expenses() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["/api/expenses/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  // Mock data for demonstration
  const mockExpenses: Expense[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      vendorId: "vendor-1",
      expenseNumber: "EXP-2024-001",
      date: new Date("2024-01-15"),
      description: "Software License - Adobe Creative Suite",
      amount: "2400.00",
      taxAmount: "198.00",
      totalAmount: "2598.00",
      currency: "USD",
      exchangeRate: "1.000000",
      accountId: "account-software",
      status: "APPROVED",
      receipt: "/uploads/receipt-001.pdf",
      createdBy: MOCK_USER_ID,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16"),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      vendorId: "vendor-2",
      expenseNumber: "EXP-2024-002",
      date: new Date("2024-01-13"),
      description: "Office Rent - January 2024",
      amount: "4200.00",
      taxAmount: "0.00",
      totalAmount: "4200.00",
      currency: "USD",
      exchangeRate: "1.000000",
      accountId: "account-rent",
      status: "PAID",
      receipt: null,
      createdBy: MOCK_USER_ID,
      createdAt: new Date("2024-01-13"),
      updatedAt: new Date("2024-01-14"),
    },
    {
      id: "3",
      companyId: MOCK_COMPANY_ID,
      vendorId: null,
      expenseNumber: "EXP-2024-003",
      date: new Date("2024-01-12"),
      description: "Travel Expenses - Client Meeting",
      amount: "856.75",
      taxAmount: "0.00",
      totalAmount: "856.75",
      currency: "USD",
      exchangeRate: "1.000000",
      accountId: "account-travel",
      status: "PENDING",
      receipt: "/uploads/receipt-003.jpg",
      createdBy: MOCK_USER_ID,
      createdAt: new Date("2024-01-12"),
      updatedAt: new Date("2024-01-12"),
    },
  ];

  const displayExpenses = expenses || mockExpenses;

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Expense created successfully",
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/expenses/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Expense status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vendorId: "",
      expenseNumber: `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      description: "",
      amount: "",
      taxAmount: "0",
      currency: "USD",
      accountId: "",
      receipt: "",
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    const totalAmount = (parseFloat(data.amount) + parseFloat(data.taxAmount || "0")).toFixed(2);
    
    const expenseData: InsertExpense = {
      ...data,
      companyId: MOCK_COMPANY_ID,
      date: new Date(data.date),
      amount: parseFloat(data.amount).toFixed(2),
      taxAmount: parseFloat(data.taxAmount || "0").toFixed(2),
      totalAmount,
      vendorId: data.vendorId || null,
      receipt: data.receipt || null,
      createdBy: MOCK_USER_ID,
    };

    createExpenseMutation.mutate(expenseData);
  };

  const filteredExpenses = displayExpenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.totalAmount), 0);
  const pendingExpenses = displayExpenses.filter(e => e.status === "PENDING").length;
  const approvedExpenses = displayExpenses.filter(e => e.status === "APPROVED").length;
  const paidExpenses = displayExpenses.filter(e => e.status === "PAID").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Expenses</h1>
          <p className="text-muted-foreground">Track and manage company expenses</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-add-expense">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold font-mono" data-testid="text-total-expenses">
                  {formatCurrency(totalExpenses, "USD")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Pending Approval</p>
                <p className="text-2xl font-bold" data-testid="text-pending-count">
                  {pendingExpenses}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold" data-testid="text-approved-count">
                  {approvedExpenses}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Paid</p>
                <p className="text-2xl font-bold" data-testid="text-paid-count">
                  {paidExpenses}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
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
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-expenses"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses ({filteredExpenses.length})</CardTitle>
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
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No expenses found matching your criteria.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                Add your first expense
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`expense-item-${expense.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                      <div>
                        <div className="font-semibold" data-testid={`expense-number-${expense.id}`}>
                          {expense.expenseNumber}
                        </div>
                        <div className="text-sm" data-testid={`expense-description-${expense.id}`}>
                          {expense.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span data-testid={`expense-date-${expense.id}`}>
                            {formatDate(expense.date)}
                          </span>
                          {expense.receipt && (
                            <span className="ml-2">• Receipt attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold" data-testid={`expense-amount-${expense.id}`}>
                        {formatCurrency(parseFloat(expense.totalAmount), expense.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">{expense.currency}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${expense.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {expense.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: expense.id, status: "APPROVED" })}
                          className="text-success hover:text-success"
                          data-testid={`button-approve-${expense.id}`}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${expense.id}`}
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

      {/* Create Expense Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" data-testid="create-expense-dialog">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-expense-number" />
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
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expense-date" />
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
                      <Textarea {...field} placeholder="Describe the expense..." data-testid="input-expense-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          data-testid="input-expense-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          placeholder="0.00"
                          data-testid="input-tax-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
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
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Account</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-account">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="account-software">6000 - Software Expenses</SelectItem>
                          <SelectItem value="account-rent">7100 - Rent Expense</SelectItem>
                          <SelectItem value="account-travel">7200 - Travel Expenses</SelectItem>
                          <SelectItem value="account-office">7300 - Office Supplies</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vendor">
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vendor-1">Adobe Systems</SelectItem>
                          <SelectItem value="vendor-2">Office Landlord LLC</SelectItem>
                          <SelectItem value="vendor-3">Travel Agency Inc</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Receipt</FormLabel>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="outline" size="sm" data-testid="button-upload-receipt">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                  <span className="text-sm text-muted-foreground">Optional - PDF, JPG, or PNG</span>
                </div>
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
                  disabled={createExpenseMutation.isPending}
                  data-testid="button-save-expense"
                >
                  Add Expense
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
