/**
 * Shared helpers for E2E tests.
 * All API calls go directly to the backend to set up / tear down test data.
 */

const API = 'http://localhost:3001/api/v1';

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE' });
  if (res.status !== 204) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

/** Creates a test category and returns its id. */
export async function createTestCategory(): Promise<number> {
  const res = await apiPost('/categories', { name: '測試分類', nameEn: 'TST' });
  return res.data.id;
}

/** Creates a test product under the given category and returns its id. */
export async function createTestProduct(categoryId: number): Promise<number> {
  const res = await apiPost('/products', {
    name: '測試紫水晶原石',
    categoryId,
    costPrice: '500',
    listPrice: '900',
    weightG: '120',   // must be string — schema uses z.string().regex(...)
  });
  return res.data.id;
}

/** Cleans up a product and its category (best-effort). */
export async function cleanupProduct(productId: number) {
  try { await apiDelete(`/products/${productId}`); } catch { /* already deleted */ }
}

export async function cleanupCategory(categoryId: number) {
  try { await apiDelete(`/categories/${categoryId}`); } catch { /* already deleted */ }
}
