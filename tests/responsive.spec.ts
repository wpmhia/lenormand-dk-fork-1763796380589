import { test, expect } from "@playwright/test";

const viewports = [
  { name: "small mobile", width: 360, height: 800 },
  { name: "large mobile", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small desktop", width: 1024, height: 900 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "wide desktop", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`home and shared shell fit at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.locator("h1").first()).toBeVisible();

    if (viewport.width < 768) {
      const menu = page.getByRole("button", { name: "Open mobile menu" });
      await expect(menu).toBeVisible();
      await menu.click();
      await expect(page.getByRole("button", { name: "Close mobile menu" })).toBeVisible();
      await expect(page.getByRole("navigation").last()).toBeVisible();
    } else {
      await expect(page.getByRole("navigation").first()).toBeVisible();
    }
  });
}

test("standard pages keep readable containers without horizontal overflow", async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/learn", "/cards", "/history", "/read/new"]) {
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, `${route} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  }
});
