# Smart Inventory & Order Management System

A full-stack inventory management platform with real-time stock updates, order processing, and intelligent restock queuing.

## 🏗 Architecture

**Option B: Domain-Based Monorepo**

```
eap-assesment/                    # Root monorepo
├── services/
│   ├── inventory-web/            # Frontend: Angular 20 + Tailwind CSS
│   └── inventory-api/            # Backend: Express + TypeScript + PostgreSQL
├── shared/
│   └── types.ts                  # Shared interfaces (auth, products, orders, etc.)
├── vercel.json                   # Backend deployment (Vercel)
├── netlify.toml                  # Frontend deployment (Netlify)
└── TASKS.md                      # Implementation checklist
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 16+ (or use Render free tier)

### 1. Install Dependencies

```bash
# Backend
cd services/inventory-api
npm install

# Frontend
cd ../inventory-web
npm install
```

### 2. Configure Environment

```bash
# Backend
cd services/inventory-api
cp .env.example .env
# Edit .env with your Render DATABASE_URL

# Frontend
cd ../inventory-web
cp .env.example .env
# API_BASE_URL=http://localhost:3000 (already set)
```

### 3. Run Services

**Terminal 1 - Backend API:**
```bash
cd services/inventory-api
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend Web:**
```bash
cd services/inventory-web
npm start
# Runs on http://localhost:4200
```

**Terminal 3 - Database (if local PostgreSQL):**
```bash
# Ensure PostgreSQL is running on localhost:5432
# Or use Render managed database (recommended)
```

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Angular 20 (standalone) | Type-safe, modern web UI |
| | Tailwind CSS 3.4 | Utility-first styling |
| | RxJS | Reactive state management |
| **Backend** | Express 5.2 | REST API framework |
| | TypeScript 6.0 | Type-safe backend code |
| | Node.js ESM | Modern JavaScript modules |
| **Database** | PostgreSQL 16 | Relational data with constraints |
| **Validation** | Zod | Runtime schema validation |
| **Auth** | JWT + bcryptjs | Stateless authentication |
| **Security** | Helmet, CORS | Production-ready security headers |

## 🌐 Deployment

### Frontend → Netlify

1. Push code to GitHub
2. Connect repo to Netlify: https://app.netlify.com/
3. **Build Settings:**
   - Build command: `cd services/inventory-web && npm run build`
   - Publish directory: `services/inventory-web/dist`
4. **Environment Variables:**
   - `API_BASE_URL=https://inventory-api.vercel.app`

### Backend → Vercel

1. Push code to GitHub
2. Connect repo to Vercel: https://vercel.com/
3. **Build Settings:**
   - Build command: `cd services/inventory-api && npm run build`
   - Output directory: `services/inventory-api/dist`
   - Start command: `node services/inventory-api/dist/server.js`
4. **Environment Variables** (from Vercel dashboard):
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DATABASE_URL=<from Render>`
   - `CORS_ORIGIN=https://your-netlify-url.netlify.app`

### Database → Render PostgreSQL

1. Create PostgreSQL instance: https://render.com/
2. Copy connection string
3. Add to Vercel environment variables as `DATABASE_URL`
4. Backend health endpoint: `/api/health`

## 📋 Implementation Phases

See [TASKS.md](./TASKS.md) for complete phase-by-phase breakdown:

- **Phase -1**: Repository structure ✅
- **Phase 0**: Setup (Angular + Express) ✅
- **Phase 1**: Database schema (migrations) ✅
- **Phase 2**: Platform layer (middleware, validation) ✅
- **Phase 3**: Authentication (signup, login, JWT) ✅
- **Phase 4**: Categories and products CRUD ✅
- **Phase 5**: Stock rules and restock queue (in progress)
- **Phase 6**: Order processing
- **Phase 7**: Conflict detection
- **Phase 8**: Dashboard & activity logs
- **Phase 9**: Frontend integration (in progress)
- **Phase 10**: Deployment & finalization

