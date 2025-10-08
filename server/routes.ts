import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertCompanySchema, insertAccountSchema, 
  insertJournalEntrySchema, insertJournalEntryLineSchema,
  insertContactSchema, insertInvoiceSchema, insertInvoiceLineSchema,
  insertExpenseSchema, insertPaymentSchema, insertExchangeRateSchema,
  insertTaxRateSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Companies
  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.json(company);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/companies/user/:userId", async (req, res) => {
    try {
      const companies = await storage.getCompaniesByUser(req.params.userId);
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, companyData);
      res.json(company);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Accounts
  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/accounts/company/:companyId", async (req, res) => {
    try {
      const accounts = await storage.getAccountsByCompany(req.params.companyId);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    try {
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(req.params.id, accountData);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Journal Entries
  app.post("/api/journal-entries", async (req, res) => {
    try {
      // Define schemas without complex omit logic to avoid TypeScript issues
      const entryRequestSchema = z.object({
        companyId: z.string(),
        entryNumber: z.string(), 
        date: z.string(), // Accept ISO date strings from frontend
        description: z.string(),
        reference: z.string().optional(),
        totalAmount: z.string()
      });

      const lineRequestSchema = z.object({
        accountId: z.string(),
        description: z.string().optional(),
        debitAmount: z.string().default('0'),
        creditAmount: z.string().default('0'),
        currency: z.string().default('USD'),
        exchangeRate: z.string().default('1')
      });

      const payloadSchema = z.object({
        entry: entryRequestSchema,
        lines: z.array(lineRequestSchema).min(2, "Journal entry must have at least 2 lines")
      });
      
      const { entry, lines } = payloadSchema.parse(req.body);
      
      // Validate all amounts are non-negative
      for (const line of lines) {
        const debitAmount = parseFloat(line.debitAmount || '0');
        const creditAmount = parseFloat(line.creditAmount || '0');
        
        if (debitAmount < 0 || creditAmount < 0) {
          return res.status(400).json({ message: "Debit and credit amounts must be non-negative" });
        }
        
        if (debitAmount > 0 && creditAmount > 0) {
          return res.status(400).json({ message: "Each line must have either a debit OR credit amount, not both" });
        }
        
        if (debitAmount === 0 && creditAmount === 0) {
          return res.status(400).json({ message: "Each line must have either a debit or credit amount" });
        }
      }
      
      // Validate double-entry bookkeeping: debits must equal credits
      const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debitAmount || '0'), 0);
      const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.creditAmount || '0'), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for minor rounding differences
        return res.status(400).json({ 
          message: `Debits (${totalDebits.toFixed(2)}) must equal credits (${totalCredits.toFixed(2)})` 
        });
      }
      
      // Verify all accounts exist and belong to the specified company
      const accountIds = lines.map(line => line.accountId);
      const accounts = await storage.getAccountsByCompany(entry.companyId);
      const validAccountIds = new Set(accounts.map(account => account.id));
      
      for (const accountId of accountIds) {
        if (!validAccountIds.has(accountId)) {
          return res.status(400).json({ 
            message: `Account ID ${accountId} does not exist or does not belong to this company` 
          });
        }
      }
      
      // Add system user ID for created_by field and convert date string to Date object
      const entryWithCreatedBy = {
        ...entry,
        date: new Date(entry.date), // Convert ISO string to Date for database
        totalAmount: totalDebits.toFixed(2), // Use validated total
        createdBy: 'system_user_id_1'
      };
      
      // Convert frontend line format to storage format (remove journalEntryId requirement)
      const storageLines = lines.map(line => ({
        accountId: line.accountId,
        description: line.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        currency: line.currency,
        exchangeRate: line.exchangeRate
      }));
      
      const journalEntry = await storage.createJournalEntry(entryWithCreatedBy, storageLines);
      res.json(journalEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/journal-entries/company/:companyId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getJournalEntriesByCompany(req.params.companyId, limit);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/journal-entries/:id", async (req, res) => {
    try {
      const entry = await storage.getJournalEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/journal-entries/:id/with-lines", async (req, res) => {
    try {
      const entryWithLines = await storage.getJournalEntryWithLines(req.params.id);
      if (!entryWithLines) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(entryWithLines);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/journal-entries/:id", async (req, res) => {
    try {
      // Use the same schema as POST but without createdBy and prevent companyId changes
      const entryUpdateSchema = z.object({
        entryNumber: z.string().optional(), 
        date: z.string().optional(), // Accept ISO date strings from frontend
        description: z.string().optional(),
        reference: z.string().optional(),
        totalAmount: z.string().optional()
      });

      const lineRequestSchema = z.object({
        accountId: z.string(),
        description: z.string().optional(),
        debitAmount: z.string().default('0'),
        creditAmount: z.string().default('0'),
        currency: z.string().default('USD'),
        exchangeRate: z.string().default('1')
      });

      const payloadSchema = z.object({
        entry: entryUpdateSchema,
        lines: z.array(lineRequestSchema).min(2, "Journal entry must have at least 2 lines")
      });
      
      const { entry, lines } = payloadSchema.parse(req.body);
      
      // Get existing entry to verify company ID and prevent changes
      const existingEntry = await storage.getJournalEntry(req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Validate all amounts are non-negative
      for (const line of lines) {
        const debitAmount = parseFloat(line.debitAmount || '0');
        const creditAmount = parseFloat(line.creditAmount || '0');
        
        if (debitAmount < 0 || creditAmount < 0) {
          return res.status(400).json({ message: "Debit and credit amounts must be non-negative" });
        }
        
        if (debitAmount > 0 && creditAmount > 0) {
          return res.status(400).json({ message: "Each line must have either a debit OR credit amount, not both" });
        }
        
        if (debitAmount === 0 && creditAmount === 0) {
          return res.status(400).json({ message: "Each line must have either a debit or credit amount" });
        }
      }
      
      // Validate double-entry bookkeeping: debits must equal credits
      const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debitAmount || '0'), 0);
      const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.creditAmount || '0'), 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for minor rounding differences
        return res.status(400).json({ 
          message: `Debits (${totalDebits.toFixed(2)}) must equal credits (${totalCredits.toFixed(2)})` 
        });
      }
      
      // Verify all accounts exist and belong to the entry's company
      const accountIds = lines.map(line => line.accountId);
      const accounts = await storage.getAccountsByCompany(existingEntry.companyId);
      const validAccountIds = new Set(accounts.map(account => account.id));
      
      for (const accountId of accountIds) {
        if (!validAccountIds.has(accountId)) {
          return res.status(400).json({ 
            message: `Account ID ${accountId} does not exist or does not belong to this company` 
          });
        }
      }
      
      // Update total amount to match the validated totals and convert date if provided
      const updatedEntryData: any = {
        ...entry,
        ...(entry.date && { date: new Date(entry.date) }), // Convert ISO string to Date if provided
        totalAmount: totalDebits.toFixed(2)
      };
      
      // Convert frontend line format to storage format (remove journalEntryId requirement)
      const storageLines = lines.map(line => ({
        accountId: line.accountId,
        description: line.description,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        currency: line.currency,
        exchangeRate: line.exchangeRate
      }));
      
      const updatedEntry = await storage.updateJournalEntry(req.params.id, updatedEntryData, storageLines);
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Contacts
  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/contacts/company/:companyId", async (req, res) => {
    try {
      const type = req.query.type as string;
      const contacts = await storage.getContactsByCompany(req.params.companyId, type);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const contactData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, contactData);
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Invoices
  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceSchema = z.object({
        invoice: insertInvoiceSchema,
        lines: z.array(insertInvoiceLineSchema)
      });
      
      const { invoice, lines } = invoiceSchema.parse(req.body);
      const newInvoice = await storage.createInvoice(invoice, lines);
      res.json(newInvoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/invoices/company/:companyId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const invoices = await storage.getInvoicesByCompany(req.params.companyId, limit);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/invoices/:id/status", async (req, res) => {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const invoice = await storage.updateInvoiceStatus(req.params.id, status);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Expenses
  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/expenses/company/:companyId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const expenses = await storage.getExpensesByCompany(req.params.companyId, limit);
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/expenses/:id/status", async (req, res) => {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const expense = await storage.updateExpenseStatus(req.params.id, status);
      res.json(expense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payments
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/payments/company/:companyId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const payments = await storage.getPaymentsByCompany(req.params.companyId, limit);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Exchange Rates
  app.post("/api/exchange-rates", async (req, res) => {
    try {
      const rateData = insertExchangeRateSchema.parse(req.body);
      const rate = await storage.createExchangeRate(rateData);
      res.json(rate);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await storage.getExchangeRates();
      res.json(rates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/exchange-rates/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const rate = await storage.getExchangeRate(from, to, date);
      if (!rate) {
        return res.status(404).json({ message: "Exchange rate not found" });
      }
      res.json(rate);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tax Rates
  app.post("/api/tax-rates", async (req, res) => {
    try {
      const taxRateData = insertTaxRateSchema.parse(req.body);
      const taxRate = await storage.createTaxRate(taxRateData);
      res.json(taxRate);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tax-rates/company/:companyId", async (req, res) => {
    try {
      const taxRates = await storage.getTaxRatesByCompany(req.params.companyId);
      res.json(taxRates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tax-rates/:id", async (req, res) => {
    try {
      const taxRate = await storage.getTaxRate(req.params.id);
      if (!taxRate) {
        return res.status(404).json({ message: "Tax rate not found" });
      }
      res.json(taxRate);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/tax-rates/:id", async (req, res) => {
    try {
      const taxRateData = insertTaxRateSchema.partial().parse(req.body);
      const taxRate = await storage.updateTaxRate(req.params.id, taxRateData);
      res.json(taxRate);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Financial Reports
  app.get("/api/reports/financial-metrics/:companyId", async (req, res) => {
    try {
      const metrics = await storage.getFinancialMetrics(req.params.companyId);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/recent-transactions/:companyId", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getRecentTransactions(req.params.companyId, limit);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/account-balances/:companyId", async (req, res) => {
    try {
      const balances = await storage.getAccountBalances(req.params.companyId);
      res.json(balances);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
