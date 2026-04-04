# Database Schema Documentation

**Smart Inventory & Order Management System**

## Overview

PostgreSQL 16+ database with eight core tables, Knex migrations, and a structured seed pipeline. The current schema is designed around inventory operations, order fulfillment, restock tracking, audit logging, and forgot-password recovery.

## Schema at a Glance

### 1. `users`
Authentication and user management.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Login credential |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `phone` | VARCHAR(30) | NOT NULL | Contact number |
| `role` | VARCHAR(30) | NOT NULL, DEFAULT 'salesman' | `manager` or `salesman` |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'active' | Active/inactive account state |
| `created_by` | VARCHAR(255) | NOT NULL, DEFAULT 'system' | Audit metadata |
| `updated_by` | VARCHAR(255) | NOT NULL, DEFAULT 'system' | Audit metadata |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes**: `email`, `role`, `status`

**Relations**:
- Has many: `orders`, `activity_logs`, `password_reset_requests`

---

### 2. `categories`
Product grouping and filtering.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Category name |
| `description` | TEXT | NULLABLE | Extended description |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Active/inactive category state |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes**: `name`, `is_active`

**Relations**:
- Has many: `products`

---

### 3. `products`
Inventory items with stock tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `category_id` | UUID | NOT NULL, FK(`categories.id`) RESTRICT | Parent category |
| `name` | VARCHAR(150) | NOT NULL | Product name |
| `description` | TEXT | NULLABLE | Product details |
| `price` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Unit price |
| `current_stock` | INTEGER | NOT NULL, DEFAULT 0 | Available quantity |
| `min_stock_threshold` | INTEGER | NOT NULL, DEFAULT 0 | Restock trigger |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Product availability |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes**: `category_id`, `(current_stock, min_stock_threshold)`, `is_active`

**Relations**:
- Belongs to: `categories`
- Has many: `order_items`, `restock_queue`

**Service-layer status rule**:
- Active product with stock > 0 = available
- Active product with stock = 0 = out of stock
- Inactive product = inactive

---

### 4. `orders`
Customer order headers.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK(`users.id`) RESTRICT | Order creator |
| `customer_name` | VARCHAR(120) | NOT NULL, DEFAULT 'Walk-in Customer' | Customer name |
| `customer_phone` | VARCHAR(30) | NOT NULL, DEFAULT '' | Customer phone |
| `customer_address` | TEXT | NULLABLE | Delivery address |
| `delivery_instruction` | TEXT | NULLABLE | Delivery notes |
| `discount_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Discount applied |
| `total_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Final amount |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'pending' | Order state |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Order date |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last modification |

**Indexes**: `(user_id, created_at)`, `(status, created_at)`

**Relations**:
- Belongs to: `users`
- Has many: `order_items`

**Lifecycle**:
- `pending` -> `confirmed` -> `shipped` -> `delivered`
- `cancelled` is terminal when business rules allow it

---

### 5. `order_items`
Line items within orders.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `order_id` | UUID | NOT NULL, FK(`orders.id`) CASCADE | Parent order |
| `product_id` | UUID | NOT NULL, FK(`products.id`) RESTRICT | Product ordered |
| `quantity` | INTEGER | NOT NULL | Units ordered |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Price at order time |
| `line_total` | DECIMAL(12,2) | NOT NULL | `quantity * unit_price` |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Item creation time |

**Indexes**: `order_id`, `product_id`

**Constraints**:
- Unique `(order_id, product_id)` to prevent duplicate products inside the same order

**Relations**:
- Belongs to: `orders`, `products`

---

### 6. `restock_queue`
Automatic restock requests for low-stock products.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `product_id` | UUID | NOT NULL, FK(`products.id`) CASCADE | Product to restock |
| `quantity_needed` | INTEGER | NOT NULL | Units required |
| `priority` | VARCHAR(20) | NOT NULL | `low`, `medium`, or `high` |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Queue state |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Request creation time |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | Fulfillment time |

**Indexes**: `product_id`, `status`, `priority`

**Constraints**:
- Partial unique index on pending rows so one product cannot have multiple open restock requests

**Relations**:
- Belongs to: `products`

---

### 7. `activity_logs`
Audit trail for user and system actions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NULLABLE, FK(`users.id`) SET NULL | Actor; nullable for system events |
| `action` | TEXT | NOT NULL | Human-readable action |
| `entity_type` | VARCHAR(50) | NOT NULL | Domain object affected |
| `entity_id` | UUID | NULLABLE | Affected row identifier |
| `details` | JSONB | NULLABLE | Additional context |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Event time |

