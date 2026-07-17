# Crane CMS

A crane rental management system — client management, order workflow,
invoicing, and account statements.

**Modules:** Authentication (role-based approval) · Client Management (CRM)
· Order Management · Invoicing · Statement of Account.

**Stack:** React (Vite) + Tailwind CSS on the frontend, Node/Express +
PostgreSQL on the backend.

## Setup

```bash
# 1. Database
psql -U postgres -c "CREATE DATABASE crane_cms;"
psql -U postgres -d crane_cms -f server/schema.sql

# 2. Server
cd server
npm install
cp .env.example .env   # edit DATABASE_URL / JWT_SECRET
node src/seed.js       # optional: adds demo data
npm run dev            # http://localhost:4000

# 3. Client
cd client
npm install
npm run dev            # http://localhost:5173
```

## Demo logins (after seeding)

| Role      | Email                 | Password    |
|-----------|-----------------------|-------------|
| admin     | admin@crane.test      | password123 |
| sales     | sales@crane.test      | password123 |
| finance   | finance@crane.test    | password123 |
| operation | operation@crane.test  | password123 |
| customer  | customer@crane.test   | password123 |
