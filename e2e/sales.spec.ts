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

    // Product name shown in the selected-product card
    await expect(page.getByText('測試紫水晶原石')).toBeVisible({ timeout: 5000 });

    // 實際成交價 input (placeholder '0')
    await page.getByPlaceholder('0').fill('850');

    // 銷售通路 select (name="channel" from register('channel'))
    await page.locator('select[name="channel"]').selectOption('line');

    // Submit button text is '確認銷售'
    await page.getByRole('button', { name: '確認銷售' }).click();

    await page.waitForURL('/sales', { timeout: 8000 });
    await expect(page.getByText('測試紫水晶原石')).toBeVisible({ timeout: 5000 });
  });

  test('銷售列表顯示毛利欄位', async ({ page }) => {
    await page.goto('/sales');
    await expect(page.getByRole('columnheader', { name: '毛利' })).toBeVisible();
  });

  test('刪除銷售紀錄還原商品狀態', async ({ page }) => {
    await page.goto('/sales');

    const deleteBtn = page.locator('tbody tr').first().getByRole('button');
    await deleteBtn.click();

    await page.getByRole('button', { name: '確認刪除' }).click();

    await page.waitForTimeout(1500);

    const productRes = await fetch(`http://localhost:3001/api/v1/products/${productId}`);
    const productJson = await productRes.json();
    expect(productJson.data.status).toBe('in_stock');
  });
});
