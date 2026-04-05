import { test, expect } from '@playwright/test';
import { createTestCategory, cleanupProduct, cleanupCategory } from './helpers';

test.describe('商品庫存', () => {
  let categoryId: number;

  test.beforeAll(async () => {
    categoryId = await createTestCategory();
  });

  test.afterAll(async () => {
    await cleanupCategory(categoryId);
  });

  test('商品列表頁載入', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: '商品庫存' })).toBeVisible();
    await expect(page.getByPlaceholder('搜尋商品名稱...')).toBeVisible();
  });

  test('新增商品完整流程', async ({ page }) => {
    await page.goto('/products/new');

    await expect(page.getByRole('heading', { name: '新增商品' })).toBeVisible();

    // 填寫表單
    await page.getByLabel('商品名稱').fill('E2E 紫水晶柱');
    await page.getByLabel('進貨價（成本）').fill('800');
    await page.getByLabel('標售價').fill('1500');
    await page.getByLabel('重量 (g)').fill('200');
    await page.getByLabel('品相描述').fill('冰裂少，光澤均勻');

    // 選分類（下拉）
    await page.getByLabel('分類').selectOption({ label: '測試分類' });

    // 送出
    await page.getByRole('button', { name: '儲存商品' }).click();

    // 應跳轉到詳情頁或商品列表
    await page.waitForURL(/\/products\/\d+/, { timeout: 8000 });

    // 詳情頁顯示商品名稱
    await expect(page.getByText('E2E 紫水晶柱')).toBeVisible();
  });

  test('搜尋商品', async ({ page }) => {
    await page.goto('/products');

    const search = page.getByPlaceholder('搜尋商品名稱...');
    await search.fill('E2E');

    // 至少出現我們剛建立的商品
    await expect(page.getByText('E2E 紫水晶柱')).toBeVisible({ timeout: 5000 });
  });

  test('篩選功能展開', async ({ page }) => {
    await page.goto('/products');

    await page.getByRole('button', { name: '篩選' }).click();
    await expect(page.getByText('狀態')).toBeVisible();
    await expect(page.getByText('分類')).toBeVisible();
  });

  test('商品詳情頁', async ({ page }) => {
    await page.goto('/products');

    // 點第一筆商品卡片
    const card = page.locator('a[href^="/products/"]').first();
    await card.click();

    await expect(page).toHaveURL(/\/products\/\d+/);

    // 必要資訊存在
    await expect(page.getByText('進貨價（成本）')).toBeVisible();
    await expect(page.getByText('標售價')).toBeVisible();
    await expect(page.getByText('QR Code')).toBeVisible();
    await expect(page.getByText('相片管理')).toBeVisible();
  });

  test('商品詳情 — 有編輯按鈕', async ({ page }) => {
    await page.goto('/products');
    const card = page.locator('a[href^="/products/"]').first();
    const href = await card.getAttribute('href');
    await page.goto(href!);

    await expect(page.getByRole('link', { name: '編輯' })).toBeVisible();
  });

  test('刪除 in_stock 商品', async ({ page }) => {
    // 建立一筆專門用來刪的商品
    const res = await fetch('http://localhost:3001/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '待刪商品',
        categoryId,
        costPrice: '100',
        listPrice: '200',
      }),
    });
    const json = await res.json();
    const pid = json.data.id;

    await page.goto(`/products/${pid}`);
    await expect(page.getByText('刪除此商品')).toBeVisible();

    await page.getByRole('button', { name: '刪除此商品' }).click();
    await page.getByRole('button', { name: '確認刪除' }).click();

    await page.waitForURL('/products', { timeout: 8000 });
    await expect(page.getByRole('heading', { name: '商品庫存' })).toBeVisible();
  });
});
