import { 
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Account, type InsertAccount,
  type JournalEntry, type InsertJournalEntry,
  type JournalEntryLine, type InsertJournalEntryLine,
  type Contact, type InsertContact,
  type Invoice, type InsertInvoice,
  type InvoiceLine, type InsertInvoiceLine,
  type Expense, type InsertExpense,
  type Payment, type InsertPayment,
  type ExchangeRate, type InsertExchangeRate,
  type TaxRate, type InsertTaxRate,
  users, companies, accounts, journalEntries, journalEntryLines,
  contacts, invoices, invoiceLines, expenses, payments,
  exchangeRates, taxRates
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, sum, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompaniesByUser(userId: string): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  
  // Accounts
  getAccount(id: string): Promise<Account | undefined>;
  getAccountsByCompany(companyId: string): Promise<Account[]>;
  getAccountByCode(companyId: string, code: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account>;
  updateAccountBalance(id: string, balance: string): Promise<Account>;
  
  // Journal Entries
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  getJournalEntryWithLines(id: string): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] } | undefined>;
  getJournalEntriesByCompany(companyId: string, limit?: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry, lines: Omit<InsertJournalEntryLine, 'journalEntryId'>[]): Promise<JournalEntry>;
  updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>, lines: Omit<InsertJournalEntryLine, 'journalEntryId'>[]): Promise<JournalEntry>;
  
  // Contacts
  getContact(id: string): Promise<Contact | undefined>;
  getContactsByCompany(companyId: string, type?: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  
  // Invoices
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByCompany(companyId: string, limit?: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice, lines: InsertInvoiceLine[]): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice>;
  
  // Expenses
  getExpense(id: string): Promise<Expense | undefined>;
  getExpensesByCompany(companyId: string, limit?: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpenseStatus(id: string, status: string): Promise<Expense>;
  
  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByCompany(companyId: string, limit?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Exchange Rates
  getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<ExchangeRate | undefined>;
  getExchangeRates(): Promise<ExchangeRate[]>;
  createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
  
  // Tax Rates
  getTaxRate(id: string): Promise<TaxRate | undefined>;
  getTaxRatesByCompany(companyId: string): Promise<TaxRate[]>;
  createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate>;
  updateTaxRate(id: string, taxRate: Partial<InsertTaxRate>): Promise<TaxRate>;
  
  // Financial Reports
  getFinancialMetrics(companyId: string): Promise<{
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    cashBalance: string;
  }>;
  getRecentTransactions(companyId: string, limit?: number): Promise<any[]>;
  getAccountBalances(companyId: string): Promise<{
    assets: string;
    liabilities: string;
    equity: string;
    revenue: string;
    expenses: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompaniesByUser(userId: string): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.createdBy, userId));
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updated] = await db.update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async getAccountsByCompany(companyId: string): Promise<Account[]> {
    return await db.select().from(accounts)
      .where(eq(accounts.companyId, companyId))
      .orderBy(accounts.code);
  }

  async getAccountByCode(companyId: string, code: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.code, code)));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, account: Partial<InsertAccount>): Promise<Account> {
    const [updated] = await db.update(accounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updated;
  }

  async updateAccountBalance(id: string, balance: string): Promise<Account> {
    const [updated] = await db.update(accounts)
      .set({ balance, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updated;
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async getJournalEntriesByCompany(companyId: string, limit = 50): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.companyId, companyId))
      .orderBy(desc(journalEntries.date))
      .limit(limit);
  }

  async createJournalEntry(entry: InsertJournalEntry, lines: Omit<InsertJournalEntryLine, 'journalEntryId'>[]): Promise<JournalEntry> {
    return await db.transaction(async (tx) => {
      const [newEntry] = await tx.insert(journalEntries).values(entry).returning();
      
      const linesWithEntryId = lines.map(line => ({
        ...line,
        journalEntryId: newEntry.id
      }));
      
      await tx.insert(journalEntryLines).values(linesWithEntryId);
      
      // Update account balances using transaction-scoped queries
      for (const line of lines) {
        const [account] = await tx.select().from(accounts).where(eq(accounts.id, line.accountId));
        if (account) {
          const currentBalance = parseFloat(account.balance);
          const debit = parseFloat(line.debitAmount || '0');
          const credit = parseFloat(line.creditAmount || '0');
          
          let newBalance = currentBalance;
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            newBalance += debit - credit;
          } else {
            newBalance += credit - debit;
          }
          
          await tx.update(accounts)
            .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, account.id));
        }
      }
      
      return newEntry;
    });
  }

  async getJournalEntryWithLines(id: string): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] } | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    if (!entry) return undefined;

    const lines = await db.select().from(journalEntryLines)
      .where(eq(journalEntryLines.journalEntryId, id))
      .orderBy(journalEntryLines.debitAmount);

    return { entry, lines };
  }

  async updateJournalEntry(id: string, entryUpdates: Partial<InsertJournalEntry>, newLines: Omit<InsertJournalEntryLine, 'journalEntryId'>[]): Promise<JournalEntry> {
    return await db.transaction(async (tx) => {
      // Get the existing entry with lines for account balance reversal using transaction-scoped queries
      const [existingEntry] = await tx.select().from(journalEntries).where(eq(journalEntries.id, id));
      if (!existingEntry) {
        throw new Error('Journal entry not found');
      }

      const existingLines = await tx.select().from(journalEntryLines)
        .where(eq(journalEntryLines.journalEntryId, id));

      // Reverse the old account balance changes using transaction-scoped queries
      for (const line of existingLines) {
        const [account] = await tx.select().from(accounts).where(eq(accounts.id, line.accountId));
        if (account) {
          const currentBalance = parseFloat(account.balance);
          const debit = parseFloat(line.debitAmount || '0');
          const credit = parseFloat(line.creditAmount || '0');
          
          let newBalance = currentBalance;
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            newBalance -= debit - credit; // Reverse the original change
          } else {
            newBalance -= credit - debit; // Reverse the original change
          }
          
          await tx.update(accounts)
            .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, account.id));
        }
      }

      // Update the journal entry
      const [updatedEntry] = await tx.update(journalEntries)
        .set({ ...entryUpdates, updatedAt: new Date() })
        .where(eq(journalEntries.id, id))
        .returning();

      // Delete old lines
      await tx.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, id));

      // Insert new lines
      const linesWithEntryId = newLines.map(line => ({
        ...line,
        journalEntryId: id
      }));
      
      await tx.insert(journalEntryLines).values(linesWithEntryId);

      // Apply new account balance changes using transaction-scoped queries
      for (const line of newLines) {
        const [account] = await tx.select().from(accounts).where(eq(accounts.id, line.accountId));
        if (account) {
          const currentBalance = parseFloat(account.balance);
          const debit = parseFloat(line.debitAmount || '0');
          const credit = parseFloat(line.creditAmount || '0');
          
          let newBalance = currentBalance;
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            newBalance += debit - credit;
          } else {
            newBalance += credit - debit;
          }
          
          await tx.update(accounts)
            .set({ balance: newBalance.toFixed(2), updatedAt: new Date() })
            .where(eq(accounts.id, account.id));
        }
      }

      return updatedEntry;
    });
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContactsByCompany(companyId: string, type?: string): Promise<Contact[]> {
    const conditions = [eq(contacts.companyId, companyId)];
    if (type) {
      conditions.push(eq(contacts.type, type));
    }
    
    return await db.select().from(contacts)
      .where(and(...conditions))
      .orderBy(contacts.name);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await db.update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByCompany(companyId: string, limit = 50): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.issueDate))
      .limit(limit);
  }

  async createInvoice(invoice: InsertInvoice, lines: InsertInvoiceLine[]): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values(invoice).returning();
      
      const linesWithInvoiceId = lines.map(line => ({
        ...line,
        invoiceId: newInvoice.id
      }));
      
      await tx.insert(invoiceLines).values(linesWithInvoiceId);
      
      return newInvoice;
    });
  }

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const [updated] = await db.update(invoices)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async getExpensesByCompany(companyId: string, limit = 50): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(eq(expenses.companyId, companyId))
      .orderBy(desc(expenses.date))
      .limit(limit);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpenseStatus(id: string, status: string): Promise<Expense> {
    const [updated] = await db.update(expenses)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return updated;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByCompany(companyId: string, limit = 50): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.companyId, companyId))
      .orderBy(desc(payments.date))
      .limit(limit);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<ExchangeRate | undefined> {
    const conditions = [
      eq(exchangeRates.fromCurrency, fromCurrency),
      eq(exchangeRates.toCurrency, toCurrency)
    ];
    
    if (date) {
      conditions.push(lte(exchangeRates.date, date));
    }
    
    const [rate] = await db.select().from(exchangeRates)
      .where(and(...conditions))
      .orderBy(desc(exchangeRates.date))
      .limit(1);
    
    return rate || undefined;
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates)
      .orderBy(desc(exchangeRates.date));
  }

  async createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    const [newRate] = await db.insert(exchangeRates).values(rate).returning();
    return newRate;
  }

  async getTaxRate(id: string): Promise<TaxRate | undefined> {
    const [taxRate] = await db.select().from(taxRates).where(eq(taxRates.id, id));
    return taxRate || undefined;
  }

  async getTaxRatesByCompany(companyId: string): Promise<TaxRate[]> {
    return await db.select().from(taxRates)
      .where(eq(taxRates.companyId, companyId))
      .orderBy(taxRates.name);
  }

  async createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate> {
    const [newTaxRate] = await db.insert(taxRates).values(taxRate).returning();
    return newTaxRate;
  }

  async updateTaxRate(id: string, taxRate: Partial<InsertTaxRate>): Promise<TaxRate> {
    const [updated] = await db.update(taxRates)
      .set({ ...taxRate, updatedAt: new Date() })
      .where(eq(taxRates.id, id))
      .returning();
    return updated;
  }

  async getFinancialMetrics(companyId: string): Promise<{
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    cashBalance: string;
  }> {
    // Get accounts by type
    const accountsData = await db.select().from(accounts)
      .where(eq(accounts.companyId, companyId));
    
    const revenueAccounts = accountsData.filter(a => a.type === 'REVENUE');
    const expenseAccounts = accountsData.filter(a => a.type === 'EXPENSE');
    const assetAccounts = accountsData.filter(a => a.type === 'ASSET' && a.name.toLowerCase().includes('cash'));
    
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const netProfit = totalRevenue - totalExpenses;
    const cashBalance = assetAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netProfit: netProfit.toFixed(2),
      cashBalance: cashBalance.toFixed(2),
    };
  }

  async getRecentTransactions(companyId: string, limit = 10): Promise<any[]> {
    const entries = await db.select({
      id: journalEntries.id,
      date: journalEntries.date,
      description: journalEntries.description,
      totalAmount: journalEntries.totalAmount,
    }).from(journalEntries)
      .where(eq(journalEntries.companyId, companyId))
      .orderBy(desc(journalEntries.date))
      .limit(limit);
    
    return entries;
  }

  async getAccountBalances(companyId: string): Promise<{
    assets: string;
    liabilities: string;
    equity: string;
    revenue: string;
    expenses: string;
  }> {
    const accountsData = await db.select().from(accounts)
      .where(eq(accounts.companyId, companyId));
    
    const assets = accountsData.filter(a => a.type === 'ASSET').reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const liabilities = accountsData.filter(a => a.type === 'LIABILITY').reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const equity = accountsData.filter(a => a.type === 'EQUITY').reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const revenue = accountsData.filter(a => a.type === 'REVENUE').reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const expenses = accountsData.filter(a => a.type === 'EXPENSE').reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    
    return {
      assets: assets.toFixed(2),
      liabilities: liabilities.toFixed(2),
      equity: equity.toFixed(2),
      revenue: revenue.toFixed(2),
      expenses: expenses.toFixed(2),
    };
  }
}

export const storage = new DatabaseStorage();
