import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, DollarSign } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" data-testid="page-title">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your financial position</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Company selector */}
          <div className="flex items-center space-x-2 bg-secondary px-3 py-2 rounded-md">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="techcorp-us" data-testid="company-selector">
              <SelectTrigger className="border-none bg-transparent p-0 h-auto text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="techcorp-us">TechCorp Inc. (US GAAP)</SelectItem>
                <SelectItem value="techcorp-eu">TechCorp Ltd. (IFRS)</SelectItem>
                <SelectItem value="techcorp-de">TechCorp GmbH (IFRS)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Currency selector */}
          <div className="flex items-center space-x-2 bg-secondary px-3 py-2 rounded-md">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="USD" data-testid="currency-selector">
              <SelectTrigger className="border-none bg-transparent p-0 h-auto text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">JD</span>
            </div>
            <span className="text-sm font-medium" data-testid="user-name">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
}
