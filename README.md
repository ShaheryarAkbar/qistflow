# QistFlow (قسط فلو) — Bilingual Installment SaaS

> **A high-performance, bilingual (English & Urdu Nastaliq) installment management SaaS tailored for retail shops in Rahim Yar Khan, Khanpur, Sadiqabad, and across Pakistan.**
> Engineered with a strict **Zero-Cost Free-Only Guarantee** (Firebase Spark Free Tier + GitHub Pages Hosting).

---

## 🌟 Key Highlights & Design Principles

- **100% Free-Tier Architecture:** Built strictly within the bounds of Firebase Spark (Free Tier) and GitHub Pages ($0/mo). Zero paid Cloud Functions, zero Blaze billing, and zero paid SMS APIs.
- **Bilingual & RTL-First:** Native English (LTR) and Urdu (RTL) localization with automated font switching to *Noto Nastaliq Urdu* and layout mirroring.
- **Paisa-Precise Financial Arithmetic:** All financial computations (sales, down payments, installments, penalties, and discounts) are computed as integers in **Paisa (1 PKR = 100 Paisa)** to prevent IEEE 754 floating-point drift.
- **Multi-Tenant Scoping & Security:** Complete tenant data isolation under `/tenants/{tenantId}/...` enforced by production-grade Firestore Security Rules (`firestore.rules`).
- **Oldest-Due-First Allocation Engine:** Payments cascade systematically across scheduled installment entries, storing excess funds into `advance_credit`. Reversals follow strict double-entry ledger invariants.
- **Clearance Certificate Protection:** Clearance certificates are blocked from creation unless the contract has reached a strict 0-paisa remaining balance.
- **Role-Based Access Control (6 Views):** Strict role guards for:
  1. *Business Owner:* Full business governance, financial corrections, and shop settings.
  2. *Manager / Admin:* Day-to-day shop floor operations, POS, inventory, and staff provisioning.
  3. *Accountant:* Dedicated financial ledger, payments, expenses, and collection reports (no access to staff or shop settings).
  4. *Recovery Employee:* Restricted mobile-first field portal (only assigned customers, 1-tap call/WhatsApp, record collection; zero access to shop dashboard or profits).
  5. *Platform Super-Admin:* Multi-tenant shop directory, commercial plans, licensing management, and Spark health monitor.
  6. *Customer Portal (Future):* Customer passbook preview and digital receipt lookup.
- **Universal Quick Calculator:** Fast on-the-spot financial calculator for new installment plans, overdue balance clearance, and lump-sum cash split, complete with 1-click WhatsApp Urdu sharing.
- **Comprehensive Data Portability:** 1-click in-browser full ZIP backup bundling (JSZip), JSON v1 schema snapshots, and RFC 4180 CSV exports with UTF-8 BOM (`\uFEFF`) ensuring Urdu text opens correctly in Microsoft Excel.
- **Demo / Evaluation Mode:** 1-click instant login into an interactive sandbox shop with a dynamic role switcher (Owner, Manager, Accountant, Recovery Agent, Super-Admin).

---

## 🏗️ Architecture & Strict Free Constraints

| Component | Free Solution | Why Free & How It Works |
| :--- | :--- | :--- |
| **Hosting** | GitHub Pages | Static build output (`dist/`) hosted for free on GitHub Pages. |
| **Routing** | Hash / SPA 404 Trick | Single Page Application deep routes supported via `public/404.html` and hash routing. |
| **Backend & DB** | Firebase Spark (Firestore) | 50,000 free reads/day, 20,000 free writes/day, 1 GB storage. No credit card required. |
| **Authentication** | Firebase Auth | Free Email/Password and Anonymous authentication (up to 50,000 monthly active users). |
| **Business Logic** | Pure TypeScript Domain | Client-side financial allocator, schedule generator, and audit validator running in browser. |
| **Customer Comms** | Browser `tel:` & WhatsApp Web | Direct 1-tap WhatsApp (`https://wa.me/92...`) and phone calling from browser—no paid SMS gateway. |
| **Backups & ZIP** | In-Browser JSZip Engine | Client-side multi-file archiving and sandbox restoration drills without server costs. |

---

## 📁 Repository Structure

