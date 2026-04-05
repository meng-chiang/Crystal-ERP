import { test, expect } from '@playwright/test';
import { createTestCategory, createTestProduct, cleanupCategory, apiDelete } from './helpers';

test.describe('銷售紀錄', () => {
  let categoryId: number;
  let productId: number;

  test.beforeAll(async () => {
    categoryId = await createTestCategory();
    productId = await createTestProduct(categoryId);
  });

  test.afterAll(async () => {
    // product may have been sold; try delete sale first if needed
    // just clean category (cascade or best-effort)
    await cleanupCategory(categoryId);
  });

  test('銷售紀錄頁載入', async ({ page }) => {
    await page.goto('/sales');
    await expect(page.getByRole('heading', { name: '銷售紀錄' })).toBeVisible();
    await expect(page.getByRole('link', { name: '記錄銷售' })).toBeVisible();
  });

  test('新增銷售完整流程', async ({ page }) => {
    await page.goto(`/sales/new?productId=${productId}`);

    await expect(page.getByRole('heading', { name: '記錄銷售' })).toBeVisible();

    // 商品應該已預填
    await expect(page.getByText('測試紫水晶原石')).toBeVisible({ timeout: 5000 });

    // 填寫成交價
    await page.getByLabel('成交價').fill('850');

    // 選通路
    await page.getByLabel('通路').selectOption('line');

    // 日期（預設今天，不改）

    // 送出
    await page.getByRole('button', { name: '確認記錄' }).click();

    // 跳轉到銷售列表
    await page.waitForURL('/sales', { timeout: 8000 });

    // 商品名稱出現在列表
    await expect(page.getByText('測試紫水晶原石')).toBeVisible({ timeout: 5000 });
  });

  test('銷售列表顯示毛利欄位', async ({ page }) => {
    await page.goto('/sales');
    await expect(page.getByRole('columnheader', { name: '毛利' })).toBeVisible();
  });

  test('刪除銷售紀錄還原商品狀態', async ({ page }) => {
    await page.goto('/sales');

    // 點最新一筆的刪除按鈕
    const deleteBtn = page.locator('tbody tr').first().getByRole('button');
    await deleteBtn.click();

    // 確認 Dialog
    await page.getByRole('button', { name: '確認刪除' }).click();

    // 等 toast 或紀錄消失（頁面重新載入）
    await page.waitForTimeout(1500);

    // 確認商品回到 in_stock（回到商品詳情看 badge）
    const productRes = await fetch(`http://localhost:3001/api/v1/products/${productId}`);
    const productJson = await productRes.json();
    expect(productJson.data.status).toBe('in_stock');
  });
});
