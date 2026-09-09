# BizFlow Business Manager

A GitHub-ready, browser-based business management system inspired by the feature set of Indian GST billing/inventory applications.

## Included

- Dashboard and business KPIs
- Sales invoices / POS-style billing
- Purchase invoices
- Products & inventory
- Low-stock alerts
- Batch / expiry fields
- Parties: customers and suppliers
- Quotations
- Sales orders and purchase orders
- Delivery challans
- Expenses and other income
- Cash & bank transactions
- GST-ready tax calculation
- GSTR-1 / GSTR-3B style summary reports
- Profit & Loss
- Stock, sales, purchase and party reports
- Payment / outstanding tracking
- Payment reminders
- Invoice printing
- CSV export
- Full JSON backup / restore
- User/role settings
- Invoice customization settings
- Online-store/catalog mock
- Barcode generator UI
- Offline-first localStorage database
- Responsive desktop/tablet/mobile UI

## Run locally

No build step is required.

1. Download/clone the repository.
2. Open `index.html` in a modern browser.

For GitHub Pages:

1. Create a GitHub repository.
2. Upload all files/folders from this project.
3. Go to **Settings → Pages**.
4. Select the main branch and `/root` folder.
5. Save.

## Important

This is a working front-end/offline prototype. Data is stored in the browser's localStorage. It does not connect to GSTN, banking networks, UPI gateways, WhatsApp APIs, e-invoice APIs, SMS providers, printers, or a real cloud database.

Those integrations require backend services, API credentials, authentication, security controls and production infrastructure.

The UI and implementation are original and do not copy Vyapar's source code, trademarks, proprietary assets, or branding.
