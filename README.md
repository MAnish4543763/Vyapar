# BizFlow — Full-Stack Business Management System

A complete starter application for a small-business ERP/accounting workflow. It is inspired by common business-management features, but is not affiliated with Vyapar and does not copy its branding.

## Stack
- Node.js
- Express
- SQLite via better-sqlite3
- bcryptjs password hashing
- express-session authentication
- HTML/CSS/JavaScript frontend

## Features
- User registration and login
- Session authentication
- Dashboard KPIs
- Products and inventory
- Low-stock tracking
- Customers and receivables
- Suppliers and payables
- Sales invoices
- Invoice line items
- Automatic stock deduction after invoice creation
- Purchases and automatic stock addition
- Expenses
- Reports and profit calculation
- Search/filtering
- Responsive UI
- SQLite database created automatically
- Demo data on first run

## Run on Windows
Install Node.js LTS first.

Open a terminal inside this folder:

```bash
npm install
npm start
```

Then open:

http://localhost:3000

### Demo account
Email:
`admin@bizflow.local`

Password:
`admin123`

## GitHub
Upload the whole project, including:
- package.json
- server.js
- public/
- data/ (the database is generated automatically)

Do NOT commit a production session secret. Set:
`SESSION_SECRET=your-long-random-secret`

## Important
This is a functional full-stack starter, not a production accounting/tax system. Before real business use, add:
- PostgreSQL/MySQL for production
- CSRF protection
- secure production session store
- HTTPS
- role/permission system
- audit logs
- proper double-entry accounting
- GST rules and filing validation
- invoice PDF generation
- backups
- data encryption and recovery
- validation and rate limiting
- cloud deployment
