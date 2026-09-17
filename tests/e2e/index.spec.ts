import { expect, test } from '@playwright/test';

test('loads, filters and switches language', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Airport to Tower');
  await expect(page.getByText(/173 cities/)).toBeVisible();
  await page.getByLabel('Search by name').fill('Paris');
  const ranking = page.viewportSize()!.width <= 760 ? page.locator('.mobile-ranking') : page.locator('.table-wrap');
  await expect(ranking.getByText('Paris', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Distancia de Aeropuerto a Torre - Índice Global');
  await expect(page).toHaveURL(/lang=es/);
});

test('shows 50 results per page and clears the name search', async ({ page }) => {
  await page.goto('/');
  const rows = page.viewportSize()!.width <= 760 ? page.locator('.mobile-ranking > li') : page.locator('tbody > tr');
  await expect(rows).toHaveCount(50);
  await page.getByRole('button', { name: 'Page 2' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText(/Showing 51–100 of/)).toBeVisible();
  await page.getByLabel('Search by name').fill('Paris');
  await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByLabel('Search by name')).toHaveValue('');
});

test('restores tower mode from the URL', async ({ page }) => {
  await page.goto('/?mode=iconic');
  await expect(page.getByRole('button', { name: 'Iconic' })).toHaveAttribute('aria-pressed', 'true');
});

test('opens a detail record and restores it with browser history', async ({ page }) => {
  await page.goto('/');
  const mobile = page.viewportSize()!.width <= 760;
  const row = mobile ? page.locator('.mobile-ranking .mobile-row-button').first() : page.locator('tbody .row-button').first();
  await row.click();
  await expect(page.locator('.detail-panel')).toBeVisible();
  await expect(page.locator('.detail-panel').getByText('Observation details')).toBeVisible();
  await expect(page).toHaveURL(/selected=/);
  await page.goBack();
  await expect(page.locator('.detail-panel')).toHaveCount(0);
});

test('selects an index base and has no horizontal viewport overflow', async ({ page }) => {
  await page.goto('/');
  const mobile = page.viewportSize()!.width <= 760;
  await page.locator(mobile ? '.mobile-base-button' : '.table-wrap .base-button').first().click();
  await expect(page).toHaveURL(/base=/);
  if (mobile) await expect(page.locator('.mobile-value small').first()).toBeVisible();
  else await expect(page.getByRole('columnheader', { name: /Index/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('removes obsolete service filters from restored URLs', async ({ page }) => {
  await page.goto('/?service=seasonal');
  await expect(page).not.toHaveURL(/service=/);
  await expect(page.getByText(/173 cities/)).toBeVisible();
});
