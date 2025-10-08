import { Link, useLocation } from "wouter";
import { Calculator, ChartLine, List, Book, FileText, Receipt, CreditCard, Scale, BarChart3, HandCoins, Building, RefreshCw, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: ChartLine },
      { name: "Chart of Accounts", href: "/chart-of-accounts", icon: List },
      { name: "Journal Entries", href: "/journal-entries", icon: Book },
    ],
  },
  {
    name: "Transactions",
    items: [
      { name: "Invoices", href: "/invoices", icon: FileText },
      { name: "Expenses", href: "/expenses", icon: Receipt },
      { name: "Payments", href: "/payments", icon: CreditCard },
    ],
  },
  {
    name: "Reports",
    items: [
      { name: "Balance Sheet", href: "/balance-sheet", icon: Scale },
      { name: "Income Statement", href: "/income-statement", icon: BarChart3 },
      { name: "Cash Flow", href: "/cash-flow", icon: HandCoins },
    ],
  },
  {
    name: "Settings",
    items: [
      { name: "Company Setup", href: "/company-setup", icon: Building },
      { name: "Exchange Rates", href: "/exchange-rates", icon: RefreshCw },
      { name: "Tax Settings", href: "/tax-settings", icon: Percent },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-y-auto">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Calculator className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">AccuFinance Pro</h1>
            <p className="text-xs text-muted-foreground">Global Accounting</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((section) => (
          <div key={section.name}>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {section.name}
            </div>
            {section.items.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
