import { test, expect } from "@playwright/test";

test("@smoke home and card catalog render", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();

  await page.goto("/cards");
  await expect(page.locator("a[href^='/cards/']").first()).toBeVisible();
});

test("@smoke new reading fits a 360px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/read/new");
  await expect(page.getByLabel("Your Question")).toBeVisible();

  const layout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const content = document.documentElement.scrollWidth;
    const offenders = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: typeof element.className === "string" ? element.className : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((element) => element.right > viewport + 1 || element.left < -1)
      .slice(0, 5);
    return { viewport, content, offenders };
  });

  expect(layout.content, JSON.stringify(layout.offenders)).toBeLessThanOrEqual(layout.viewport + 1);
});
