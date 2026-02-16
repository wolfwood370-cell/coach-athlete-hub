import { test, expect } from "../playwright-fixture";

test.describe("Core Auth & Navigation", () => {
  test("Public landing page loads with Accedi button", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CoachHub/i);
    const accediLink = page.getByRole("link", { name: /accedi/i });
    await expect(accediLink).toBeVisible();
  });

  test("Auth page renders login form", async ({ page }) => {
    await page.goto("/auth");
    // Should show email and password fields
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("Protected route /coach redirects unauthenticated users", async ({ page }) => {
    await page.goto("/coach");
    // Should redirect to /auth or show login
    await page.waitForTimeout(2000);
    const url = page.url();
    // Either redirected to auth or shows auth content
    const isOnAuth = url.includes("/auth");
    const hasLoginForm = await page.getByPlaceholder(/email/i).isVisible().catch(() => false);
    expect(isOnAuth || hasLoginForm).toBeTruthy();
  });

  test("Protected route /athlete redirects unauthenticated users", async ({ page }) => {
    await page.goto("/athlete");
    await page.waitForTimeout(2000);
    const url = page.url();
    const isOnAuth = url.includes("/auth");
    const hasLoginForm = await page.getByPlaceholder(/email/i).isVisible().catch(() => false);
    expect(isOnAuth || hasLoginForm).toBeTruthy();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-route-xyz");
    await page.waitForTimeout(1000);
    const notFoundText = page.getByText(/404|non trovata|not found/i);
    await expect(notFoundText).toBeVisible();
  });
});
