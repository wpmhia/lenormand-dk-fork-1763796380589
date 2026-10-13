import { test, expect } from "@playwright/test";

test("@smoke home and card catalog render", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();

  await page.goto("/cards");
  await expect(page.locator("a[href^='/cards/']").first()).toBeVisible();
});
