# Crystal ERP — TODO

## Phase 1 — Foundation ✅

- [x] Initialize monorepo (npm workspaces, `.env.example`, `.gitignore`)
- [x] Write `docker-compose.yml` with db healthcheck
- [x] Write `docker-compose.dev.yml` with hot-reload volume mounts
- [x] Create `packages/shared` (TypeScript types + Zod schemas)
- [x] Write Drizzle schema (`categories`, `products`, `product_photos`, `sales`)
- [x] Run `drizzle-kit generate` → migration SQL verified
- [x] `GET/POST /api/v1/products` and `/categories` routes
- [x] SKU generation service (`backend/src/services/sku.ts`)

## Phase 2 — Product CRUD + Frontend Skeleton ✅

- [x] `PUT/DELETE /products/:id`
- [x] Photo upload routes + Hono static serve
- [x] QR code generation endpoint
- [x] Next.js 15 init (Tailwind + shadcn/ui config)
- [x] Sidebar layout
- [x] Product list page (`/products`)
- [x] New product form (`/products/new`) + PhotoUploader component
- [x] Product detail page (`/products/[id]`) with QR code display
- [x] Edit product page (`/products/[id]/edit`)
- [x] `POST /sales` atomic transaction
- [x] `GET /dashboard/stats` aggregation query
- [x] Sales history page (`/sales`)
- [x] New sale page (`/sales/new`)
- [x] Dashboard page (`/dashboard`)
- [x] Windows helper scripts: `start.bat`, `stop.bat`, `backup.bat`

## Phase 3 — Filters & Polish ✅

- [x] `ProductFilters` component — category pills, weight range, price range
- [x] Wire filters to API query params on product list page
- [x] Pagination component (product list + sales history)
- [x] Delete confirmation dialog (`ConfirmDialog` using Radix AlertDialog)
- [x] Status badge color coding — consistent across all pages
- [x] Category management UI (`/settings/categories` — add/delete)
- [x] Toast notifications (sonner) on create/update/delete success & error

## Phase 4 — Production Dockerfiles ✅

- [x] Multi-stage `backend/Dockerfile` (builder → runner, no dev deps)
- [x] Next.js standalone output `frontend/Dockerfile` (`output: 'standalone'`)
- [x] `.dockerignore` to exclude unnecessary files from build context
- [ ] End-to-end test: `docker compose up --build` from clean state (run when Docker available)

## Phase 5 — Handoff ✅

- [x] `README.md` in Chinese: install Docker Desktop, first-run steps, backup instructions, FAQs
- [x] `install_scheduler.bat` — Windows Task Scheduler auto-backup at 2am
- [ ] Final walkthrough with friend (POC via ngrok or Tailscale)
