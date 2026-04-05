#!/usr/bin/env bash
# Crystal ERP — Backend API test script
# Usage: bash scripts/test-api.sh [BASE_URL]
# Default BASE_URL: http://localhost:3001/api/v1

set -euo pipefail

BASE="${1:-http://localhost:3001/api/v1}"

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
BOLD='\033[1m'

PASS=0; FAIL=0

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)); }
section() { echo -e "\n${BOLD}${YELLOW}── $1 ──${NC}"; }

# ── helpers ───────────────────────────────────────────────────────────────────
post() {  # post PATH BODY → prints response body
  curl -sf -X POST "$BASE$1" \
    -H "Content-Type: application/json" \
    -d "$2"
}

get() {   # get PATH → prints response body
  curl -sf "$BASE$1"
}

delete() { # delete PATH → prints HTTP status
  curl -sf -o /dev/null -w "%{http_code}" -X DELETE "$BASE$1"
}

json_field() { # json_field JSON_STRING FIELD → prints value (via python or node)
  echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)" 2>/dev/null \
    || echo "$1" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(eval('('+d+')$2')))"
}

assert_eq() { # assert_eq LABEL EXPECTED ACTUAL
  if [ "$2" = "$3" ]; then pass "$1"; else fail "$1 (expected='$2' got='$3')"; fi
}

assert_nonempty() { # assert_nonempty LABEL VALUE
  if [ -n "$2" ] && [ "$2" != "null" ]; then pass "$1"; else fail "$1 (empty/null)"; fi
}

# ── track created IDs for cleanup ─────────────────────────────────────────────
CATEGORY_ID=""
PRODUCT_ID=""
SALE_ID=""

