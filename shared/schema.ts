import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const accountingStandardEnum = pgEnum('accounting_standard', ['US_GAAP', 'IFRS']);
export const accountTypeEnum = pgEnum('account_type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export const transactionTypeEnum = pgEnum('transaction_type', ['DEBIT', 'CREDIT']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);
export const expenseStatusEnum = pgEnum('expense_status', ['DRAFT', 'PENDING', 'APPROVED', 'PAID']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'CHECK', 'CREDIT_CARD', 'BANK_TRANSFER', 'OTHER']);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default('user'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Companies table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  legalName: text("legal_name").notNull(),
  taxId: text("tax_id").notNull(),
  registrationNumber: text("registration_number"),
  address: jsonb("address").notNull(), // {street, city, state, country, postalCode}
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  accountingStandard: accountingStandardEnum("accounting_standard").notNull().default('US_GAAP'),
  baseCurrency: text("base_currency").notNull().default('USD'),
  fiscalYearEnd: text("fiscal_year_end").notNull().default('12-31'), // MM-DD format
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  parentId: varchar("parent_id"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0'),
  currency: text("currency").notNull().default('USD'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  entryNumber: text("entry_number").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entry Lines (for double-entry bookkeeping)
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  description: text("description"),
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  currency: text("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull().default('1'),
});

// Customers/Vendors
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: jsonb("address"), // {street, city, state, country, postalCode}
  taxId: text("tax_id"),
  type: text("type").notNull(), // 'customer' or 'vendor'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  customerId: varchar("customer_id").notNull().references(() => contacts.id),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: invoiceStatusEnum("status").notNull().default('DRAFT'),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  currency: text("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull().default('1'),
  terms: text("terms"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice Line Items
export const invoiceLines = pgTable("invoice_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull().default('0'),
  accountId: varchar("account_id").references(() => accounts.id),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  vendorId: varchar("vendor_id").references(() => contacts.id),
  expenseNumber: text("expense_number").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull().default('1'),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  status: expenseStatusEnum("status").notNull().default('DRAFT'),
  receipt: text("receipt"), // file path or URL
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USD'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull().default('1'),
  method: paymentMethodEnum("method").notNull(),
  reference: text("reference"),
  description: text("description"),
  fromAccountId: varchar("from_account_id").notNull().references(() => accounts.id),
  toAccountId: varchar("to_account_id").references(() => accounts.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  expenseId: varchar("expense_id").references(() => expenses.id),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exchange Rates
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  date: timestamp("date").notNull(),
  source: text("source").notNull().default('manual'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tax Rates
export const taxRates = pgTable("tax_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  rate: decimal("rate", { precision: 5, scale: 4 }).notNull(),
  type: text("type").notNull(), // 'sales', 'purchase', 'income', etc.
  jurisdiction: text("jurisdiction").notNull(),
  accountId: varchar("account_id").references(() => accounts.id),
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  journalEntries: many(journalEntries),
  invoices: many(invoices),
  expenses: many(expenses),
  payments: many(payments),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  createdBy: one(users, { fields: [companies.createdBy], references: [users.id] }),
  accounts: many(accounts),
  journalEntries: many(journalEntries),
  contacts: many(contacts),
  invoices: many(invoices),
  expenses: many(expenses),
  payments: many(payments),
  taxRates: many(taxRates),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, { fields: [accounts.companyId], references: [companies.id] }),
  parent: one(accounts, { fields: [accounts.parentId], references: [accounts.id] }),
  children: many(accounts),
  journalEntryLines: many(journalEntryLines),
  invoiceLines: many(invoiceLines),
  expenses: many(expenses),
  paymentsFrom: many(payments, { relationName: 'paymentFromAccount' }),
  paymentsTo: many(payments, { relationName: 'paymentToAccount' }),
  taxRates: many(taxRates),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, { fields: [journalEntries.companyId], references: [companies.id] }),
  createdBy: one(users, { fields: [journalEntries.createdBy], references: [users.id] }),
  lines: many(journalEntryLines),
  payments: many(payments),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, { fields: [journalEntryLines.journalEntryId], references: [journalEntries.id] }),
  account: one(accounts, { fields: [journalEntryLines.accountId], references: [accounts.id] }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
  invoices: many(invoices),
  expenses: many(expenses),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, { fields: [invoices.companyId], references: [companies.id] }),
  customer: one(contacts, { fields: [invoices.customerId], references: [contacts.id] }),
  createdBy: one(users, { fields: [invoices.createdBy], references: [users.id] }),
  lines: many(invoiceLines),
  payments: many(payments),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
  account: one(accounts, { fields: [invoiceLines.accountId], references: [accounts.id] }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  company: one(companies, { fields: [expenses.companyId], references: [companies.id] }),
  vendor: one(contacts, { fields: [expenses.vendorId], references: [contacts.id] }),
  account: one(accounts, { fields: [expenses.accountId], references: [accounts.id] }),
  createdBy: one(users, { fields: [expenses.createdBy], references: [users.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, { fields: [payments.companyId], references: [companies.id] }),
  fromAccount: one(accounts, { fields: [payments.fromAccountId], references: [accounts.id], relationName: 'paymentFromAccount' }),
  toAccount: one(accounts, { fields: [payments.toAccountId], references: [accounts.id], relationName: 'paymentToAccount' }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  expense: one(expenses, { fields: [payments.expenseId], references: [expenses.id] }),
  journalEntry: one(journalEntries, { fields: [payments.journalEntryId], references: [journalEntries.id] }),
  createdBy: one(users, { fields: [payments.createdBy], references: [users.id] }),
}));

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
  company: one(companies, { fields: [taxRates.companyId], references: [companies.id] }),
  account: one(accounts, { fields: [taxRates.accountId], references: [accounts.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJournalEntryLineSchema = createInsertSchema(journalEntryLines).omit({ id: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({ id: true, createdAt: true });
export const insertTaxRateSchema = createInsertSchema(taxRates).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type InsertJournalEntryLine = z.infer<typeof insertJournalEntryLineSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type TaxRate = typeof taxRates.$inferSelect;
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;
