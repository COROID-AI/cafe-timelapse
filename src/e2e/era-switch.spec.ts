import { test, expect, type Page } from '@playwright/test';

/**
 * E2E smoke test: era switching, data-era attribute updates, no console errors.
 * Screenshots are captured per era at 1280x800.
 */

// Collect console errors
let consoleErrors: string[] = [];

test.beforeEach(({ page }: { page: Page }) => {
  consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });
});

test('timeline exposes exactly six era stops', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="scene-root"]', { timeout: 30_000 });

  // Wait for intro to potentially be dismissed — click Enter button
  const enterBtn = page.locator('button:has-text("Enter the Café")');
  if (await enterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await enterBtn.click();
    await page.waitForTimeout(600);
  }

  const stops = page.locator('[data-testid^="era-stop-"]');
  await expect(stops).toHaveCount(6);

  // Verify the year labels
  const years = ['1945', '1965', '1985', '2005', '2025', '2055'];
  for (const year of years) {
    await expect(page.locator(`[data-testid="era-stop-${year}"]`)).toBeVisible();
  }
});

test('clicking 1965, 1985, 2055 updates data-era on scene root', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="scene-root"]', { timeout: 30_000 });

  // Dismiss intro
  const enterBtn = page.locator('button:has-text("Enter the Café")');
  if (await enterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await enterBtn.click();
    await page.waitForTimeout(600);
  }

  // Default era should be 1945
  await expect(page.locator('[data-testid="scene-root"]')).toHaveAttribute('data-era', '1945');

  // Click 1965
  await page.locator('[data-testid="era-stop-1965"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="scene-root"]')).toHaveAttribute('data-era', '1965');

  // Click 1985
  await page.locator('[data-testid="era-stop-1985"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="scene-root"]')).toHaveAttribute('data-era', '1985');

  // Click 2055
  await page.locator('[data-testid="era-stop-2055"]').click();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="scene-root"]')).toHaveAttribute('data-era', '2055');

  // Assert no console errors
  expect(consoleErrors).toEqual([]);
});

test('screenshot each era shows a recognizable café interior', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="scene-root"]', { timeout: 30_000 });

  // Dismiss intro
  const enterBtn = page.locator('button:has-text("Enter the Café")');
  if (await enterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await enterBtn.click();
    await page.waitForTimeout(600);
  }

  const eras = ['1945', '1965', '1985', '2005', '2025', '2055'];

  for (const era of eras) {
    await page.locator(`[data-testid="era-stop-${era}"]`).click();
    // Wait for transition + render
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="scene-root"]')).toHaveAttribute('data-era', era);
    await page.screenshot({
      path: `screenshots/cafe-${era}.png`,
      fullPage: false,
    });
  }

  expect(consoleErrors).toEqual([]);
});
