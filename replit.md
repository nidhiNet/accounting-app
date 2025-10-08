# Overview

This is a comprehensive accounting software application built with a modern full-stack architecture. The application provides complete financial management capabilities including chart of accounts, journal entries, invoicing, expense tracking, payments, and financial reporting. It's designed to handle multi-company operations with support for different accounting standards (US GAAP and IFRS) and multi-currency functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **Routing**: wouter for client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with type-safe schema definitions
- **Database**: PostgreSQL (configured for Neon serverless)
- **API Design**: RESTful API with structured error handling
- **File Structure**: Shared schema between client and server for type safety

## Data Storage Solutions
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations in `migrations/` directory
- **Data Validation**: Zod schemas for runtime type checking and API validation

## Core Accounting Features
- **Chart of Accounts**: Hierarchical account structure with asset, liability, equity, revenue, and expense categories
- **Journal Entries**: Double-entry bookkeeping with automatic balance validation
- **Invoicing**: Customer billing with line items, tax calculations, and payment tracking
- **Expense Management**: Vendor expenses with receipt handling and approval workflows
- **Payment Processing**: Multi-method payment recording with reconciliation
- **Financial Reporting**: Balance sheet, income statement, and cash flow reports

## Multi-Company & Multi-Currency Support
- **Company Management**: Isolated data per company with configurable accounting standards
- **Currency Handling**: Base currency per company with exchange rate management
- **Localization**: Support for different fiscal year ends and tax jurisdictions

## Authentication & Authorization
- **User Management**: Role-based access control with company-level permissions
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple

## Development Workflow
- **Type Safety**: End-to-end TypeScript with shared types between client and server
- **Code Quality**: ESM modules, strict TypeScript configuration
- **Development Server**: Hot reload with Vite dev server integration
- **Build Process**: Vite for client bundle, esbuild for server bundle

# External Dependencies

## Database & ORM
- **@neondatabase/serverless**: Serverless PostgreSQL driver for edge deployment
- **drizzle-orm**: Type-safe ORM with migration support
- **connect-pg-simple**: PostgreSQL session store for Express

## Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility
- **wouter**: Lightweight React routing
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Zod integration for form validation

## UI & Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variants system
- **clsx**: Conditional className utility
- **embla-carousel-react**: Carousel component

## Utilities & Validation
- **zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds

## Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation
- **@replit/vite-plugin-dev-banner**: Development environment indicator