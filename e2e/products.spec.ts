import { test, expect } from '@playwright/test';
import { createTestCategory, cleanupCategory } from './helpers';

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
    await expect(page.getByRole('heading', { name: '新增水晶商品' })).toBeVisible();

    // Use name attributes set by react-hook-form register() — unambiguous
    await page.locator('input[name="name"]').fill('E2E 紫水晶柱');
    await page.locator('input[name="weightG"]').fill('200');
    await page.locator('input[name="costPrice"]').fill('800');
    await page.locator('input[name="listPrice"]').fill('1500');
    await page.locator('textarea[name="qualityDescription"]').fill('冰裂少，光澤均勻');
    await page.locator('select[name="categoryId"]').selectOption({ label: '測試分類' });

    await page.getByRole('button', { name: '儲存商品' }).click();

    // After save, the form shows a photo-upload step with a "完成" button
    await expect(page.getByRole('button', { name: '完成，前往商品頁' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: '完成，前往商品頁' }).click();

    await page.waitForURL(/\/products\/\d+/, { timeout: 8000 });
    await expect(page.locator('h1').filter({ hasText: 'E2E 紫水晶柱' })).toBeVisible();
  });

  test('搜尋商品', async ({ page }) => {
    await page.goto('/products');

    await page.getByPlaceholder('搜尋商品名稱...').fill('E2E');
    await expect(page.getByText('E2E 紫水晶柱').first()).toBeVisible({ timeout: 5000 });
  });

  test('篩選功能展開', async ({ page }) => {
    await page.goto('/products');

    await page.getByRole('button', { name: '篩選' }).click();

    // '篩選條件' is the sidebar header, always visible when open
    await expect(page.getByText('篩選條件')).toBeVisible();
    // '狀態' is the section label inside ProductFilters
    await expect(page.getByText('狀態', { exact: true })).toBeVisible();
  });

  test('商品詳情頁', async ({ page }) => {
    await page.goto('/products');

    // Exclude /products/new (the "新增水晶" header button) from the match
    const card = page.locator('a[href^="/products/"]:not([href="/products/new"])').first();
    await card.click();

    await expect(page).toHaveURL(/\/products\/\d+/);
    await expect(page.getByText('進貨價（成本）')).toBeVisible();
    await expect(page.getByText('標售價')).toBeVisible();
    await expect(page.getByText('QR Code')).toBeVisible();
    await expect(page.getByText('相片管理')).toBeVisible();
  });

  test('商品詳情 — 有編輯按鈕', async ({ page }) => {
    await page.goto('/products');
    const card = page.locator('a[href^="/products/"]:not([href="/products/new"])').first();
    const href = await card.getAttribute('href');
    await page.goto(href!);

    await expect(page.getByRole('link', { name: '編輯' })).toBeVisible();
  });

  test('刪除 in_stock 商品', async ({ page }) => {
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
