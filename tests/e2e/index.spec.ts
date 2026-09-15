import { expect, test } from '@playwright/test';

test('loads, filters and switches language', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Airport to Tower');
  await expect(page.getByText('150 cities', { exact: true })).toBeVisible();
  await expect(page.getByText(/Airport eligibility and tower selections/)).toBeVisible();
  await page.getByLabel('Search').fill('Paris');
  const ranking = page.viewportSize()!.width <= 760 ? page.locator('.mobile-ranking') : page.locator('.table-wrap');
  await expect(ranking.getByText('Paris', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Índice global');
  await expect(page).toHaveURL(/lang=es/);
});

test('restores tower mode from the URL', async ({ page }) => {
  await page.goto('/?mode=iconic');
  await expect(page.getByRole('button', { name: 'Iconic' })).toHaveAttribute('aria-pressed', 'true');
});

test('opens a detail record and restores it with browser history', async ({ page }) => {
  await page.goto('/');
  const mobile = page.viewportSize()!.width <= 760;
  const row = mobile ? page.locator('.mobile-ranking button').first() : page.locator('tbody .row-button').first();
  await row.click();
  await expect(page.locator('.detail-panel')).toBeVisible();
  await expect(page.locator('.detail-panel').getByText('Observation details')).toBeVisible();
  await expect(page).toHaveURL(/selected=/);
  await page.goBack();
  await expect(page.locator('.detail-panel')).toHaveCount(0);
});

test('selects an index base and has no horizontal viewport overflow', async ({ page }) => {
  await page.goto('/');
  const firstOption = await page.locator('#base-options option').first().getAttribute('value');
  expect(firstOption).toBeTruthy();
  await page.locator('#base-search').fill(firstOption!);
  await expect(page).toHaveURL(/base=/);
  await expect(page.getByText(/Choose one observation as 100/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
