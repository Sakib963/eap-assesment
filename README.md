# Smart Inventory & Order Management System

A comprehensive full-stack web application for managing products, inventories, customer orders, and intelligent restock workflows with real-time status tracking and conflict prevention.

**Status**: Production Ready | **Version**: 1.0.0

---

## 📋 Table of Contents

1. [Features Overview](#features-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Setup & Installation](#setup--installation)
5. [Running the Application](#running-the-application)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Deployment Guide](#deployment-guide)
9. [Development Workflow](#development-workflow)

---

## 🎯 Features Overview

### 1. **Authentication & Authorization**
- User signup and login with email/password
- JWT-based stateless authentication (24h expiry)
- Role-based access control (Manager, Salesman)
- Demo login for quick access (`demo@inventory.local` / `demo123`)
- Forgot password with OTP flow

### 2. **Product & Category Management**
- Create, read, update, delete (CRUD) categories
- Manage products with stock tracking
- Product status mapping: `Active`, `Out of Stock`, `Inactive`
- Automatic status derivation from `is_active` flag and current stock
- Category filtering for product discovery

### 3. **Order Management**
- Multi-item order creation with quantity tracking
- Duplicate item prevention (same product can't appear twice)
- Real-time stock availability validation
- Transactional stock deduction (atomic, race-condition safe)
- Order status lifecycle: `Pending → Confirmed → Shipped → Delivered` or `Cancelled`
- Order cancellation restores inventory
- Role-scoped order access (Salesmen see only their orders)

### 4. **Intelligent Restock Queue**
- Automatic queue population when stock falls below threshold
- Priority calculation: **HIGH** (stock ≤ 0), **MEDIUM** (stock ≤ 50% of threshold), **LOW** (stock > 50%)
- Manual restock with auto-sync to queue
- Mark complete to remove from queue when threshold reached
- Activity logging for all restock actions

### 5. **Activity Audit Log**
- Comprehensive action tracking (order changes, stock updates, product creation)
- User attribution for all changes
- Async logging with fire-and-forget pattern (non-blocking)
- Latest 10 entries displayed on demand

### 6. **Dashboard & Analytics**
- Real-time KPI summary: Orders Today, Pending Orders, Low Stock Count, Revenue
- Daily analytics chart (bar chart visualization of metrics)
- Low stock alert table with priority indicators
- Role-scoped metrics (Salesmen see their sales data only)

---

## 🛠 Technology Stack

### **Backend**
| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 20.x |
| **Framework** | Express | 5.2.x |
| **Language** | TypeScript | 6.0.x |
| **Database** | PostgreSQL | 16.x |
| **Query Builder** | Knex.js | Latest |
| **Authentication** | JWT + bcryptjs | - |
| **Validation** | Zod | Latest |

### **Frontend**
| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Angular | 20.x |
| **Language** | TypeScript | 5.9.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **UI Components** | ng-zorro (Ant Design) | 20.4.x |
| **Build Tool** | Angular CLI | 20.x |
| **Charts** | Chart.js | Latest |

### **Infrastructure**
- **Backend Hosting**: Vercel (serverless)
- **Frontend Hosting**: Netlify (static + CDN)
- **Database**: Render PostgreSQL (free tier or paid)
- **Version Control**: Git

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Angular 20 SPA (Standalone Components)                   │  │
│  │  ├── Auth Module (Login, Signup, Forgot Password, OTP)   │  │
│  │  ├── Products Page (List, Create, Edit with Filters)     │  │
│  │  ├── Categories Page (CRUD - Manager Only)               │  │
│  │  ├── Orders (List, Create, View with Status Lifecycle)   │  │
│  │  ├── Restock Queue (Priority, Manual Restock)            │  │
│  │  ├── Dashboard (KPIs, Analytics Chart, Low Stock Table)  │  │
│  │  ├── Activity Log (Audit Trail, Latest 10)               │  │
│  │  └── Users (RBAC Management - Manager Only)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  UI Components: ng-zorro (Ant Design)                            │
│  Styling: Tailwind CSS v3.4                                      │
│  Charts: Chart.js (canvas-based)                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Express 5.2 REST API (TypeScript)                        │  │
│  │  ├── /api/v1/auth/* (Login, Signup, Forgot Password)     │  │
│  │  ├── /api/v1/categories/* (CRUD)                         │  │
│  │  ├── /api/v1/products/* (CRUD + List with Filters)       │  │
│  │  ├── /api/v1/orders/* (Create, List, Update Status)      │  │
│  │  ├── /api/v1/restock/* (List, Restock, Mark Complete)    │  │
│  │  ├── /api/v1/activity/* (Audit Trail)                    │  │
│  │  ├── /api/v1/users/* (RBAC Management)                   │  │
│  │  ├── /api/v1/dashboard/* (KPI Metrics)                   │  │
│  │  └── Health checks, error handling, async handlers       │  │
│  └───────────────────────────────────────────────────────────┘  │
│  Middleware: Auth (JWT), Validation (Zod), Error Handling       │
│  Response Format: Consistent { success, data, error } envelope  │
└─────────────────────────────────────────────────────────────────┘
                            ↕ Knex.js Query Builder
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                               │
│  PostgreSQL 16 on Render                                         │
│  ├── users (id, email, password_hash, name, phone, role, status)│
│  ├── categories (id, name, description)                         │
│  ├── products (id, name, category_id, price, stock, threshold)  │
│  ├── orders (id, customer_name, phone, items, status)           │
│  ├── order_items (id, order_id, product_id, qty, unit_price)    │
│  ├── restock_queue (id, product_id, priority, status)           │
│  ├── activity_logs (id, user_id, action, entity_type, entity_id)│
│  ├── password_reset_requests (id, email, otp_code, verified)    │
│  └── Migrations: 18 versioned SQL files (Knex)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Setup & Installation

### **Prerequisites**
- Node.js 20+ ([Download](https://nodejs.org/))
- npm 10+ (comes with Node.js)
- PostgreSQL 16+ ([Local](https://www.postgresql.org/) or [Render Cloud](https://render.com/))
- Git

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd eap-assesment
```

### **Step 2: Backend Setup**
```bash
cd services/inventory-api

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
LOG_LEVEL=debug
EOF

# Run migrations
npm run migrate:latest

# Seed database with demo data (optional)
npm run seed
```

### **Step 3: Frontend Setup**
```bash
cd ../inventory-web

# Install dependencies
npm install

# Create .env file (if needed)
cat > .env << 'EOF'
NG_APP_API_URL=http://localhost:5000/api/v1
EOF
```

---

## 🚀 Running the Application

### **Development Mode**

**Terminal 1: Backend**
```bash
cd services/inventory-api
npm run dev
# API running at http://localhost:5000
# Health check: http://localhost:5000/api/v1/health
```

**Terminal 2: Frontend**
```bash
cd services/inventory-web
npm start
# App opens at http://localhost:4200
# Demo credentials: demo@inventory.local / demo123
```

### **Production Build**

**Backend**
```bash
cd services/inventory-api
npm run build
npm start
```

**Frontend**
```bash
cd services/inventory-web
npm run build
# Build output: dist/frontend/
```

---

## 📡 API Documentation

### **Authentication**
```
POST /api/v1/auth/signup
  Body: { email, password, name, phone }
  Returns: { token, user }

POST /api/v1/auth/login
  Body: { email, password }
  Returns: { token, user }

POST /api/v1/auth/demo-login
  Returns: { token, user } (auto-creates demo user if needed)

GET /api/v1/auth/me
  Headers: { Authorization: Bearer <token> }
  Returns: { user }

POST /api/v1/auth/forgot-password
  Body: { email }
  Returns: { success }

POST /api/v1/auth/forgot-password/verify
  Body: { email, otp }
  Returns: { verified }

POST /api/v1/auth/forgot-password/reset
  Body: { email, otp, new_password }
  Returns: { success }
```

### **Products**
```
GET /api/v1/products?page=1&pageSize=10&search=&categoryId=&status=
  Returns: { items: Product[], total, page, pageSize }

GET /api/v1/products/:id
  Returns: { product }

POST /api/v1/products (Manager only)
  Body: { name, category_id, price, current_stock, min_stock_threshold, status }
  Returns: { product }

PUT /api/v1/products/:id (Manager only)
  Body: { name, category_id, price, current_stock, min_stock_threshold, status }
  Returns: { product }

DELETE /api/v1/products/:id (Manager only)
  Returns: { success }
```

### **Categories**
```
GET /api/v1/categories?page=1&pageSize=100
  Returns: { items: Category[], total }

POST /api/v1/categories (Manager only)
  Body: { name, description }
  Returns: { category }

PUT /api/v1/categories/:id (Manager only)
  Body: { name, description }
  Returns: { category }

DELETE /api/v1/categories/:id (Manager only)
  Returns: { success }
```

### **Orders**
```
GET /api/v1/orders?page=1&pageSize=10&status=&fromDate=&toDate=
  Returns: { items: Order[], total }
  Note: Salesman sees only their orders

GET /api/v1/orders/:id
  Returns: { order with items }

POST /api/v1/orders
  Body: {
    customer_name,
    customer_phone,
    customer_address,
    delivery_instruction,
    discount_amount,
    items: [{ product_id, quantity }]
  }
  Returns: { order }
  Validation: No duplicate products, stock availability, price calculation

PUT /api/v1/orders/:id/status
  Body: { status: 'pending|confirmed|shipped|delivered|cancelled' }
  Returns: { order }
  Side Effect: Cancellation restores stock

GET /api/v1/dashboard
  Returns: {
    orders_today,
    pending_orders,
    completed_orders,
    low_stock_count,
    revenue_today,
    low_stock_products
  }
```

### **Restock Queue**
```
GET /api/v1/restock?page=1&pageSize=10&status=&priority=
  Returns: { items: RestockQueueItem[], total }

POST /api/v1/restock/:id/restock
  Body: { quantity_added }
  Returns: { item }
  Side Effect: Auto-marks complete if threshold reached

PUT /api/v1/restock/:id/mark-complete
  Returns: { item }
```

### **Activity Log**
```
GET /api/v1/activity?limit=10
  Returns: { items: ActivityLogEntry[] }
```

---

## 🗄️ Database Schema

### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role 'manager' | 'salesman' DEFAULT 'salesman',
  status 'active' | 'inactive' DEFAULT 'active',
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **categories**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID FOREIGN KEY REFERENCES categories,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  current_stock INT DEFAULT 0,
  min_stock_threshold INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
-- Status is derived: ACTIVE = is_active AND stock > 0
--                    OUT_OF_STOCK = is_active AND stock = 0
--                    INACTIVE = NOT is_active
```

### **orders**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY REFERENCES users,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT,
  delivery_instruction TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  subtotal_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status 'pending'|'confirmed'|'shipped'|'delivered'|'cancelled' DEFAULT 'pending',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **restock_queue**
```sql
CREATE TABLE restock_queue (
  id UUID PRIMARY KEY,
  product_id UUID FOREIGN KEY REFERENCES products,
  quantity_needed INT NOT NULL,
  priority 'low'|'medium'|'high',
  status 'pending'|'completed' DEFAULT 'pending',
  current_stock INT,
  min_stock_threshold INT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
-- Priority: HIGH = stock ≤ 0
--           MEDIUM = stock ≤ 50% of threshold
--           LOW = stock > 50% of threshold
```

### **activity_logs**
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY REFERENCES users,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP
);
```

---

## 🌐 Deployment Guide

### **Backend: Vercel**

1. **Create Vercel Account** ([vercel.com](https://vercel.com))
2. **Connect Repository**
   - Link your GitHub repo to Vercel
   - Vercel auto-detects the project
3. **Configure Environment**
   ```
   PROJECT_ROOT: services/inventory-api
   BUILD_COMMAND: npm run build
   START_COMMAND: node dist/server.js
   ```
4. **Set Environment Variables**
   - `DATABASE_URL`: Your Render PostgreSQL connection string
   - `JWT_SECRET`: Secure random string (min 32 chars)
   - `NODE_ENV`: production
5. **Deploy**
   - Push to main branch, Vercel auto-deploys
   - Get your API URL: `https://your-project.vercel.app/api/v1`

### **Frontend: Netlify**

1. **Create Netlify Account** ([netlify.com](https://netlify.com))
2. **Connect Repository**
   - Link your GitHub repo to Netlify
3. **Configure Build**
   ```
   Base directory: services/inventory-web
   Build command: npm run build
   Publish directory: dist/frontend
   ```
4. **Set Environment Variables**
   - `NG_APP_API_URL`: Your Vercel API URL (e.g., `https://your-api.vercel.app/api/v1`)
5. **Deploy**
   - Push to main branch, Netlify auto-deploys
   - Get your app URL: `https://your-project.netlify.app`

### **Database: Render PostgreSQL**

1. **Create Render Account** ([render.com](https://render.com))
2. **Create PostgreSQL Service**
   - Select "PostgreSQL" from dashboard
   - Free tier available (limited resources)
3. **Get Connection String**
   - Use the "Internal Database URL" (if on same region)
   - Format: `postgresql://user:password@host:port/dbname`
4. **Run Migrations**
   ```bash
   DATABASE_URL="your-render-url" npm run migrate:latest
   ```

---

## 💻 Development Workflow

### **Project Structure**
```
eap-assesment/
├── services/
│   ├── inventory-api/
│   │   ├── src/
│   │   │   ├── app.ts (Express app setup)
│   │   │   ├── server.ts (Server entry point)
│   │   │   ├── config/ (Environment, Database)
│   │   │   ├── controllers/ (HTTP handlers)
│   │   │   ├── services/ (Business logic)
│   │   │   ├── routes/ (API endpoints)
│   │   │   ├── schemas/ (Zod validation)
│   │   │   ├── middleware/ (Auth, Error, Validation)
│   │   │   ├── database/
│   │   │   │   ├── migrations/ (SQL versioning)
│   │   │   │   ├── seeds/ (Demo data)
│   │   │   │   └── helpers.ts (Query helpers)
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── knexfile.ts
│   │
│   └── inventory-web/
│       ├── src/
│       │   ├── app/ (Root component)
│       │   ├── features/ (Feature modules)
│       │   │   ├── auth/ (Login, Signup, Forgot Password)
│       │   │   ├── products/ (Product management)
│       │   │   ├── categories/ (Category management)
│       │   │   ├── orders/ (Order management)
│       │   │   ├── restock/ (Restock queue)
│       │   │   ├── dashboard/ (Analytics)
│       │   │   └── activity/ (Audit log)
│       │   ├── core/ (Services, Models, Guards)
│       │   │   ├── services/ (HTTP, Auth, Catalog, Orders)
│       │   │   ├── models/ (TypeScript interfaces)
│       │   │   ├── interceptors/ (HTTP error handling)
│       │   │   └── guards/ (Route protection)
│       │   ├── shared/ (Reusable components)
│       │   │   ├── components/ (Data List, Filter Panel)
│       │   │   └── validators/
│       │   └── styles/ (Global CSS)
│       ├── package.json
│       ├── angular.json
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       └── karma.conf.js
│
├── shared/
│   ├── types.ts (Shared interfaces)
│   └── phone.ts (Phone validation)
│
├── README.md (This file)
├── vercel.json (Backend deployment)
├── netlify.toml (Frontend deployment)
└── package.json (Root workspace)
```

### **Key Design Patterns**

**1. Signals for State Management** (Angular 20)
- Reactive state with `signal()`, `computed()`
- No RxJS subscribe hell
- Change detection automatic

**2. Standalone Components**
- No NgModule boilerplate
- Tree-shakable bundle
- Cleaner imports

**3. Middleware Pipeline** (Express)
- Auth → Validation → Handler → Error Handling
- Async error wrapping prevents crashes
- Consistent response format

**4. Database Transactions**
- Stock deduction is atomically locked with `FOR UPDATE`
- Order cancellation restores inventory transactionally
- Race conditions prevented with row-level locking

**5. Activity Logging as Fire-and-Forget**
- Async logging with `void` operator
- Doesn't block main request flow
- Failures logged but don't crash app

**6. Role-Based Filtering**
- Manager: Full CRUD on categories, products
- Salesman: Read categories, own orders only
- Filter applied at route + database level

---

## 🧪 Testing

### **Manual Testing (Recommended)**
1. Use the demo login for quick access
2. Create test orders, track inventory
3. Test role-based access by switching users
4. Verify restock queue auto-sync after stock changes

### **Key Test Scenarios**
- ✅ Login with non-existent email (should show "Invalid email or password")
- ✅ Forgot password flow with OTP validation
- ✅ Create order with duplicate products (should fail)
- ✅ Create order with out-of-stock items (should fail)
- ✅ Cancel order and verify stock restoration
- ✅ Restock item and verify queue mark-complete
- ✅ Salesman cannot access category management
- ✅ Salesman can filter products by category

---

## 📝 Notes

- **Demo Account**: Email: `demo@inventory.local` | Password: `demo123`
- **OTP for Forgot Password**: Default is `1234` (demo/dev only)
- **Database Migration**: Run `npm run migrate:latest` after pulling schema changes
- **Error Messages**: Backend sends user-friendly messages; frontend properly displays them
- **Charts**: Dashboard includes Chart.js visualization of daily metrics

---

## 📞 Support

For issues or questions:
1. Check logs: `npm run dev` (backend) or browser console (frontend)
2. Verify environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check API health: `GET /api/v1/health`

---

**Last Updated**: April 2026  
**License**: Proprietary  
**Author**: EAP Assessment Team
