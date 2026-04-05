# Crystal ERP — Project Plan

## Overview

A local inventory management system (進銷存) for a personal crystal seller friend. Deployed on a Windows PC via Docker Desktop — launch with `start.bat`, no login required.

Crystal items are inherently unique ("one item, one photo, one price"), making off-the-shelf software a poor fit. Custom development allows precise control over grade description, dimensions, weight, and photo management.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend | Hono + Node.js 20 | Lightweight, native TypeScript |
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui | Ready-made DataTable components, responsive |
| Database | MySQL 8.0 (Docker) | Familiar, reliable |
| ORM | Drizzle ORM | Lighter than Prisma, full SQL control |
| Deployment | Docker Compose (monorepo root) | Single command to start all services |
| Shared types | npm workspaces + `packages/shared` | Zod schemas reused on both frontend and backend |

---

## Database Schema

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(100) UNIQUE | e.g. 紫水晶 |
| name_en | VARCHAR(10) UNIQUE | SKU prefix, e.g. `AM` |
| created_at | TIMESTAMP | |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| sku | VARCHAR(30) UNIQUE | e.g. `AM-2026-001` |
| name | VARCHAR(200) | |
| category_id | INT FK → categories | nullable |
| length_mm / width_mm / height_mm | DECIMAL(8,2) | nullable |
| weight_g | DECIMAL(10,2) | nullable |
| cost_price | DECIMAL(10,2) | purchase price |
| list_price | DECIMAL(10,2) | listed selling price |
| quality_description | TEXT | grade notes (inclusions, clarity, glow) |
| status | ENUM in_stock \| reserved \| sold | default in_stock |
| notes | TEXT | |
| created_at / updated_at | TIMESTAMP | |

### `product_photos`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| product_id | INT FK → products ON DELETE CASCADE | |
| filename | VARCHAR(500) | stored as `{productId}/{uuid}.ext` |
| is_primary | BOOLEAN | cover photo |
| sort_order | INT | |

### `sales`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| product_id | INT FK → products | |
| sale_price | DECIMAL(10,2) | actual negotiated price |
| channel | ENUM line \| shopee \| livestream \| in_person \| other | |
| sold_at | DATE | |
| notes | TEXT | |

---

## API Routes (`/api/v1`)

```
# Products
GET    /products          ?status=&category_id=&q=&weight_min=&weight_max=&page=&limit=
POST   /products
GET    /products/:id
PUT    /products/:id
DELETE /products/:id      # only allowed when status=in_stock

# Photos
POST   /products/:id/photos     # multipart upload
DELETE /photos/:photoId
PUT    /photos/:photoId/primary

# Sales (POST atomically updates product.status → sold)
GET    /sales             ?channel=&from=&to=&page=&limit=
POST   /sales
DELETE /sales/:id         # reverts product.status → in_stock

# Dashboard
GET    /dashboard/stats   # inventory value, realized profit, counts, recent sales

# Categories
GET    /categories
POST   /categories

# QR Code
GET    /products/:id/qr   # returns PNG image

# Static photos
GET    /photos/:filename  # Hono serveStatic
```

---

## Frontend Pages

| Page | Route | Key Features |
|---|---|---|
| Dashboard | `/dashboard` | Stat cards (inventory value, profit), status breakdown, recent sales |
| Product list | `/products` | Multi-filter (category, status, weight range), card grid |
| New product | `/products/new` | Full form + photo upload (drag-and-drop) |
| Product detail | `/products/[id]` | Photo gallery, all specs, QR code display & download |
| Edit product | `/products/[id]/edit` | Same form pre-populated |
| Sales history | `/sales` | Table with profit column (sale price − cost) |
| New sale | `/sales/new` | Search/select product → enter price, channel, date |

**UI Language:** Traditional Chinese throughout

---

## Key Implementation Details

### SKU Generation (`backend/src/services/sku.ts`)
- Format: `{CATEGORY_EN}-{YEAR}-{SEQ}` (e.g. `AM-2026-001`)
- Queries `MAX(sku) WHERE sku LIKE 'AM-2026-%'` to find next sequence
- Zero-padded to 3 digits

### Atomic Sale Transaction (`backend/src/routes/sales.ts`)
```typescript
db.transaction(async (tx) => {
  await tx.insert(sales).values({ ... });
  await tx.update(products).set({ status: 'sold' }).where(eq(products.id, productId));
});
```

### Photo Storage
- Stored at `./storage/photos/{productId}/{uuid}.ext` (bind mount, not Docker volume)
- DB stores relative filename only
- Hono `serveStatic` serves files; frontend `img src` → `http://localhost:3001/photos/...`
- Client-side compression via `browser-image-compression` before upload

---

## Backup Strategy

Two data sources to back up:

| Data | Location | Method |
|---|---|---|
| Database | Docker volume `db_data` | `mysqldump` → `.sql` file |
| Photos | `./storage/photos/` (bind mount) | `xcopy` to backups folder |

**Off-site backup (critical):** Place `backups/` inside OneDrive or Google Drive sync folder — Windows auto-uploads to cloud.

### Restore procedure
```
1. docker compose up -d db
2. docker compose exec -T db mysql -u crystal -p crystal_erp < backups/crystal_erp_YYYYMMDD.sql
3. Copy photo backup back to storage/photos/
4. docker compose up -d
```

---

## POC / Remote Testing

For letting the friend trial the system during development:

| Method | Setup | URL stability | Cost |
|---|---|---|---|
| ngrok | 5 min | Random URL per restart | Free |
| Tailscale | Medium (both install app) | Fixed IP (P2P) | Free ≤3 users |
| Cloudflare Tunnel | Medium | Fixed (requires config) | Free |

**Quick demo:** `ngrok http 3000` — share the URL with friend directly.

**Long-term trial:** Tailscale — invite friend to tailnet, access via `http://{tailscale-ip}:3000`.

When using ngrok/Tailscale, update `.env`:
```
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app   # ngrok
NEXT_PUBLIC_API_URL=http://100.x.x.x:3001           # Tailscale
```
