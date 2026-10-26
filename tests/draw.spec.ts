import { test, expect } from "@playwright/test";

test("@smoke virtual-deck draw flow selects the requested spread", async ({ page }) => {
  await page.goto("/read/new");

  await page.getByLabel("Your Question").fill("Will this situation move forward?");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /3-Card Sentence/ }).click();
  await page.getByRole("button", { name: "Draw the Cards" }).click();

  const drawActionButton = page.getByRole("button", { name: "Draw 3 Cards", exact: true });
  await expect(drawActionButton).toBeVisible();
  await drawActionButton.click();

  await expect(page.getByRole("button", { name: "Start New Reading" })).toBeVisible({
    timeout: 10000,
  });
});
