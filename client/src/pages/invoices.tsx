import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Eye, Edit, Trash2, Send, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/currency-utils";
import { getStatusColor } from "@/lib/accounting-utils";
import type { Invoice } from "@shared/schema";
import CreateInvoiceModal from "@/components/accounting/create-invoice-modal";

// Mock company ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";

export default function Invoices() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  // Mock data for demonstration
  const mockInvoices: Invoice[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      customerId: "customer-1",
      invoiceNumber: "INV-2024-001",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-14"),
      status: "SENT",
      subtotal: "15000.00",
      taxAmount: "1237.50",
      totalAmount: "16237.50",
      paidAmount: "0.00",
      currency: "USD",
      exchangeRate: "1.000000",
      terms: "Net 30",
      notes: "Payment due within 30 days",
      createdBy: "user-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      customerId: "customer-2",
      invoiceNumber: "INV-2024-002",
      issueDate: new Date("2024-01-10"),
      dueDate: new Date("2024-02-09"),
      status: "PAID",
      subtotal: "8500.00",
      taxAmount: "701.25",
      totalAmount: "9201.25",
      paidAmount: "9201.25",
      currency: "USD",
      exchangeRate: "1.000000",
      terms: "Net 30",
      notes: null,
      createdBy: "user-1",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-12"),
    },
    {
      id: "3",
      companyId: MOCK_COMPANY_ID,
      customerId: "customer-3",
      invoiceNumber: "INV-2023-089",
      issueDate: new Date("2023-12-15"),
      dueDate: new Date("2024-01-14"),
      status: "OVERDUE",
      subtotal: "12300.00",
      taxAmount: "1014.75",
      totalAmount: "13314.75",
      paidAmount: "0.00",
      currency: "USD",
      exchangeRate: "1.000000",
      terms: "Net 30",
      notes: "Follow up needed",
      createdBy: "user-1",
      createdAt: new Date("2023-12-15"),
      updatedAt: new Date("2023-12-15"),
    },
  ];

  const displayInvoices = invoices || mockInvoices;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/invoices/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
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

  const filteredInvoices = displayInvoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOutstandingAmount = (invoice: Invoice) => {
    return parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount);
  };

  const totalOutstanding = filteredInvoices.reduce((sum, invoice) => {
    return sum + getOutstandingAmount(invoice);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Invoices</h1>
          <p className="text-muted-foreground">Manage customer invoices and accounts receivable</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-invoice">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Outstanding</p>
                <p className="text-2xl font-bold font-mono" data-testid="text-total-outstanding">
                  {formatCurrency(totalOutstanding, "USD")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Draft Invoices</p>
                <p className="text-2xl font-bold" data-testid="text-draft-count">
                  {displayInvoices.filter(i => i.status === "DRAFT").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Overdue Invoices</p>
                <p className="text-2xl font-bold" data-testid="text-overdue-count">
                  {displayInvoices.filter(i => i.status === "OVERDUE").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Paid This Month</p>
                <p className="text-2xl font-bold" data-testid="text-paid-count">
                  {displayInvoices.filter(i => i.status === "PAID").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-success" />
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
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-invoices"
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
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
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
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices found matching your criteria.</p>
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                Create your first invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`invoice-item-${invoice.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <div>
                        <div className="font-semibold" data-testid={`invoice-number-${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span data-testid={`invoice-date-${invoice.id}`}>
                            Issue: {formatDate(invoice.issueDate)}
                          </span>
                          <span className="mx-2">•</span>
                          <span data-testid={`invoice-due-date-${invoice.id}`}>
                            Due: {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                        {invoice.notes && (
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`invoice-notes-${invoice.id}`}>
                            {invoice.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold" data-testid={`invoice-total-${invoice.id}`}>
                        {formatCurrency(parseFloat(invoice.totalAmount), invoice.currency)}
                      </div>
                      {getOutstandingAmount(invoice) > 0 && (
                        <div className="text-sm text-warning" data-testid={`invoice-outstanding-${invoice.id}`}>
                          Outstanding: {formatCurrency(getOutstandingAmount(invoice), invoice.currency)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">{invoice.currency}</div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" data-testid={`button-view-${invoice.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${invoice.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {invoice.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "SENT" })}
                          data-testid={`button-send-${invoice.id}`}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${invoice.id}`}
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

      {/* Create Invoice Modal */}
      <CreateInvoiceModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
