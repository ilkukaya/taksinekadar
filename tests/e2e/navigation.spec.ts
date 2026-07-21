import { test, expect } from "@playwright/test";

test("site search finds a province and links to its tariff page", async ({ page }) => {
  await page.goto("/");
  await page.locator("#site-search-input").fill("Ankara");

  const results = page.locator("#site-search-results");
  await expect(results).toBeVisible();

  // "Ankara" also matches AŞTİ ("Ankara Şehirlerarası..."), which is the search index
  // correctly surfacing a second relevant result — pick the province result specifically.
  const provinceResult = results.getByRole("link", { name: "Ankara", exact: true });
  await expect(provinceResult).toBeVisible();

  await provinceResult.click();
  await expect(page).toHaveURL(/\/ankara-taksi-ucreti\/$/);
});

test("mobile menu opens via native details/summary with zero custom JavaScript", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const details = page.locator("header details");
  await expect(details).not.toHaveAttribute("open", "");

  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.getByRole("link", { name: "İller" })).toBeVisible();
});

test("keyboard navigation reaches the skip link first", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
});
