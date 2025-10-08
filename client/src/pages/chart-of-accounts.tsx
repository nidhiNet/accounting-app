import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency-utils";
import { getAccountTypeColor } from "@/lib/accounting-utils";
import type { Account, InsertAccount } from "@shared/schema";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

const accountSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  parentId: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().default("USD"),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function ChartOfAccounts() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/accounts/company", MOCK_COMPANY_ID],
  });

  // Mock data for demonstration
  const mockAccounts: Account[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      code: "1000",
      name: "Cash",
      type: "ASSET",
      parentId: null,
      description: "Petty cash and bank accounts",
      isActive: true,
      balance: "125000.00",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      code: "1200",
      name: "Accounts Receivable",
      type: "ASSET",
      parentId: null,
      description: "Money owed by customers",
      isActive: true,
      balance: "89342.50",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      companyId: MOCK_COMPANY_ID,
      code: "2000",
      name: "Accounts Payable",
      type: "LIABILITY",
      parentId: null,
      description: "Money owed to vendors",
      isActive: true,
      balance: "42718.90",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      companyId: MOCK_COMPANY_ID,
      code: "4000",
      name: "Service Revenue",
      type: "REVENUE",
      parentId: null,
      description: "Revenue from consulting services",
      isActive: true,
      balance: "2847392.00",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      companyId: MOCK_COMPANY_ID,
      code: "6000",
      name: "Software Expenses",
      type: "EXPENSE",
      parentId: null,
      description: "Software licensing and subscription costs",
      isActive: true,
      balance: "156780.00",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayAccounts = accounts || mockAccounts;

  const createAccountMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Account created successfully",
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

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAccount> }) => {
      const response = await apiRequest("PUT", `/api/accounts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      setEditingAccount(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "ASSET",
      parentId: "",
      description: "",
      currency: "USD",
    },
  });

  const onSubmit = (data: AccountFormData) => {
    const accountData: InsertAccount = {
      ...data,
      companyId: MOCK_COMPANY_ID,
      parentId: data.parentId || null,
    };

    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data: accountData });
    } else {
      createAccountMutation.mutate(accountData);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.reset({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId || "",
      description: account.description || "",
      currency: account.currency,
    });
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingAccount(null);
    form.reset();
  };

  const filteredAccounts = displayAccounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.code.includes(searchTerm);
    const matchesType = filterType === "all" || account.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your company's account structure</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-add-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-accounts"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType} data-testid="select-account-type-filter">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ASSET">Assets</SelectItem>
                <SelectItem value="LIABILITY">Liabilities</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
                <SelectItem value="REVENUE">Revenue</SelectItem>
                <SelectItem value="EXPENSE">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts ({filteredAccounts.length})</CardTitle>
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
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No accounts found matching your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`account-item-${account.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getAccountTypeColor(account.type)}>
                        {account.type}
                      </Badge>
                      <div>
                        <div className="font-semibold" data-testid={`account-name-${account.id}`}>
                          {account.code} - {account.name}
                        </div>
                        {account.description && (
                          <p className="text-sm text-muted-foreground" data-testid={`account-description-${account.id}`}>
                            {account.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold" data-testid={`account-balance-${account.id}`}>
                        {formatCurrency(parseFloat(account.balance), account.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">{account.currency}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        data-testid={`button-edit-${account.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${account.id}`}
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

      {/* Create/Edit Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent data-testid="create-account-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Account" : "Create New Account"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1000" data-testid="input-account-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-account-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ASSET">Asset</SelectItem>
                          <SelectItem value="LIABILITY">Liability</SelectItem>
                          <SelectItem value="EQUITY">Equity</SelectItem>
                          <SelectItem value="REVENUE">Revenue</SelectItem>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cash" data-testid="input-account-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional description" data-testid="input-account-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-parent-account">
                            <SelectValue placeholder="Select parent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {displayAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-account-currency">
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

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                  data-testid="button-save-account"
                >
                  {editingAccount ? "Update Account" : "Create Account"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
