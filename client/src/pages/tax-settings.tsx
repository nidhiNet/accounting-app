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
import { Plus, Percent, Edit, Trash2, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatPercentage } from "@/lib/currency-utils";
import { getStatusColor } from "@/lib/accounting-utils";
import type { TaxRate, InsertTaxRate, Account } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

const taxRateSchema = z.object({
  name: z.string().min(1, "Tax name is required"),
  rate: z.string().min(1, "Tax rate is required"),
  type: z.string().min(1, "Tax type is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  accountId: z.string().optional(),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional(),
});

type TaxRateFormData = z.infer<typeof taxRateSchema>;

const TAX_TYPES = [
  { value: "sales", label: "Sales Tax" },
  { value: "purchase", label: "Purchase Tax" },
  { value: "vat", label: "VAT" },
  { value: "income", label: "Income Tax" },
  { value: "payroll", label: "Payroll Tax" },
  { value: "property", label: "Property Tax" },
  { value: "excise", label: "Excise Tax" },
  { value: "import", label: "Import Duty" },
  { value: "other", label: "Other" },
];

const JURISDICTIONS = [
  { value: "US-Federal", label: "United States - Federal" },
  { value: "US-CA", label: "United States - California" },
  { value: "US-NY", label: "United States - New York" },
  { value: "US-TX", label: "United States - Texas" },
  { value: "US-FL", label: "United States - Florida" },
  { value: "CA-Federal", label: "Canada - Federal" },
  { value: "CA-ON", label: "Canada - Ontario" },
  { value: "CA-QC", label: "Canada - Quebec" },
  { value: "EU-DE", label: "European Union - Germany" },
  { value: "EU-FR", label: "European Union - France" },
  { value: "EU-IT", label: "European Union - Italy" },
  { value: "EU-ES", label: "European Union - Spain" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" },
];

export default function TaxSettings() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const { toast } = useToast();

  const { data: taxRates, isLoading } = useQuery({
    queryKey: ["/api/tax-rates/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  // Mock data for demonstration
  const mockTaxRates: TaxRate[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      name: "California Sales Tax",
      rate: "0.0825",
      type: "sales",
      jurisdiction: "US-CA",
      accountId: "tax-account-1",
      isActive: true,
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      name: "Federal Income Tax",
      rate: "0.21",
      type: "income",
      jurisdiction: "US-Federal",
      accountId: "tax-account-2",
      isActive: true,
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "3",
      companyId: MOCK_COMPANY_ID,
      name: "New York State Tax",
      rate: "0.08",
      type: "sales",
      jurisdiction: "US-NY",
      accountId: "tax-account-3",
      isActive: true,
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: new Date("2024-12-31"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "4",
      companyId: MOCK_COMPANY_ID,
      name: "German VAT",
      rate: "0.19",
      type: "vat",
      jurisdiction: "EU-DE",
      accountId: "tax-account-4",
      isActive: false,
      effectiveFrom: new Date("2023-01-01"),
      effectiveTo: new Date("2023-12-31"),
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: "tax-account-1",
      companyId: MOCK_COMPANY_ID,
      code: "2300",
      name: "Sales Tax Payable",
      type: "LIABILITY",
      parentId: null,
      description: null,
      isActive: true,
      balance: "15680.25",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "tax-account-2",
      companyId: MOCK_COMPANY_ID,
      code: "2400",
      name: "Income Tax Payable",
      type: "LIABILITY",
      parentId: null,
      description: null,
      isActive: true,
      balance: "28456.12",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayTaxRates = taxRates || mockTaxRates;
  const displayAccounts = accounts || mockAccounts;

  const createTaxRateMutation = useMutation({
    mutationFn: async (data: InsertTaxRate) => {
      const response = await apiRequest("POST", "/api/tax-rates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-rates/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Tax rate created successfully",
      });
      setShowCreateDialog(false);
      setEditingTaxRate(null);
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

  const updateTaxRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertTaxRate> }) => {
      const response = await apiRequest("PUT", `/api/tax-rates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-rates/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Tax rate updated successfully",
      });
      setShowCreateDialog(false);
      setEditingTaxRate(null);
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

  const form = useForm<TaxRateFormData>({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: "",
      rate: "",
      type: "sales",
      jurisdiction: "US-Federal",
      accountId: "",
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: "",
    },
  });

  const onSubmit = (data: TaxRateFormData) => {
    const taxRateData: InsertTaxRate = {
      ...data,
      companyId: MOCK_COMPANY_ID,
      rate: (parseFloat(data.rate) / 100).toFixed(4), // Convert percentage to decimal
      accountId: data.accountId || null,
      isActive: true,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
    };

    if (editingTaxRate) {
      updateTaxRateMutation.mutate({ id: editingTaxRate.id, data: taxRateData });
    } else {
      createTaxRateMutation.mutate(taxRateData);
    }
  };

  const handleEdit = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate);
    form.reset({
      name: taxRate.name,
      rate: (parseFloat(taxRate.rate) * 100).toFixed(2), // Convert decimal to percentage
      type: taxRate.type,
      jurisdiction: taxRate.jurisdiction,
      accountId: taxRate.accountId || "",
      effectiveFrom: taxRate.effectiveFrom.toISOString().split('T')[0],
      effectiveTo: taxRate.effectiveTo ? taxRate.effectiveTo.toISOString().split('T')[0] : "",
    });
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingTaxRate(null);
    form.reset();
  };

  const filteredTaxRates = displayTaxRates.filter((taxRate) => {
    const matchesSearch = taxRate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         taxRate.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || taxRate.type === typeFilter;
    const matchesJurisdiction = jurisdictionFilter === "all" || taxRate.jurisdiction === jurisdictionFilter;
    return matchesSearch && matchesType && matchesJurisdiction;
  });

  const activeTaxRates = displayTaxRates.filter(tr => tr.isActive).length;
  const salesTaxRates = displayTaxRates.filter(tr => tr.type === "sales").length;
  const incomeTaxRates = displayTaxRates.filter(tr => tr.type === "income").length;
  const jurisdictionCount = new Set(displayTaxRates.map(tr => tr.jurisdiction)).size;

  const getTaxTypeBadge = (type: string) => {
    const typeConfig = TAX_TYPES.find(t => t.value === type);
    switch (type) {
      case "sales":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{typeConfig?.label}</Badge>;
      case "vat":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">{typeConfig?.label}</Badge>;
      case "income":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{typeConfig?.label}</Badge>;
      default:
        return <Badge variant="outline">{typeConfig?.label || type}</Badge>;
    }
  };

  const getJurisdictionName = (jurisdiction: string) => {
    const jurisdictionConfig = JURISDICTIONS.find(j => j.value === jurisdiction);
    return jurisdictionConfig?.label || jurisdiction;
  };

  const isExpired = (taxRate: TaxRate) => {
    return taxRate.effectiveTo && new Date(taxRate.effectiveTo) < new Date();
  };

  const isEffective = (taxRate: TaxRate) => {
    const now = new Date();
    const effectiveFrom = new Date(taxRate.effectiveFrom);
    const effectiveTo = taxRate.effectiveTo ? new Date(taxRate.effectiveTo) : null;
    
    return effectiveFrom <= now && (!effectiveTo || effectiveTo >= now);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center" data-testid="page-title">
            <Percent className="h-6 w-6 mr-2" />
            Tax Settings
          </h1>
          <p className="text-muted-foreground">Manage tax rates and configurations for different jurisdictions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-add-tax-rate">
          <Plus className="h-4 w-4 mr-2" />
          Add Tax Rate
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Tax Rates</p>
                <p className="text-2xl font-bold" data-testid="text-active-rates">
                  {activeTaxRates}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Sales Tax Rates</p>
                <p className="text-2xl font-bold" data-testid="text-sales-rates">
                  {salesTaxRates}
                </p>
              </div>
              <Percent className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Income Tax Rates</p>
                <p className="text-2xl font-bold" data-testid="text-income-rates">
                  {incomeTaxRates}
                </p>
              </div>
              <Percent className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Jurisdictions</p>
                <p className="text-2xl font-bold" data-testid="text-jurisdictions">
                  {jurisdictionCount}
                </p>
              </div>
              <Percent className="h-8 w-8 text-muted-foreground" />
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
                  placeholder="Search tax rates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-tax-rates"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter} data-testid="select-type-filter">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TAX_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter} data-testid="select-jurisdiction-filter">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Jurisdictions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {JURISDICTIONS.map((jurisdiction) => (
                  <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                    {jurisdiction.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates List */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Rates ({filteredTaxRates.length})</CardTitle>
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
          ) : filteredTaxRates.length === 0 ? (
            <div className="text-center py-12">
              <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tax rates found matching your criteria.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                Add your first tax rate
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTaxRates.map((taxRate) => (
                <div
                  key={taxRate.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`tax-rate-item-${taxRate.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getTaxTypeBadge(taxRate.type)}
                      {!taxRate.isActive && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          Inactive
                        </Badge>
                      )}
                      {isExpired(taxRate) && (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {isEffective(taxRate) && taxRate.isActive && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <div>
                        <div className="font-semibold" data-testid={`tax-rate-name-${taxRate.id}`}>
                          {taxRate.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span data-testid={`tax-rate-jurisdiction-${taxRate.id}`}>
                            {getJurisdictionName(taxRate.jurisdiction)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>Effective: {formatDate(taxRate.effectiveFrom)}</span>
                          {taxRate.effectiveTo && (
                            <span> - {formatDate(taxRate.effectiveTo)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg" data-testid={`tax-rate-percentage-${taxRate.id}`}>
                        {formatPercentage(parseFloat(taxRate.rate) * 100)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rate
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(taxRate)}
                        data-testid={`button-edit-${taxRate.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${taxRate.id}`}
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

      {/* Create/Edit Tax Rate Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl" data-testid="tax-rate-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingTaxRate ? "Edit Tax Rate" : "Add New Tax Rate"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tax Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="California Sales Tax" data-testid="input-tax-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          placeholder="8.25"
                          data-testid="input-tax-rate"
                        />
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
                      <FormLabel>Tax Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tax-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TAX_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="jurisdiction"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Jurisdiction</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-jurisdiction">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JURISDICTIONS.map((jurisdiction) => (
                            <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                              {jurisdiction.label}
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
                  name="accountId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tax Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tax-account">
                            <SelectValue placeholder="Select tax account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {displayAccounts
                            .filter(account => account.type === "LIABILITY")
                            .map((account) => (
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
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-effective-from" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective To (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-effective-to" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaxRateMutation.isPending || updateTaxRateMutation.isPending}
                  data-testid="button-save-tax-rate"
                >
                  {editingTaxRate ? "Update Tax Rate" : "Add Tax Rate"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
