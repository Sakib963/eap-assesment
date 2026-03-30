# Smart Inventory System - Implementation Checklist

**Repository Structure (Option B - Domain-Based Monorepo)**:
```
eap-assesment/
├── services/
│   ├── inventory-web/          ← Frontend (Angular 20, Tailwind)
│   │   ├── src/
│   │   ├── angular.json
│   │   ├── package.json
│   │   └── ...
│   └── inventory-api/          ← Backend (Express, TypeScript)
│       ├── src/
│       ├── package.json
│       └── ...
├── shared/
│   └── types.ts                ← Shared TypeScript interfaces
├── vercel.json                 ← Backend deployment config
├── netlify.toml                ← Frontend deployment config
├── .env.example                ← Environment template
├── TASKS.md                    ← This file
└── context/                    ← Requirements
```

**Deployment Strategy**:
- **Frontend**: Netlify (static build) - Push to GitHub, auto-deploys on main
- **Backend**: Vercel (Node.js runtime) - Push to GitHub, auto-deploys on main
- **Database**: Render PostgreSQL (managed, SSL required)
- **CI/CD**: GitHub Actions (prepare only, manual trigger for now)

Status legend: Not Started, In Progress, Blocked, Done

## Phase -1 - Repository Structure & Task Tracking (Do First)
- [x] Create a repository task tracker file: `TASKS.md`
- [x] Copy the full phase checklist into `TASKS.md`
- [x] Add status legend (Not Started / In Progress / Blocked / Done)
- [x] Commit this checklist file before coding starts

## Phase 0 - Setup
- [x] Create frontend app (Angular 20 standalone)
- [x] Create backend app (Express + TypeScript)
- [x] Configure TailwindCSS in frontend
- [x] Configure shared environment strategy (dev/prod)
- [x] Add health endpoint wiring from frontend to backend
- [x] Verify frontend and backend both run locally

## Phase 1 - Database First (Render PostgreSQL) ✅
- [x] Set up migration tooling (Knex.js) in backend
- [x] Add migration: users table (auth)
- [x] Add migration: categories table (product grouping)
- [x] Add migration: products table (inventory with stock tracking)
- [x] Add migration: orders table (order headers)
- [x] Add migration: order_items table (order line items, unique constraint)
- [x] Add migration: restock_queue table (auto-restock with priority)
- [x] Add migration: activity_logs table (audit trail with JSONB details)
- [x] Add foreign key constraints and CASCADE/RESTRICT rules
- [x] Add performance indexes for queries (status+date, priority, stock level)
- [x] Add seed script with demo user, 4 categories, 11 products, 3 orders
- [x] Add connection pooling (min: 2, max: 10) for production
- [x] Update health endpoint to check database connectivity
- [x] Document schema in DATABASE.md

## Phase 2 - Backend Platform
- [x] Implement DB connection pool with SSL required
- [x] Implement global error handler
- [x] Implement request validation middleware
- [x] Implement JWT auth middleware
- [x] Implement unified API response/error format
- [x] Add DB-aware health check endpoint

## Phase 3 - Authentication
- [x] Implement signup endpoint
- [x] Implement login endpoint
- [x] Implement demo login endpoint
- [x] Implement current-user endpoint (me)
- [x] Implement Angular auth service and route guards
- [x] Add login redirect to dashboard
- [x] Add demo login button with prefilled credentials

## Phase 4 - Categories and Products
- [ ] Implement category CRUD
- [ ] Implement product CRUD with required fields
- [ ] Add product status support: Active / Out of Stock
- [ ] Add listing filters and pagination
- [ ] Add frontend forms and validations

## Phase 5 - Stock Rules and Restock Queue
- [ ] Auto-mark product Out of Stock when stock reaches zero
- [ ] Auto-add low stock products to restock queue
- [ ] Calculate and store restock priority (High/Medium/Low)
- [ ] Order queue by lowest stock first
- [ ] Remove product from queue once restocked

## Phase 6 - Order Management (Transactional)
- [ ] Implement create order endpoint with multi-item support
- [ ] Auto-calculate total price
- [ ] Deduct stock atomically in transaction
- [ ] Implement update order status endpoint
- [ ] Implement cancel order and stock restore transaction
- [ ] Implement order listing by date and status

## Phase 7 - Conflict Detection
- [ ] Prevent duplicate product entries in same order
- [ ] Prevent ordering inactive products
- [ ] Prevent confirmation when stock is insufficient
- [ ] Return exact duplicate-product message
- [ ] Return exact unavailable-product message
- [ ] Return exact low-stock warning with available quantity

## Phase 8 - Dashboard and Activity Log
- [ ] Implement dashboard summary endpoint
- [ ] Show orders today metric
- [ ] Show pending vs completed metric
- [ ] Show low stock count metric
- [ ] Show revenue today metric
- [ ] Implement product stock summary output
- [ ] Implement activity log endpoint (latest 5-10)
- [ ] Capture activity for order, stock, queue, status actions

## Phase 9 - Frontend Integration
- [ ] Build dashboard page
- [ ] Build categories/products pages
- [ ] Build orders pages (create/list/status updates)
- [ ] Build restock queue page
- [ ] Build activity log page
- [ ] Add all required warning/error messages in UI
- [ ] Verify responsive behavior (mobile + desktop)

## Phase 10 - Finalization and Delivery
- [ ] Add optional bonus features only if all mandatory checks pass
- [ ] Run unit/integration/E2E test pass
- [ ] Deploy backend live
- [ ] Deploy frontend live
- [ ] Verify full smoke flow on live URLs
- [ ] Finalize README (setup + features + architecture + live URLs + repo)

## Requirement Coverage Ticklist
- [x] Requirement 1: Authentication
- [ ] Requirement 2: Product and category setup
- [ ] Requirement 3: Order management
- [ ] Requirement 4: Stock handling rules
- [ ] Requirement 5: Restock queue
- [ ] Requirement 6: Conflict detection
- [ ] Requirement 7: Dashboard
- [ ] Requirement 8: Activity log
- [ ] Deployment deliverables: live URL + repository + README