**Indexes**: `created_at`, `user_id`, `entity_type`

**Relations**:
- Belongs to: `users` when a user is available

---

### 8. `password_reset_requests`
Forgot-password recovery workflow.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK(`users.id`) CASCADE | Request owner |
| `email` | VARCHAR(255) | NOT NULL | Email for verification |
| `otp_code` | VARCHAR(10) | NOT NULL | Generated OTP |
| `attempt_count` | INTEGER | NOT NULL, DEFAULT 0 | Verification attempts |
| `verified` | BOOLEAN | NOT NULL, DEFAULT false | OTP verification state |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | OTP expiry time |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Request creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes**: `user_id`, `email`, `expires_at`

**Relations**:
- Belongs to: `users`

---

## Data Integrity

| Constraint | Type | Effect |
|-----------|------|--------|
| `users.email` | UNIQUE | Prevents duplicate login credentials |
| `categories.name` | UNIQUE | One category per name |
| `order_items.(order_id, product_id)` | UNIQUE | One line item per product per order |
| `products.category_id` → `categories.id` | FK RESTRICT | Prevents deleting a category with products |
| `orders.user_id` → `users.id` | FK RESTRICT | Prevents deleting a user that owns orders |
| `order_items.order_id` → `orders.id` | FK CASCADE | Deleting an order deletes its items |
| `order_items.product_id` → `products.id` | FK RESTRICT | Prevents deleting products used in orders |
| `restock_queue.product_id` → `products.id` | FK CASCADE | Deleting a product clears restock rows |
| `activity_logs.user_id` → `users.id` | FK SET NULL | Preserves logs when a user is removed |
| `password_reset_requests.user_id` → `users.id` | FK CASCADE | Request rows are removed with the user |

---

## Index Strategy

The schema is tuned for dashboard-style reads and operational lookups:

- `orders(status, created_at)` for recent workflow tracking
- `orders(user_id, created_at)` for per-user activity views
- `products(category_id)` for filtering and catalog pages
- `products(current_stock, min_stock_threshold)` for stock alerts
- `restock_queue(status, priority)` for queue processing
- `activity_logs(created_at)` for audit timelines
- `password_reset_requests(expires_at)` for cleanup and validation

---

## Migrations

Located in `services/inventory-api/src/database/migrations/`:

1. `019_create_users.ts` — Authentication and RBAC users
2. `020_create_categories.ts` — Category master data
3. `021_create_products.ts` — Inventory catalog and stock tracking
4. `022_create_orders.ts` — Order headers and totals
5. `023_create_order_items.ts` — Order line items
6. `024_create_restock_queue.ts` — Low-stock restock queue
7. `025_create_activity_logs.ts` — Audit trail storage
8. `026_create_password_reset_requests.ts` — OTP reset flow

### Running Migrations

**Local Development**:
```bash
cd services/inventory-api
npm run migrate:latest
npm run seed:run
```

**Production**:
```bash
npm run db:setup && npm start
```

`db:setup` runs the latest migrations and then the seed pipeline, which is useful when provisioning a brand-new database for the demo dataset.

---

## Seed Data

Location: `services/inventory-api/src/database/seeds/`

Seed order:

1. `000_truncate_all_tables.ts` clears the tables in dependency order.
2. `001_seed_users.ts` inserts the four demo users.
3. `002_seed_categories.ts` inserts the 15 category records.
4. `003_seed_products.ts` inserts the 49 products and activity logs.
5. `004_seed_orders.ts` inserts 100 orders, order items, and audit logs.
6. `005_seed_restock_queue.ts` inserts queue items for low-stock products.

Shared fixtures live in `services/inventory-api/src/database/seed-data/index.ts`.

### Demo Dataset

- 4 users
- 15 categories
- 49 products
- 100 orders over the last 30 days
- low-stock restock queue rows and related activity logs

---

## Connection Pooling

**Development** (local):
- Min: 1 connection
- Max: 10 connections
- Idle timeout: 30,000ms
- Connection timeout: 2,000ms
- SSL: false

**Production**:
- Min: 2 connections
- Max: 20 connections
- Idle timeout: 60,000ms
- Connection timeout: 5,000ms
- SSL: true

---

## Reset Behavior

Migrations change schema only. Seeds change data only. If the database already contains rows, running `migrate:latest` will not remove them. Run the seed pipeline after migrations when you need the demo dataset reset from scratch.