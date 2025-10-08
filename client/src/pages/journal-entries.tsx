import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/currency-utils";
import { validateDoubleEntry } from "@/lib/accounting-utils";
import type { JournalEntry, InsertJournalEntry, InsertJournalEntryLine, Account } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

// Mock company ID and user ID - in a real app this would come from auth context
const MOCK_COMPANY_ID = "mock-company-id";
const MOCK_USER_ID = "mock-user-id";

interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName?: string;
  description: string;
  debitAmount: string;
  creditAmount: string;
}

const journalEntrySchema = z.object({
  entryNumber: z.string().min(1, "Entry number is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

export default function JournalEntries() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([
    { id: "1", accountId: "", description: "", debitAmount: "", creditAmount: "" },
    { id: "2", accountId: "", description: "", debitAmount: "", creditAmount: "" },
  ]);
  const { toast } = useToast();

  const { data: journalEntries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts/company", MOCK_COMPANY_ID],
    enabled: false,
  });

  // Mock data for demonstration
  const mockJournalEntries: JournalEntry[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      entryNumber: "JE-2024-001",
      date: new Date("2024-01-15"),
      description: "Software License Payment",
      reference: "INV-SFT-2024-001",
      totalAmount: "2400.00",
      createdBy: MOCK_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      entryNumber: "JE-2024-002",
      date: new Date("2024-01-14"),
      description: "Client Payment Received",
      reference: "PAY-2024-001",
      totalAmount: "15750.00",
      createdBy: MOCK_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: "1",
      companyId: MOCK_COMPANY_ID,
      code: "1000",
      name: "Cash",
      type: "ASSET",
      parentId: null,
      description: null,
      isActive: true,
      balance: "125000.00",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      companyId: MOCK_COMPANY_ID,
      code: "6000",
      name: "Software Expenses",
      type: "EXPENSE",
      parentId: null,
      description: null,
      isActive: true,
      balance: "156780.00",
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayEntries: JournalEntry[] = journalEntries || mockJournalEntries;
  const displayAccounts: Account[] = accounts || mockAccounts;

  const createJournalEntryMutation = useMutation({
    mutationFn: async (data: { entry: any; lines: any[] }) => {
      const response = await apiRequest("POST", "/api/journal-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries/company", MOCK_COMPANY_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });
      setShowCreateDialog(false);
      form.reset();
      resetLines();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJournalEntryMutation = useMutation({
    mutationFn: async (data: { id: string; entry: any; lines: any[] }) => {
      const response = await apiRequest("PUT", `/api/journal-entries/${data.id}`, {
        entry: data.entry,
        lines: data.lines
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries/company", MOCK_COMPANY_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/company", MOCK_COMPANY_ID] });
      toast({
        title: "Success",
        description: "Journal entry updated successfully",
      });
      setShowEditDialog(false);
      setEditingEntry(null);
      form.reset();
      resetLines();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Query to fetch journal entry with lines for editing
  const { data: editingEntryWithLines, isLoading: isLoadingEditData } = useQuery({
    queryKey: ["/api/journal-entries", editingEntry?.id, "with-lines"],
    queryFn: async () => {
      if (!editingEntry) return null;
      const response = await apiRequest("GET", `/api/journal-entries/${editingEntry.id}/with-lines`);
      return response.json();
    },
    enabled: !!editingEntry,
  });

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entryNumber: `JE-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      description: "",
      reference: "",
    },
  });

  const addLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      accountId: "",
      description: "",
      debitAmount: "",
      creditAmount: "",
    };
    setEntryLines([...entryLines, newLine]);
  };

  const removeLine = (id: string) => {
    if (entryLines.length > 2) {
      setEntryLines(entryLines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof JournalEntryLine, value: string) => {
    setEntryLines(entryLines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'accountId') {
          const account = displayAccounts.find(a => a.id === value);
          updated.accountName = account ? `${account.code} - ${account.name}` : "";
        }
        return updated;
      }
      return line;
    }));
  };

  const resetLines = () => {
    setEntryLines([
      { id: "1", accountId: "", description: "", debitAmount: "", creditAmount: "" },
      { id: "2", accountId: "", description: "", debitAmount: "", creditAmount: "" },
    ]);
  };

  const calculateTotals = () => {
    const totalDebits = entryLines.reduce((sum, line) => 
      sum + (parseFloat(line.debitAmount) || 0), 0);
    const totalCredits = entryLines.reduce((sum, line) => 
      sum + (parseFloat(line.creditAmount) || 0), 0);
    return { totalDebits, totalCredits };
  };

  const { totalDebits, totalCredits } = calculateTotals();
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
    
    // Reset form and lines initially
    resetLines();
    form.reset({
      entryNumber: entry.entryNumber,
      date: typeof entry.date === 'string' ? new Date(entry.date).toISOString().split('T')[0] : entry.date.toISOString().split('T')[0],
      description: entry.description,
      reference: entry.reference || "",
    });
  };

  // Effect to populate form when editing entry data is loaded
  useEffect(() => {
    if (editingEntryWithLines && !isLoadingEditData) {
      const { entry, lines } = editingEntryWithLines;
      
      // Populate form with entry data
      form.reset({
        entryNumber: entry.entryNumber,
        date: typeof entry.date === 'string' ? new Date(entry.date).toISOString().split('T')[0] : entry.date.toISOString().split('T')[0],
        description: entry.description,
        reference: entry.reference || "",
      });

      // Populate lines with entry lines data
      const populatedLines = lines.map((line: any, index: number) => ({
        id: (index + 1).toString(),
        accountId: line.accountId,
        description: line.description || "",
        debitAmount: line.debitAmount || "0",
        creditAmount: line.creditAmount || "0",
      }));

      // Add empty lines if needed
      while (populatedLines.length < 2) {
        populatedLines.push({
          id: (populatedLines.length + 1).toString(),
          accountId: "",
          description: "",
          debitAmount: "",
          creditAmount: "",
        });
      }

      setEntryLines(populatedLines);
    }
  }, [editingEntryWithLines, isLoadingEditData, form]);

  const onSubmit = (data: JournalEntryFormData) => {
    const validation = validateDoubleEntry(entryLines.map(line => ({
      debitAmount: parseFloat(line.debitAmount) || 0,
      creditAmount: parseFloat(line.creditAmount) || 0,
    })));

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const lines = entryLines
      .filter(line => line.accountId && (parseFloat(line.debitAmount) > 0 || parseFloat(line.creditAmount) > 0))
      .map(line => ({
        accountId: line.accountId,
        description: line.description,
        debitAmount: (parseFloat(line.debitAmount) || 0).toFixed(2),
        creditAmount: (parseFloat(line.creditAmount) || 0).toFixed(2),
        currency: "USD",
        exchangeRate: "1.000000",
      }));

    if (editingEntry) {
      // Update existing entry - send date as ISO string to match backend expectations
      const entryUpdates = {
        entryNumber: data.entryNumber,
        date: new Date(data.date).toISOString(),
        description: data.description,
        reference: data.reference,
        totalAmount: totalDebits.toFixed(2),
      };

      updateJournalEntryMutation.mutate({
        id: editingEntry.id,
        entry: entryUpdates,
        lines: lines
      });
    } else {
      // Create new entry
      const entry = {
        ...data,
        companyId: MOCK_COMPANY_ID,
        date: new Date(data.date).toISOString(),
        totalAmount: totalDebits.toFixed(2),
        createdBy: MOCK_USER_ID,
      };

      createJournalEntryMutation.mutate({ entry, lines });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="page-title">Journal Entries</h1>
          <p className="text-muted-foreground">Manage double-entry bookkeeping transactions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-add-journal-entry">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Journal Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Recent Journal Entries
          </CardTitle>
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
          ) : displayEntries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No journal entries found.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                Create your first entry
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`journal-entry-${entry.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{entry.entryNumber}</Badge>
                      <div>
                        <div className="font-semibold" data-testid={`entry-description-${entry.id}`}>
                          {entry.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span data-testid={`entry-date-${entry.id}`}>
                            {formatDate(entry.date)}
                          </span>
                          {entry.reference && (
                            <span className="ml-2" data-testid={`entry-reference-${entry.id}`}>
                              • {entry.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold" data-testid={`entry-amount-${entry.id}`}>
                        {formatCurrency(parseFloat(entry.totalAmount), "USD")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditEntry(entry)}
                        data-testid={`button-edit-${entry.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${entry.id}`}
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

      {/* Create Journal Entry Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="create-journal-entry-dialog">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Entry Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entryNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-entry-number" />
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
                        <Input type="date" {...field} data-testid="input-entry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the transaction..." data-testid="input-entry-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Invoice #, Check #, etc." data-testid="input-entry-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Journal Entry Lines */}
              <div>
                <Label className="text-base font-medium">Journal Entry Lines</Label>
                <div className="border border-border rounded-md overflow-hidden mt-2">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-3 py-2 text-sm font-medium">Account</th>
                        <th className="text-left px-3 py-2 text-sm font-medium">Description</th>
                        <th className="text-left px-3 py-2 text-sm font-medium w-24">Debit</th>
                        <th className="text-left px-3 py-2 text-sm font-medium w-24">Credit</th>
                        <th className="w-10 px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, index) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2 border-t border-border">
                            <Select
                              value={line.accountId}
                              onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                              data-testid={`select-account-${line.id}`}
                            >
                              <SelectTrigger className="border-none shadow-none p-0 h-auto">
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {displayAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 border-t border-border">
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                              placeholder="Line description"
                              className="border-none shadow-none p-0 h-auto"
                              data-testid={`input-line-description-${line.id}`}
                            />
                          </td>
                          <td className="px-3 py-2 border-t border-border">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.debitAmount}
                              onChange={(e) => updateLine(line.id, 'debitAmount', e.target.value)}
                              placeholder="0.00"
                              className="border-none shadow-none p-0 h-auto font-mono"
                              data-testid={`input-debit-${line.id}`}
                            />
                          </td>
                          <td className="px-3 py-2 border-t border-border">
                            <Input
                              type="number"
                              step="0.01"
                              value={line.creditAmount}
                              onChange={(e) => updateLine(line.id, 'creditAmount', e.target.value)}
                              placeholder="0.00"
                              className="border-none shadow-none p-0 h-auto font-mono"
                              data-testid={`input-credit-${line.id}`}
                            />
                          </td>
                          <td className="px-3 py-2 border-t border-border">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(line.id)}
                              disabled={entryLines.length <= 2}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-remove-line-${line.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 font-medium">Totals:</td>
                        <td className="px-3 py-2 font-mono font-semibold" data-testid="text-total-debits">
                          ${totalDebits.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold" data-testid="text-total-credits">
                          ${totalCredits.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addLine}
                    data-testid="button-add-line"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                  <div className={`text-sm font-medium ${isBalanced ? 'text-success' : 'text-destructive'}`}>
                    {isBalanced ? "✓ Entry is balanced" : "⚠ Entry is not balanced"}
                  </div>
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
                  disabled={!isBalanced || createJournalEntryMutation.isPending}
                  data-testid="button-save-entry"
                >
                  Create Entry
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Journal Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="edit-journal-entry-dialog">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>

          {isLoadingEditData ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Entry Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entryNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Number</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-entry-number-edit" />
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
                          <Input type="date" {...field} data-testid="input-date-edit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter transaction description"
                            data-testid="input-description-edit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-reference-edit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Journal Entry Lines */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Journal Entry Lines</Label>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Account</th>
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-left p-3 font-medium w-24">Debit</th>
                          <th className="text-left p-3 font-medium w-24">Credit</th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {entryLines.map((line) => (
                          <tr key={line.id} className="border-t">
                            <td className="p-3">
                              <Select
                                value={line.accountId}
                                onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                              >
                                <SelectTrigger data-testid={`select-account-edit-${line.id}`}>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {displayAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.code} - {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Input
                                value={line.description}
                                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                placeholder="Line description"
                                data-testid={`input-line-description-edit-${line.id}`}
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={line.debitAmount}
                                onChange={(e) => updateLine(line.id, 'debitAmount', e.target.value)}
                                placeholder="0.00"
                                data-testid={`input-debit-edit-${line.id}`}
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                step="0.01"
                                value={line.creditAmount}
                                onChange={(e) => updateLine(line.id, 'creditAmount', e.target.value)}
                                placeholder="0.00"
                                data-testid={`input-credit-edit-${line.id}`}
                              />
                            </td>
                            <td className="p-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLine(line.id)}
                                disabled={entryLines.length <= 2}
                                data-testid={`button-remove-line-edit-${line.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t bg-muted/30">
                        <tr>
                          <td colSpan={2} className="p-3 font-semibold">Totals:</td>
                          <td className="p-3 font-mono font-bold">{formatCurrency(totalDebits, "USD")}</td>
                          <td className="p-3 font-mono font-bold">{formatCurrency(totalCredits, "USD")}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addLine}
                      data-testid="button-add-line-edit"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                    <div className={`text-sm font-medium ${isBalanced ? 'text-success' : 'text-destructive'}`}>
                      {isBalanced ? "✓ Entry is balanced" : "⚠ Entry is not balanced"}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditingEntry(null);
                      form.reset();
                      resetLines();
                    }}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isBalanced || updateJournalEntryMutation.isPending}
                    data-testid="button-update-entry"
                  >
                    Update Entry
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
