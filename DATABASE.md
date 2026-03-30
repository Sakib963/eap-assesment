# Database Schema Documentation

**Smart Inventory & Order Management System**

## Overview

PostgreSQL 16+ database with 7 core tables, connection pooling, and production-ready indexes.

## Tables

### 1. `users`
Authentication and user management.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Login credential |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed (10+ rounds) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**: email, created_at

**Relations**:
- Has many: orders, activity_logs

---

### 2. `categories`
Product grouping / organization.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Category name (e.g., "Electronics") |
| `description` | TEXT | NULLABLE | Extended description |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**: name, created_at

**Relations**:
- Has many: products

---

### 3. `products`
Inventory items with stock tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `category_id` | UUID | NOT NULL, FK(categories) | Parent category |
| `name` | VARCHAR(100) | NOT NULL | Product name |
| `description` | TEXT | NULLABLE | Product details |
| `price` | DECIMAL(10,2) | NOT NULL | Unit price in currency |
| `current_stock` | INTEGER | NOT NULL, DEFAULT 0 | Available quantity |
| `min_stock_threshold` | INTEGER | NOT NULL, DEFAULT 10 | Restock trigger |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Active/inactive flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**: category_id, is_active, (category_id, is_active), current_stock, created_at

**Relations**:
- Belongs to: categories
- Has many: order_items, restock_queue

---

### 4. `orders`
Customer orders.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK(users) CASCADE | Order creator |
| `status` | ENUM('pending', 'completed', 'cancelled') | NOT NULL, DEFAULT 'pending' | Order state |
| `total_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Sum of all items |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Order date |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification |

**Indexes**: user_id, status, (status, created_at), created_at

**Relations**:
- Belongs to: users
- Has many: order_items

---

### 5. `order_items`
Line items within orders (order ↔ products relationship).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `order_id` | UUID | NOT NULL, FK(orders) CASCADE | Parent order |
| `product_id` | UUID | NOT NULL, FK(products) RESTRICT | Product ordered |
| `quantity` | INTEGER | NOT NULL | Units ordered |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Price at time of order |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Item creation |

**Indexes**: order_id, product_id, created_at  
**Unique**: (order_id, product_id) — Only one line item per product per order

**Relations**:
- Belongs to: orders, products

---

### 6. `restock_queue`
Automatic restock requests for low-stock products.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `product_id` | UUID | NOT NULL, FK(products) CASCADE | Product to restock |
| `quantity_needed` | INTEGER | NOT NULL | Units to order |
| `priority` | ENUM('low', 'medium', 'high') | NOT NULL, DEFAULT 'medium' | Urgency level |
| `status` | ENUM('pending', 'completed') | NOT NULL, DEFAULT 'pending' | Queue state |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Request creation |
| `completed_at` | TIMESTAMP | NULLABLE | Fulfillment time |

**Indexes**: product_id, status, priority, (status, priority), created_at

**Relations**:
- Belongs to: products

---

### 7. `activity_logs`
Audit trail for all actions (immutable).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK(users) CASCADE | Actor |
| `action` | VARCHAR(50) | NOT NULL | Action type (e.g., 'order_placed', 'stock_updated') |
| `entity_type` | ENUM('product', 'order', 'stock', 'category') | NOT NULL | What was affected |
| `entity_id` | UUID | NOT NULL | ID of affected entity |
| `details` | JSONB | NULLABLE | Extra context (changes, amounts, etc.) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Event time |

**Indexes**: user_id, action, entity_type, entity_id, created_at, (user_id, created_at)

**Relations**:
- Belongs to: users

---

## Data Integrity

| Constraint | Type | Effect |
|-----------|------|--------|
| `users.email` | UNIQUE | Prevents duplicate login credentials |
| `categories.name` | UNIQUE | One category per name |
| `order_items.(order_id, product_id)` | UNIQUE | One line item per product per order |
| `orders.user_id` → `users.id` | FK CASCADE | Deleting user cascades order deletions |
| `order_items.order_id` → `orders.id` | FK CASCADE | Deleting order deletes its items |
| `order_items.product_id` → `products.id` | FK RESTRICT | Cannot delete product if it's in an order |
| `products.category_id` → `categories.id` | FK RESTRICT | Cannot delete category with products |
| `restock_queue.product_id` → `products.id` | FK CASCADE | Deleting product clears restock queue |
| `activity_logs.user_id` → `users.id` | FK CASCADE | Deleting user cascades audit deletions |

---

## Indexes Strategy

**For Dashboard Queries** (Phase 8):
- `orders` → (status, created_at) — Filter by status and date range
- `restock_queue` → (status, priority) — Pending high-priority items
- `products` → current_stock — Low-stock alerts
- `activity_logs` → (user_id, created_at) — User activity timeline

**For Foreign Key Traversal**:
- `products` → category_id
- `orders` → user_id
- `order_items` → (order_id, product_id)
- `restock_queue` → product_id
- `activity_logs` → user_id

**For Pagination/Listing**:
- All tables → created_at

---

## Migrations

Located in `services/inventory-api/src/database/migrations/`:

1. `001_create_users.ts` — User authentication
2. `002_create_categories.ts` — Product grouping
3. `003_create_products.ts` — Inventory items
4. `004_create_orders.ts` — Order headers
5. `005_create_order_items.ts` — Order line items
6. `006_create_restock_queue.ts` — Auto-restock requests
7. `007_create_activity_logs.ts` — Audit trail

### Running Migrations

**Local Development**:
```bash
# Create local PostgreSQL (docker or native) with:
# CREATE USER dbuser WITH PASSWORD 'dbpass';
# CREATE DATABASE inventory OWNER dbuser;

