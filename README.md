# Electronic Home Appliance Retail Management ERP & POS System
### A Cloud-Connected Retail Management Platform for Electronics and Home Appliances

Built specifically for electronic appliance retail businesses (selling Smart TVs, Inverter ACs, Washing Machines, Refrigerators, Microwave Ovens, Induction Cooktops, Kitchen & Home Care Appliances).

---

## 🚀 Key Highlights & Architectural Features

1. **Frontend-Only Cloud Architecture**:
   - Zero VPS / dedicated server requirement.
   - Hosted at GitHub Pages (`https://username.github.io/repositoryname/`) with relative asset links, SPA route fallback, and service workers.
   - Powered by **Supabase PostgreSQL**, **Supabase Auth**, and **Supabase Storage**.
   - Built-in **Standalone / Demo Mode fallback** ensuring the app works instantly out-of-the-box before cloud credentials are even added.

2. **Atomic Financial & Stock Transactions**:
   - Database-level stored procedures and RPCs (`process_pos_sale`, `process_purchase_invoice`, `process_sales_return`, `get_dashboard_metrics`).
   - Atomically records sale invoices, deducts product current stock, logs stock movement audit trails, updates serialized status to `'sold'`, issues warranty cards, updates customer receivables balance, and records deposit to cash/bank accounts in a single database transaction.

3. **Serial Number (S/N) Lifecycle Tracking**:
   - Appliance serials track from consignment receiving (GRN) $\rightarrow$ showroom inventory $\rightarrow$ POS sale checkout $\rightarrow$ warranty activation $\rightarrow$ customer service tickets.
   - Supports both serialized appliances (TVs, ACs, Washers, Fridges) and quantity-based items (induction cooktops, small accessories).

4. **Nepal Market Localization**:
   - **Default Currency**: NPR (Nepalese Rupee `रू`).
   - **South Asian Lakh/Crore grouping**: e.g. `रू 1,25,000.00`.
   - **Dual Calendar**: Gregorian (AD) and Bikram Sambat (BS) date display (e.g. `2026-11-07 (22 Kartik 2083 BS)`).
   - **Nepal VAT (13%) & PAN**: Standard 13% VAT calculation on taxable goods, 9-digit PAN validation for customers and distributors.
   - **Timezone**: Asia/Kathmandu.

5. **Invoice & Receipt Printing**:
   - **A4 Tax Invoice**: Conforms to standard retail tax invoice conventions with customer details, PAN number, serial numbers per line item, VAT breakdown, warranty terms, and authorized signatory seals.
   - **80mm Thermal Receipt**: High-speed counter thermal POS slip.
   - **58mm Thermal Receipt**: Compact thermal format for portable/mobile printers.
   - **1-Click Excel (.xlsx) & CSV Exports** for all catalog, inventory, sales, customer ledgers, and VAT tax registers.

6. **Role-Based Access Control (RBAC)**:
   - Configurable user roles:
     - **Owner / Admin**: Full permissions, system configuration, database settings.
     - **Manager**: Sales, inventory, purchasing, financials, service tickets.
     - **Cashier**: POS fast checkout, customer billing, receipt printing.
     - **Storekeeper**: GRN receiving, stock movements, serial auditing, adjustments.
     - **Accountant**: Cash accounts, expense vouchers, ledgers, tax & profit reports.

7. **Progressive Web Application (PWA)**:
   - Web manifest, icons, service worker caching for offline shell access and connection state indicator.

---

## 🛠️ Technology Stack

- **Framework**: React 18 / 19 with TypeScript (Strict mode)
- **Bundler & Tooling**: Vite + PostCSS + Tailwind CSS + Lucide Icons
- **State & Data Fetching**: TanStack React Query (`@tanstack/react-query`)
- **Backend / Database**: Supabase PostgreSQL (Row Level Security & Atomic Stored Procedures)
- **Analytics & Charts**: Recharts
- **PWA**: `vite-plugin-pwa` with Workbox offline cache
- **Spreadsheet Engine**: `xlsx` (SheetJS)

---

## 📁 Feature-Based Folder Structure

```
src/
├── types/                # Strict domain interfaces (Product, Sale, Serial, Warranty, etc.)
├── lib/
│   ├── supabase.ts       # Supabase client + persistent fallback repository
│   ├── nepaliDate.ts     # Bikram Sambat (BS) date converter & formatter
│   ├── currency.ts       # NPR Lakh/Crore formatter, 13% VAT & PAN validator
│   ├── mockData.ts       # Realistic appliance catalog & store seed data
│   └── utils.ts          # ClassNames, Excel (.xlsx) & CSV exporters
├── context/
│   ├── AuthContext.tsx   # User profile & role-based permission gates
│   ├── SettingsContext.tsx # Store settings & Supabase cloud config modal
│   └── ThemeContext.tsx  # Light / dark theme persistence
├── components/
│   ├── ui/               # Button, Input, Modal, Badge, StatCard
│   ├── layout/           # Sidebar, Navbar, MobileNav
│   ├── print/            # A4TaxInvoice, ThermalReceipt (80mm & 58mm)
│   └── common/           # BarcodeScannerModal, SerialPickerModal, DatabaseConfigModal
├── features/
│   ├── dashboard/        # Operational KPIs, Recharts sales trend & inventory valuation
│   ├── pos/              # High-speed POS terminal, cart, barcode scanner, serial picker
│   ├── products/         # Product catalog, models, SKUs, specifications
│   ├── inventory/        # Physical stock balances, serials registry, audit movements
│   ├── purchases/        # Consignment receiving (GRN), bills, serial intake
│   ├── customers/        # Customer directory, PAN, receivables ledger
│   ├── suppliers/        # Distributor directory, payables ledger, disbursements
│   ├── warranties/       # Serial warranty tracking & repair service desk
│   ├── finance/          # Cash & bank accounts, showroom expenses, cashbook
│   ├── reports/          # Sales register, IRD 13% VAT returns, P&L statement
│   └── settings/         # Store branding, VAT %, printer layout, Supabase setup
├── App.tsx
├── main.tsx
└── index.css
```

---

## ⚡ Quick Start

### 1. Installation
```bash
git clone https://github.com/username/repositoryname.git
cd repositoryname
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## ☁️ Connecting Supabase PostgreSQL

1. Create a free project on [Supabase](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, paste the entire SQL script, and click **Run**.
   - This sets up all 20+ tables, relations, check constraints, RLS policies, atomic functions (`process_pos_sale`, `process_purchase_invoice`, `get_dashboard_metrics`), and appliance seed data.
4. Copy your **Project URL** and **Anon Public Key** from Supabase Dashboard $\rightarrow$ **Project Settings** $\rightarrow$ **API**.
5. In the ElectroStore application, click the **Database Status Pill** in the top navigation bar or go to **Settings & Cloud DB**, enter the URL & Key, and click **Save & Connect**.

---

## 🌐 GitHub Pages Deployment

The application is pre-configured for GitHub Pages:
- Vite `base: './'` supports running under `https://username.github.io/repositoryname/`.
- `public/404.html` SPA redirection script preserves deep route refreshes.
- Automated deployment via `.github/workflows/deploy.yml`.

To deploy:
1. Push code to the `main` branch on GitHub.
2. Go to **Settings** $\rightarrow$ **Pages** in your repository.
3. Under **Source**, select **GitHub Actions**.
4. The workflow will build and publish your site automatically.