```text
qistflow/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Actions deployment to GitHub Pages
├── public/
│   └── 404.html                  # Deep-link routing redirect trick for GitHub Pages
├── src/
│   ├── app/                      # Application entry, router, and context providers
│   │   ├── providers/
│   │   │   ├── AuthContext.tsx   # Firebase Auth + 1-Click Demo Evaluation Mode
│   │   │   └── TenantContext.tsx # Multi-tenant scoping and active business context
│   │   └── router.tsx            # Protected client-side routes with role-based navigation
│   ├── components/               # Reusable UI components & layouts
│   │   ├── layout/               # Header, Sidebar, and AppLayout with Urdu RTL support
│   │   └── shared/               # MoneyDisplay, StatusBadge, Thermal Receipts, Certificates
│   ├── domain/                   # Pure, zero-dependency financial business logic
│   │   ├── money/                # Paisa conversion, formatting, and arithmetic
│   │   ├── schedules/            # Monthly clamp-to-last-day schedule generator
│   │   ├── payments/             # Oldest-due-first allocation and reversal engine
│   │   └── certificates/         # 0-paisa balance clearance invariant validator
│   ├── features/                 # Modular feature pages
│   │   ├── auth/                 # Login & Registration screens
│   │   ├── onboarding/           # New business / shop setup wizard
│   │   ├── dashboard/            # Executive overview with live KPI aggregation
│   │   ├── customers/            # Customer directory with CNIC & phone soft-warning
│   │   ├── products/             # Catalog management (cash vs installment pricing)
│   │   ├── inventory/            # Stock movements and audit trail
│   │   ├── suppliers/            # Supplier management & purchase orders
│   │   ├── sales/                # 3-step POS wizard with interactive schedule preview
│   │   ├── contracts/            # Active installment contract portfolio
│   │   ├── installments/         # Due & overdue collection sheet with quick-collect
│   │   ├── payments/             # Immutable financial ledger & payment reversal dialog
│   │   ├── recovery/             # Mobile-first field portal with 1-tap WhatsApp & phone
│   │   ├── expenses/             # Operational expense tracking & category breakdown
│   │   ├── reports/              # Financial summaries & recovery rate analytics
│   │   ├── staff/                # Team management & role-based permissions
│   │   ├── archives/             # Full ZIP bundling, CSV exports, & restore drills
│   │   └── settings/             # Shop profile, language switcher & preferences
│   ├── i18n/                     # Internationalization dictionaries (en.json, ur.json)
│   ├── lib/                      # In-browser export utilities (CSV, JSON, JSZip)
│   ├── repositories/             # Tenant-scoped Firestore data access layers
│   ├── services/                 # Firebase SDK initialization
│   ├── styles/                   # SCSS Design System (variables, RTL, components)
│   └── types/                    # Domain entity definitions matching Firestore design
├── tests/                        # Vitest unit and integration test suite
├── firebase.json                 # Firebase CLI configuration
├── firestore.rules               # Production tenant-isolated security rules
├── firestore.indexes.json        # Composite indexes for queries
└── vite.config.ts                # Vite build configuration with alias '@'
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Clone and Install
```bash
git clone https://github.com/your-username/qistflow.git
cd qistflow
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Tip:** You do not need Firebase credentials to explore! Click **"1-Click Demo Evaluation Mode"** on the login page to immediately test the system with pre-seeded sample data.

### 4. Run Test Suite
```bash
npm test
```
Runs 16 comprehensive unit and integration tests covering:
- Paisa integer conversions and formatting
- Schedule generation with month-end date clamping (Jan 31 $\rightarrow$ Feb 28)
- Oldest-due-first payment allocation
- Compensating payment reversal ledger integrity
- Clearance certificate balance validation
- RFC 4180 UTF-8 BOM CSV exports and JSZip archive bundle generation

### 5. Build for Production
```bash
npm run build
```
Generates an optimized static bundle in the `dist/` directory ready for deployment to GitHub Pages.

---

## 🔧 Connecting Firebase (Production Setup)

To connect your own free Firebase project:

1. Create a free project at [Firebase Console](https://console.firebase.google.com/) (Select the **Spark Free Plan**).
2. Enable **Firestore Database** (start in Test Mode or apply the rules below).
3. Enable **Authentication** with Email/Password provider.
4. Copy your project credentials and create a `.env` file at the root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Deploy the provided security rules and composite indexes:
```bash
npm install -g firebase-tools
firebase login
firebase use your_project_id
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 🌐 Deploying to GitHub Pages

This repository includes a preconfigured GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. Push your code to your GitHub repository:
```bash
git add .
git commit -m "feat: complete QistFlow application"
git push origin master
```

2. In your GitHub repository settings:
   - Navigate to **Settings** $\rightarrow$ **Pages**.
   - Under **Build and deployment**, set **Source** to **GitHub Actions**.

3. The automated workflow will:
   - Run all Vitest unit and integration tests.
   - Build the static Vite application.
   - Deploy directly to your free `https://<username>.github.io/<repo>/` URL.

---

## 📱 Field Recovery & Receipt Printing

- **Thermal 80mm Receipts:** Invoices, payment vouchers, and installment slips automatically format to standard 80mm thermal receipt rolls when printing (`Ctrl+P` / `Cmd+P`), hiding application headers and sidebars.
- **A4 Clearance Certificates:** Full clearance certificates print on formal A4 portrait layout with Urdu and English business endorsements.
- **Field Recovery Portal:** Optimized for mobile phones used by recovery officers in the field. Includes one-tap customer calling and pre-filled WhatsApp Urdu reminder messages:
  ```text
  السلام علیکم [کسٹمر نام]، آپ کی قسط برائے [آئٹم] مبلغ [رقم] واجب الادا ہے۔ براہ کرم دکان پر جمع کروائیں۔ شکریہ
  ```

---

## 📄 License & Compliance

Built for independent installment retailers in Pakistan under the MIT License. Strictly adheres to zero-cost, privacy-first, client-side data sovereignty principles.