# Then run:
cd services/inventory-api
npm run migrate:latest
npm run seed:run
```

**Production (Render)**:
```bash
# Set DATABASE_URL environment variable in Vercel to Render connection string
# Add migrations to startup script:
npm run db:setup && npm start
```

---

## Seed Data

Location: `services/inventory-api/src/database/seeds/01_seed_demo_data.ts`

**Demo User**:
- Email: `demo@inventory.local`
- Password: `demo123`
- ID: (auto-generated UUID)

**Sample Data** (11 products, 4 categories):
- Electronics: Laptop, Mouse, USB Cable, Monitor
- Office Supplies: Paper, Pens, Desk Lamp
- Tools: Drill, Screwdrivers
- Home & Garden: Office Chair, Potted Plant

**Sample Orders** (3 completed/pending):
- Day 3 ago (completed): Laptop + Mouse
- Yesterday (pending): 3× Monitor + USB Cable
- Today (pending): 50× Pens

**Restock Queue** (5 pending):
- High priority: Wireless Mouse, Monitor, A4 Paper
- Medium priority: Desk Lamp, Potted Plant

---

## Connection Pooling

**Development** (local):
- Min: 1 connection
- Max: 10 connections
- Idle timeout: 30,000ms
- Connection timeout: 2,000ms
- SSL: false

**Production** (Render):
- Min: 2 connections
- Max: 10 connections
- Idle timeout: 30,000ms
- Connection timeout: 2,000ms
- SSL: true (required)

---

## Performance Considerations

1. **Composite Indexes**: `(status, created_at)` on orders for dashboard queries
2. **Foreign Key Constraints**: RESTRICT on products (prevent accidental deletion) vs CASCADE on orders (natural cleanup)
3. **JSONB for Flexibility**: activity_logs.details stores dynamic change data
4. **UUID for Scalability**: Distributed IDs, no coordination needed
5. **Timestamps**: All tables timestamped for audit trail

---

## Example Queries

### Dashboard Metrics
```sql
-- Orders placed today
SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE;

-- Pending orders count
SELECT COUNT(*) FROM orders WHERE status = 'pending';

-- Low-stock products
SELECT * FROM products WHERE current_stock < min_stock_threshold AND is_active;

-- Restock queue pending count
SELECT COUNT(*) FROM restock_queue WHERE status = 'pending';
```

### User Activity
```sql
-- Last 10 actions by user
SELECT * FROM activity_logs 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;
```

### Order Analytics
```sql
-- Total revenue (completed orders)
SELECT SUM(total_amount) FROM orders WHERE status = 'completed';

-- Products in orders per category
SELECT c.name, COUNT(p.id) 
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN order_items oi ON p.id = oi.product_id
GROUP BY c.id, c.name;
```

---

## Maintenance

**Regular Tasks**:
- Analyze tables: `ANALYZE products, orders, restock_queue;`
- Vacuum: `VACUUM ANALYZE activity_logs;` (for audit table log cleanup)
- Reindex: `REINDEX INDEX idx_orders_status_created; ` (if slowdown detected)

**Render PostgreSQL Console** (Admin):
- Monitor connection count (avoid max: 10)
- Check query logs for slow queries
- Backup daily (Render handles automatically)

---

**Schema Version**: 1.0  
**Created**: March 30, 2026  
**Database Compatibility**: PostgreSQL 16+
