import { test, expect } from '@playwright/test';

test.describe('Theme consistency', () => {
  test('should render consistently in light mode', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home-light.png');
  });

  test('should render consistently in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: 'Toggle theme' }).click();
    await page.locator('text=Dark').click();
    await expect(page).toHaveScreenshot('home-dark.png');
  });

  test('should render learn page consistently', async ({ page }) => {
    await page.goto('/learn');
    await expect(page).toHaveScreenshot('learn-light.png');

    await page.locator('button').filter({ hasText: 'Toggle theme' }).click();
    await page.locator('text=Dark').click();
    await expect(page).toHaveScreenshot('learn-dark.png');
  });
});