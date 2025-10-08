import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Book, CreditCard } from "lucide-react";

interface QuickActionsProps {
  onCreateInvoice: () => void;
}

export default function QuickActions({ onCreateInvoice }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start" 
          onClick={onCreateInvoice}
          data-testid="button-create-invoice"
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          data-testid="button-add-expense"
        >
          <Receipt className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          data-testid="button-create-journal-entry"
        >
          <Book className="mr-2 h-4 w-4" />
          Journal Entry
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          data-testid="button-record-payment"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </CardContent>
    </Card>
  );
}
