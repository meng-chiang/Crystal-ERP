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

    await page.getByPlaceholder('例：紫水晶').fill('E2E 測試石');
    await page.getByPlaceholder('例：AM').fill('E2T');
    await page.getByRole('button', { name: '新增' }).click();

    // 成功 toast 或名稱出現在列表
    await expect(page.getByText('E2E 測試石')).toBeVisible({ timeout: 5000 });

    // 取得剛建立的 id 以供清除
    const res = await fetch('http://localhost:3001/api/v1/categories');
    const json = await res.json();
    const found = json.data.find((c: { nameEn: string; id: number }) => c.nameEn === 'E2T');
    if (found) createdId = found.id;
  });

  test('刪除分類', async ({ page }) => {
    // 先用 API 建一筆，再從 UI 刪除
    const res = await fetch('http://localhost:3001/api/v1/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '刪除測試', nameEn: 'DEL' }),
    });
    const json = await res.json();
    createdId = json.data.id;

    await page.goto('/settings/categories');
    await expect(page.getByText('刪除測試')).toBeVisible();

    // 點刪除按鈕
    const row = page.getByText('刪除測試').locator('..');
    await row.getByRole('button').click();

    // 確認 Dialog
    await page.getByRole('button', { name: '確認刪除' }).click();

    // 項目消失
    await expect(page.getByText('刪除測試')).not.toBeVisible({ timeout: 5000 });
    createdId = null;
  });
});
