import { expect, test } from "@playwright/test";

/**
 * Classic analysis flow. The model route is mocked, so no DeepSeek call is made. The test proves
 * that opening a reading never calls the interpret route, and that only the explicit button does.
 */
test("@smoke classic analysis shows first; AI runs only after the button is pressed", async ({ page }) => {
  let interpretCalls = 0;
  await page.route("**/api/readings/interpret", async (route) => {
    interpretCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reading: "## Answer\nMocked answer.\n\n## Reading\nMocked reading.", source: "deepseek" }),
    });
  });

  await page.goto("/read/new");
  await page.getByLabel("Your Question").fill("Will this situation move forward?");
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: /3-Card Sentence/ }).click();
  await page.getByRole("button", { name: "Virtual Deck" }).click();
  await page.getByRole("button", { name: "Draw 3 Cards", exact: true }).click();

  await expect(page.getByText("Classic analysis", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Interpret with AI" })).toBeVisible();
  expect(interpretCalls).toBe(0);

  await page.getByRole("button", { name: "Interpret with AI" }).click();
  await expect(page.getByText("Mocked answer.")).toBeVisible();
  expect(interpretCalls).toBe(1);
  // The classic analysis is still available after the AI result.
  await expect(page.getByText("Classic analysis", { exact: true }).first()).toBeVisible();
  expect(interpretCalls).toBe(1);
});

test("@smoke shared link opens without a model call and offers the same AI button", async ({ page }) => {
  let interpretCalls = 0;
  await page.route("**/api/readings/interpret", async (route) => {
    interpretCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reading: "## Answer\nShared mocked answer.", source: "deepseek" }),
    });
  });

  // Build a real share link through the existing share endpoint, then open it.
  const share = await page.request.post("/api/readings/share", {
    // The same compact payload the app's share button sends (see buildSharePayload).
    data: {
      t: "Lenormand Reading",
      q: "Will this situation move forward?",
      l: 3,
      c: [
        { i: 1, p: 0, n: "Rider", cn: "Rider" },
        { i: 2, p: 1, n: "Clover", cn: "Clover" },
        { i: 3, p: 2, n: "Ship", cn: "Ship" },
      ],
      a: "",
      s: "sentence-3",
    },
  });
  expect(share.ok()).toBeTruthy();
  const { encoded } = await share.json();

  await page.goto(`/read/shared/${encodeURIComponent(encoded)}`);
  await expect(page.getByText("Classic analysis", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Interpret with AI" })).toBeVisible();
  expect(interpretCalls).toBe(0);

  await page.getByRole("button", { name: "Interpret with AI" }).click();
  await expect(page.getByText("Shared mocked answer.")).toBeVisible();
  expect(interpretCalls).toBe(1);
});
