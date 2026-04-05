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

## Phase 3 — Filters & Polish

- [ ] `ProductFilters` component — category multi-select, weight range, price range
- [ ] Wire filters to API query params on product list page
- [ ] Pagination component (product list + sales history)
- [ ] Delete confirmation dialog
- [ ] Status badge color coding (green=in_stock, yellow=reserved, gray=sold) — verify consistency across pages
- [ ] Category management UI (add/delete categories from frontend)
- [ ] Toast notifications for create/update/delete success & error

## Phase 4 — Production Dockerfiles

- [ ] Multi-stage `backend/Dockerfile` (builder → runner, no dev deps)
- [ ] Next.js standalone output `frontend/Dockerfile` (`output: 'standalone'`)
- [ ] End-to-end test: `docker compose up --build` from clean state
- [ ] Verify photo upload and static serving works inside containers

## Phase 5 — Handoff

- [ ] `README.md` in Chinese: install Docker Desktop, first-run steps, backup instructions, restore procedure
- [ ] `install_scheduler.bat` — Windows Task Scheduler auto-backup at 2am (optional)
- [ ] Final walkthrough with friend (POC via ngrok or Tailscale)
