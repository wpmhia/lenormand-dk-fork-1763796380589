
import { test, expect } from '@playwright/test';

test('Draw cards flow', async ({ page }) => {
  // Go to the new reading page
  await page.goto('/read/new');

  // Check if "Draw cards for me" button exists
  const drawButton = page.locator('button:has-text("Draw cards for me")');
  await expect(drawButton).toBeVisible();

  // Click it
  await drawButton.click();

  // Should navigate to step 2 (Drawing)
  // Check for "Draw 3 Cards" button (assuming default spread is 3 cards)
  const drawActionBtn = page.locator('button:has-text("Draw 3 Cards")');
  await expect(drawActionBtn).toBeVisible();

  // Click draw action
  await drawActionBtn.click();

  // Wait for drawing animation/process
  // After drawing, it should go to results
  // Check for "Your Reading" or similar text in results
  await expect(page.locator('text=Your Reading')).toBeVisible({ timeout: 10000 });
  
  // Check if cards are displayed
  const cards = page.locator('.reading-card'); // Assuming class name or similar structure, need to verify
  // Or check for card images
  await expect(page.locator('img[alt*="Card"]')).toHaveCount(3);
});
