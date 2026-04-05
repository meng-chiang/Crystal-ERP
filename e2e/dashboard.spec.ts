import { test, expect } from '@playwright/test';

test.describe('看板總覽', () => {
  test('載入統計卡片', async ({ page }) => {
    await page.goto('/dashboard');

    // 頁面標題
    await expect(page.getByRole('heading', { name: '看板總覽' })).toBeVisible();

    // 4 張統計卡片都要出現
    await expect(page.getByText('在庫商品')).toBeVisible();
    await expect(page.getByText('在庫市值（標價）')).toBeVisible();
    await expect(page.getByText('已售件數')).toBeVisible();
    await expect(page.getByText('已實現毛利')).toBeVisible();
  });

  test('分類在庫與近期銷售區塊', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText('在庫分類分布')).toBeVisible();
    await expect(page.getByText('近期銷售')).toBeVisible();
  });

  test('根路徑重導向至看板', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
