import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ChartOfAccounts from "@/pages/chart-of-accounts";
import JournalEntries from "@/pages/journal-entries";
import Invoices from "@/pages/invoices";
import Expenses from "@/pages/expenses";
import Payments from "@/pages/payments";
import BalanceSheet from "@/pages/balance-sheet";
import IncomeStatement from "@/pages/income-statement";
import CashFlow from "@/pages/cash-flow";
import CompanySetup from "@/pages/company-setup";
import ExchangeRates from "@/pages/exchange-rates";
import TaxSettings from "@/pages/tax-settings";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/chart-of-accounts" component={ChartOfAccounts} />
            <Route path="/journal-entries" component={JournalEntries} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/payments" component={Payments} />
            <Route path="/balance-sheet" component={BalanceSheet} />
            <Route path="/income-statement" component={IncomeStatement} />
            <Route path="/cash-flow" component={CashFlow} />
            <Route path="/company-setup" component={CompanySetup} />
            <Route path="/exchange-rates" component={ExchangeRates} />
            <Route path="/tax-settings" component={TaxSettings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
