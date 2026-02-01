import { test, expect } from "@playwright/test";
import { loginAsTestUser, username, password } from "../fixtures/test-helpers";

test.describe("Authentication", () => {
    test("login with valid credentials redirects to home", async ({ page }) => {
        await page.goto("/login");
        await page.locator("#username").fill(username);
        await page.locator("#password").fill(password);
        await page.getByRole("button", { name: "Sign In" }).click();
        await page.waitForURL(/\/($|\?|home)/);
        await expect(page).not.toHaveURL(/login/);
    });

    test("login with invalid credentials shows error", async ({ page }) => {
        await page.goto("/login");
        await page.locator("#username").fill("invalid-user");
        await page.locator("#password").fill("wrong-password");
        await page.getByRole("button", { name: "Sign In" }).click();
        await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 5000 });
    });

    test("protected routes redirect to login when unauthenticated", async ({ page }) => {
        await page.goto("/albums");
        await expect(page).toHaveURL(/login/);
    });

    test("logout clears session and redirects to login", async ({ page }) => {
        await loginAsTestUser(page);

        // Open user menu and logout
        await page.getByRole("button", { name: /user|profile|account/i }).click();
        await page.getByRole("menuitem", { name: /logout|sign out/i }).click();

        await expect(page).toHaveURL(/login/);

        // Verify can't access protected route
        await page.goto("/albums");
        await expect(page).toHaveURL(/login/);
    });
});
