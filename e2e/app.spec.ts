import { test, expect } from "@playwright/test";

test.describe("Sentinel Field", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Sentinel Field")).toBeVisible();
    await expect(page.locator("text=Pest Control Operations")).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/sign-up/);
  });

  test("unauthenticated users are redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("landing page has pricing section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Simple, Transparent Pricing")).toBeVisible();
    await expect(page.locator("text=Starter")).toBeVisible();
    await expect(page.locator("text=Professional")).toBeVisible();
    await expect(page.locator("text=Enterprise")).toBeVisible();
  });
});