## 📚 Shared Interfaces

TypeScript interfaces shared across frontend and backend:

```typescript
// shared/types.ts
export interface User { /* ... */ }
export interface Product { /* ... */ }
export interface Order { /* ... */ }
export interface RestockQueueItem { /* ... */ }
export interface ActivityLog { /* ... */ }
export interface DashboardMetrics { /* ... */ }
// ...and more
```

**Usage in Frontend** (Phase 9):
```typescript
import type { Product, Order } from '../../shared/types';
```

**Usage in Backend** (Phase 1+):
```typescript
import type { User, Product } from '../../../shared/types';
```

## 🛠 Available Commands

### Backend (inventory-api)
```bash
npm run dev       # Dev server with file watching (tsx)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled server (production)
npm test          # Run tests (placeholder)
```

### Frontend (inventory-web)
```bash
npm start         # Angular dev server (ng serve)
npm run build     # Production build (ng build)
npm run watch     # Watch mode development
npm test          # Run tests
```

## 📝 Environment Variables

### Development (.env)

**Backend** (`services/inventory-api/.env`):
```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200
DATABASE_URL=postgresql://user:password@localhost:5432/inventory
```

**Frontend** (`services/inventory-web/.env`):
```
API_BASE_URL=http://localhost:3000
```

### Production (Netlify & Vercel UI)

**Vercel** (Backend):
- `NODE_ENV=production`
- `DATABASE_URL=<render-connection-string>`
- `CORS_ORIGIN=https://your-netlify-app.netlify.app`

**Netlify** (Frontend):
- `API_BASE_URL=https://inventory-api.vercel.app`

## 🔐 Security Notes

- JWT tokens stored in HttpOnly cookies (Phase 3)
- Helmet security headers enabled
- CORS restricted to frontend origin
- SQL injection prevented by pg parameterized queries
- Passwords hashed with bcryptjs (10+ rounds)
- Environment variables never committed (.gitignore)

## 📊 Database Schema

See [Phase 1 - Database First](./TASKS.md#phase-1---database-first-render-postgresql) for migrations:
- `users` — Authentication
- `categories` — Product grouping
- `products` — Inventory items
- `orders` — Customer orders
- `order_items` — Items per order
- `restock_queue` — Automatic restocking
- `activity_logs` — Audit trail

Recent schema updates:
- `008_add_is_active_to_categories.ts` — Category active/inactive support
- `009_add_case_insensitive_unique_index_to_categories_name.ts` — Case-insensitive uniqueness on category names

## 🐛 Troubleshooting

**Frontend can't reach backend:**
- Check `API_BASE_URL` in `services/inventory-web/.env`
- Ensure backend is running on port 3000
- Check CORS settings in `services/inventory-api/src/config/env.ts`

**Build fails:**
- Clear `node_modules`: `rm -rf services/*/node_modules`
- Clear build cache: `rm -rf services/*/dist`
- Reinstall: `npm install` in both services

**Database connection error:**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- For Render, ensure SSL mode is enabled in connection string
- Check firewall rules allow your IP

## 📖 Documentation

- [TASKS.md](./TASKS.md) — Full implementation checklist
- [context/EAP_3.0_Assesment_Task.md](./context/EAP_3.0_Assesment_Task.md) — Requirements
- [shared/types.ts](./shared/types.ts) — API contract

## 🎯 Next Steps

1. **Phase 5-6**: Complete stock automation and transactional order lifecycle
2. **Phase 7**: Finish conflict-detection rules and exact user-facing error flows
3. **Phase 8**: Complete dashboard metrics and activity timeline endpoints/UI
4. **Phase 9-10**: Final frontend pages, test pass, and production deployment smoke checks

---

**Status**: Phases 0-4 Complete, Phases 5-9 In Progress  
**Last Updated**: March 31, 2026  
**Repository Structure**: Option B (Domain-Based Monorepo)  
**Deployment**: Netlify (Frontend) + Vercel (Backend) + Render (Database)
