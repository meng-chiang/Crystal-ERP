#!/usr/bin/env bash
# Crystal ERP — Backend API test script
# Usage: bash scripts/test-api.sh [BASE_URL]
# Default BASE_URL: http://localhost:3001/api/v1

set -uo pipefail   # no -e: we handle failures explicitly per assertion

BASE="${1:-http://localhost:3001/api/v1}"

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
BOLD='\033[1m'

PASS=0; FAIL=0

pass()    { echo -e "${GREEN}✓${NC} $1";          PASS=$((PASS + 1)); }
fail()    { echo -e "${RED}✗${NC} $1";            FAIL=$((FAIL + 1)); }
section() { echo -e "\n${BOLD}${YELLOW}── $1 ──${NC}"; }

# ── helpers ───────────────────────────────────────────────────────────────────
# Returns response body; exits with curl's exit code (non-zero on HTTP 4xx/5xx)
http_post() {
  curl -sf -X POST "$BASE$1" -H "Content-Type: application/json" -d "$2"
}
http_get() {
  curl -sf "$BASE$1"
}
http_delete() {
  curl -sf -o /dev/null -w "%{http_code}" -X DELETE "$BASE$1"
}
http_put() {
  curl -sf -X PUT "$BASE$1" -H "Content-Type: application/json" -d "$2"
}
http_status() {   # returns only status code, no -f
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

json_get() {  # json_get JSON_STRING 'key.subkey'
  echo "$1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for k in '$2'.split('.'):
    d = d[int(k)] if k.isdigit() else d[k]
print(d)
" 2>/dev/null || echo ""
}

assert_eq() {     # assert_eq LABEL EXPECTED ACTUAL
  if [ "$2" = "$3" ]; then pass "$1"
  else fail "$1 (expected='$2' got='$3')"; fi
}
assert_nonempty() {
  if [ -n "$1" ] && [ "$1" != "null" ] && [ "$1" != "None" ]; then pass "$2"
  else fail "$2 (empty)"; fi
}

# ── test data IDs (for cleanup) ───────────────────────────────────────────────
CATEGORY_ID=""; PRODUCT_ID=""; SALE_ID=""

# Remove any leftover TST test data from a previous interrupted run
pre_cleanup() {
  local cats
  cats=$(curl -sf "$BASE/categories" 2>/dev/null || echo '{"data":[]}')
  echo "$cats" | python3 -c "
import sys, json, urllib.request
cats = json.load(sys.stdin)['data']
for c in cats:
    if c['nameEn'] in ('TST',):
        req = urllib.request.Request('$BASE/categories/' + str(c['id']), method='DELETE')
        try: urllib.request.urlopen(req); print('  pre-clean: deleted leftover category', c['nameEn'], c['id'])
        except: pass
" 2>/dev/null || true
}

cleanup() {
  echo -e "\n${YELLOW}── 清除測試資料 ──${NC}"
  if [ -n "$SALE_ID" ]; then
    ST=$(http_delete "/sales/$SALE_ID" 2>/dev/null || echo "000")
    [ "$ST" = "204" ] && echo "  sale $SALE_ID deleted" || echo "  sale $SALE_ID already gone (status=$ST)"
  fi
  if [ -n "$PRODUCT_ID" ]; then
    ST=$(http_delete "/products/$PRODUCT_ID" 2>/dev/null || echo "000")
    [ "$ST" = "204" ] && echo "  product $PRODUCT_ID deleted" || echo "  product $PRODUCT_ID already gone / sold (status=$ST)"
  fi
  if [ -n "$CATEGORY_ID" ]; then
    ST=$(http_delete "/categories/$CATEGORY_ID" 2>/dev/null || echo "000")
    [ "$ST" = "204" ] && echo "  category $CATEGORY_ID deleted" || echo "  category $CATEGORY_ID already gone (status=$ST)"
  fi
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════════════════
echo -e "${BOLD}Crystal ERP — API Test${NC}  ${BASE}"

pre_cleanup

# ── 1. Health ─────────────────────────────────────────────────────────────────
section "1. Health check"
HEALTH=$(http_status "$BASE/../health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then pass "GET /health → 200"
else echo -e "${YELLOW}⚠${NC}  /health not found (skipped)"; fi

# ── 2. Categories ─────────────────────────────────────────────────────────────
section "2. 分類 CRUD"

CATS=$(http_get "/categories")
assert_nonempty "$CATS" "GET /categories"

CAT=$(http_post "/categories" '{"name":"測試紫水晶","nameEn":"TST"}')
CATEGORY_ID=$(json_get "$CAT" "data.id")
assert_nonempty "$CATEGORY_ID" "POST /categories → id"
assert_eq "POST /categories → nameEn" "TST" "$(json_get "$CAT" "data.nameEn")"

# Duplicate nameEn should return 400
DUP_STATUS=$(http_status -X POST "$BASE/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"重複","nameEn":"TST"}')
assert_eq "POST /categories duplicate → 400" "400" "$DUP_STATUS"

# ── 3. Products ───────────────────────────────────────────────────────────────
section "3. 商品 CRUD"

PRODUCT=$(http_post "/products" "{\"name\":\"E2E 紫水晶原石\",\"categoryId\":$CATEGORY_ID,\"costPrice\":\"600\",\"listPrice\":\"1200\",\"weightG\":\"150\",\"qualityDescription\":\"冰裂少，色澤均勻\"}")
PRODUCT_ID=$(json_get "$PRODUCT" "data.id")
PRODUCT_SKU=$(json_get "$PRODUCT" "data.sku")
assert_nonempty "$PRODUCT_ID"  "POST /products → id"
assert_nonempty "$PRODUCT_SKU" "POST /products → sku (auto-generated)"
assert_eq "POST /products → status" "in_stock" "$(json_get "$PRODUCT" "data.status")"

GOT=$(http_get "/products/$PRODUCT_ID")
assert_eq "GET /products/:id → name" "E2E 紫水晶原石" "$(json_get "$GOT" "data.name")"
assert_eq "GET /products/:id → category" "測試紫水晶" "$(json_get "$GOT" "data.category.name")"

UPDATED=$(http_put "/products/$PRODUCT_ID" '{"listPrice":"1350","notes":"測試備註"}')
assert_eq "PUT /products/:id → listPrice" "1350.00" "$(json_get "$UPDATED" "data.listPrice")"
assert_eq "PUT /products/:id → notes" "測試備註" "$(json_get "$UPDATED" "data.notes")"

LIST=$(http_get "/products?q=E2E")
LIST_LEN=$(echo "$LIST" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null || echo "0")
assert_nonempty "$LIST_LEN" "GET /products?q=E2E → results"

# ── 4. Sales ─────────────────────────────────────────────────────────────────
section "4. 銷售（原子交易）"

TODAY=$(date +%Y-%m-%d)
SALE=$(http_post "/sales" "{\"productId\":$PRODUCT_ID,\"salePrice\":\"1100\",\"channel\":\"line\",\"soldAt\":\"$TODAY\"}")
SALE_ID=$(json_get "$SALE" "data.id")
assert_nonempty "$SALE_ID" "POST /sales → id"
assert_eq "POST /sales → salePrice" "1100.00" "$(json_get "$SALE" "data.salePrice")"

SOLD_PRODUCT=$(http_get "/products/$PRODUCT_ID")
assert_eq "product.status → sold after sale" "sold" "$(json_get "$SOLD_PRODUCT" "data.status")"

DUP_SALE_STATUS=$(http_status -X POST "$BASE/sales" \
  -H "Content-Type: application/json" \
  -d "{\"productId\": $PRODUCT_ID, \"salePrice\": \"900\", \"channel\": \"other\", \"soldAt\": \"$TODAY\"}")
assert_eq "POST /sales duplicate product → 400" "400" "$DUP_SALE_STATUS"

DEL_SOLD_STATUS=$(http_status -X DELETE "$BASE/products/$PRODUCT_ID")
assert_eq "DELETE sold product → 400" "400" "$DEL_SOLD_STATUS"

SALES_LIST=$(http_get "/sales?page=1&limit=10")
assert_nonempty "$(json_get "$SALES_LIST" "meta.total")" "GET /sales → meta.total"

# ── 5. Dashboard ─────────────────────────────────────────────────────────────
section "5. 看板統計"

STATS=$(http_get "/dashboard/stats")
assert_nonempty "$(json_get "$STATS" "data.totalSold")"       "GET /dashboard/stats → totalSold"
assert_nonempty "$(json_get "$STATS" "data.realizedRevenue")" "GET /dashboard/stats → realizedRevenue"
assert_nonempty "$(json_get "$STATS" "data.realizedProfit")"  "GET /dashboard/stats → realizedProfit"

# ── 6. Delete sale → restore product ─────────────────────────────────────────
section "6. 刪除銷售 → 商品回到 in_stock"

DEL_SALE=$(http_delete "/sales/$SALE_ID")
assert_eq "DELETE /sales/:id → 204" "204" "$DEL_SALE"
SALE_ID=""

RESTORED=$(http_get "/products/$PRODUCT_ID")
assert_eq "product.status → in_stock after sale deleted" "in_stock" "$(json_get "$RESTORED" "data.status")"

# ── 7. QR Code ────────────────────────────────────────────────────────────────
section "7. QR Code"

QR_STATUS=$(http_status "$BASE/products/$PRODUCT_ID/qr")
assert_eq "GET /products/:id/qr → 200" "200" "$QR_STATUS"

QR_CT=$(curl -sf -o /dev/null -w "%{content_type}" "$BASE/products/$PRODUCT_ID/qr" 2>/dev/null || echo "")
assert_eq "GET /products/:id/qr → image/png" "image/png" "$QR_CT"

# ── Summary ──────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}────────────────────────────────${NC}"
echo -e "結果：${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
