import { test, expect } from '@playwright/test';
import { apiDelete } from './helpers';

test.describe('分類管理', () => {
  let createdId: number | null = null;

  test.afterEach(async () => {
    if (createdId !== null) {
      await apiDelete(`/categories/${createdId}`).catch(() => {});
      createdId = null;
    }
  });

  test('顯示分類設定頁', async ({ page }) => {
    await page.goto('/settings/categories');
    await expect(page.getByRole('heading', { name: '商品分類管理' })).toBeVisible();
  });

  test('新增分類', async ({ page }) => {
    await page.goto('/settings/categories');

    // Placeholders from the actual form
    await page.getByPlaceholder('例：紫水晶').fill('E2E 測試石');
    await page.getByPlaceholder('例：AM（Amethyst）').fill('ETT');   // must be [A-Z]+ only
    await page.getByRole('button', { name: '新增分類' }).click();

    // Category appears in the list — use exact:true to avoid matching the toast message
    await expect(page.getByText('E2E 測試石', { exact: true })).toBeVisible({ timeout: 5000 });

    const res = await fetch('http://localhost:3001/api/v1/categories');
    const json = await res.json();
    const found = json.data.find((c: { nameEn: string; id: number }) => c.nameEn === 'ETT');
    if (found) createdId = found.id;
  });

  test('刪除分類', async ({ page }) => {
    const res = await fetch('http://localhost:3001/api/v1/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '刪除測試', nameEn: 'DEL' }),
    });
    const json = await res.json();
    createdId = json.data.id;

    await page.goto('/settings/categories');
    await expect(page.getByText('刪除測試')).toBeVisible();

    // DOM: <div class="flex..."><div><span>刪除測試</span>...</div><button>...</button></div>
    // Need to go up 2 levels from the text span to reach the flex row, then find the button
    await page.getByText('刪除測試').locator('../..').getByRole('button').click();

    await page.getByRole('button', { name: '確認刪除' }).click();

    await expect(page.getByText('刪除測試')).not.toBeVisible({ timeout: 5000 });
    createdId = null;
  });
});