cleanup() {
  echo -e "\n${YELLOW}── 清除測試資料 ──${NC}"
  [ -n "$SALE_ID" ]    && { STATUS=$(delete "/sales/$SALE_ID");    [ "$STATUS" = "204" ] && echo "  sale $SALE_ID deleted" || echo "  sale already gone"; }
  [ -n "$PRODUCT_ID" ] && { STATUS=$(delete "/products/$PRODUCT_ID"); [ "$STATUS" = "204" ] && echo "  product $PRODUCT_ID deleted" || echo "  product already gone / sold"; }
  [ -n "$CATEGORY_ID" ] && { STATUS=$(delete "/categories/$CATEGORY_ID"); [ "$STATUS" = "204" ] && echo "  category $CATEGORY_ID deleted" || echo "  category already gone"; }
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${BOLD}Crystal ERP — API Test${NC}  ${BASE}"

# ── 1. Health ─────────────────────────────────────────────────────────────────
section "1. Health check"
HEALTH=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE/../health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then pass "GET /health → 200"
else echo -e "${YELLOW}⚠${NC}  /health not found (skipped — not required)"; fi

# ── 2. Categories ─────────────────────────────────────────────────────────────
section "2. 分類 CRUD"

# List (empty or existing)
CATS=$(get "/categories")
assert_nonempty "GET /categories" "$CATS"

# Create
CAT=$(post "/categories" '{"name":"測試紫水晶","nameEn":"TST"}')
CATEGORY_ID=$(json_field "$CAT" "['data']['id']")
assert_nonempty "POST /categories → id" "$CATEGORY_ID"
assert_eq "POST /categories → nameEn" "TST" "$(json_field "$CAT" "['data']['nameEn']")"

# Duplicate nameEn
DUP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "$BASE/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"重複","nameEn":"TST"}')
assert_eq "POST /categories duplicate nameEn → 400" "400" "$DUP_STATUS"

# List after create
CATS2=$(get "/categories")
COUNT=$(json_field "$CATS2" "['data']" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "?")
assert_nonempty "GET /categories after insert" "$COUNT"

# ── 3. Products ───────────────────────────────────────────────────────────────
section "3. 商品 CRUD"

# Create
PRODUCT=$(post "/products" "{
  \"name\": \"E2E 紫水晶原石\",
  \"categoryId\": $CATEGORY_ID,
  \"costPrice\": \"600\",
  \"listPrice\": \"1200\",
  \"weightG\": 150,
  \"qualityDescription\": \"冰裂少，色澤均勻\"
}")
PRODUCT_ID=$(json_field "$PRODUCT" "['data']['id']")
PRODUCT_SKU=$(json_field "$PRODUCT" "['data']['sku']")
assert_nonempty "POST /products → id" "$PRODUCT_ID"
assert_nonempty "POST /products → sku (auto-generated)" "$PRODUCT_SKU"
assert_eq "POST /products → status default in_stock" "in_stock" "$(json_field "$PRODUCT" "['data']['status']")"

# Read
GOT=$(get "/products/$PRODUCT_ID")
assert_eq "GET /products/:id → name" "E2E 紫水晶原石" "$(json_field "$GOT" "['data']['name']")"
assert_eq "GET /products/:id → category" "測試紫水晶" "$(json_field "$GOT" "['data']['category']['name']")"

# Update
UPDATED=$(curl -sf -X PUT "$BASE/products/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -d '{"listPrice":"1350","notes":"測試備註"}')
assert_eq "PUT /products/:id → listPrice" "1350" "$(json_field "$UPDATED" "['data']['listPrice']")"
assert_eq "PUT /products/:id → notes" "測試備註" "$(json_field "$UPDATED" "['data']['notes']")"

# List with filter
LIST=$(get "/products?q=E2E")
assert_nonempty "GET /products?q=E2E → data" "$(json_field "$LIST" "['data']")"

# Cannot delete sold product (tested after sale is created)

# ── 4. Sales ─────────────────────────────────────────────────────────────────
section "4. 銷售（原子交易）"

SALE=$(post "/sales" "{
  \"productId\": $PRODUCT_ID,
  \"salePrice\": \"1100\",
  \"channel\": \"line\",
  \"soldAt\": \"$(date +%Y-%m-%d)\"
}")
SALE_ID=$(json_field "$SALE" "['data']['id']")
assert_nonempty "POST /sales → id" "$SALE_ID"
assert_eq "POST /sales → salePrice" "1100" "$(json_field "$SALE" "['data']['salePrice']")"

# Product status should now be sold
SOLD_PRODUCT=$(get "/products/$PRODUCT_ID")
assert_eq "product.status → sold after sale" "sold" "$(json_field "$SOLD_PRODUCT" "['data']['status']")"

# Cannot sell same product again
DUP_SALE_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "$BASE/sales" \
  -H "Content-Type: application/json" \
  -d "{\"productId\": $PRODUCT_ID, \"salePrice\": \"900\", \"channel\": \"other\", \"soldAt\": \"$(date +%Y-%m-%d)\"}")
assert_eq "POST /sales duplicate product → 400" "400" "$DUP_SALE_STATUS"

# Cannot delete sold product
DEL_SOLD=$(curl -sf -o /dev/null -w "%{http_code}" -X DELETE "$BASE/products/$PRODUCT_ID")
assert_eq "DELETE sold product → 400" "400" "$DEL_SOLD"

# Sales list
SALES_LIST=$(get "/sales?page=1&limit=10")
assert_nonempty "GET /sales → data" "$(json_field "$SALES_LIST" "['data']")"
assert_nonempty "GET /sales → meta.total" "$(json_field "$SALES_LIST" "['meta']['total']")"

# ── 5. Dashboard ─────────────────────────────────────────────────────────────
section "5. 看板統計"

STATS=$(get "/dashboard/stats")
assert_nonempty "GET /dashboard/stats → data" "$(json_field "$STATS" "['data']")"
assert_nonempty "GET /dashboard/stats → totalSold" "$(json_field "$STATS" "['data']['totalSold']")"
assert_nonempty "GET /dashboard/stats → realizedRevenue" "$(json_field "$STATS" "['data']['realizedRevenue']")"
assert_nonempty "GET /dashboard/stats → countByCategory" "$(json_field "$STATS" "['data']['countByCategory']")"
assert_nonempty "GET /dashboard/stats → recentSales" "$(json_field "$STATS" "['data']['recentSales']")"

# Realized profit = revenue - cost  (1100 - 600 = 500, but DB may have others)
PROFIT=$(json_field "$STATS" "['data']['realizedProfit']")
assert_nonempty "GET /dashboard/stats → realizedProfit" "$PROFIT"

# ── 6. Delete sale & restore product ─────────────────────────────────────────
section "6. 刪除銷售 → 商品回到 in_stock"

DEL_SALE=$(delete "/sales/$SALE_ID")
assert_eq "DELETE /sales/:id → 204" "204" "$DEL_SALE"
SALE_ID=""  # prevent double-delete in cleanup

RESTORED=$(get "/products/$PRODUCT_ID")
assert_eq "product.status → in_stock after sale deleted" "in_stock" "$(json_field "$RESTORED" "['data']['status']")"

# ── 7. QR Code ────────────────────────────────────────────────────────────────
section "7. QR Code"

QR_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE/products/$PRODUCT_ID/qr")
assert_eq "GET /products/:id/qr → 200" "200" "$QR_STATUS"

QR_CT=$(curl -sf -o /dev/null -w "%{content_type}" "$BASE/products/$PRODUCT_ID/qr")
assert_eq "GET /products/:id/qr → image/png" "image/png" "$QR_CT"

# ── Summary ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}────────────────────────────────${NC}"
echo -e "結果：${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
