import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "../fixtures/test-helpers";

test.describe("Settings", () => {
    test.beforeEach(async ({ page }) => {
        await loginAsTestUser(page);
    });

    test("settings page loads with account section", async ({ page }) => {
        await page.goto("/settings");

        await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();

        // Should have Account section (use first() since multiple elements match)
        await expect(page.locator("text=Account").first()).toBeVisible({ timeout: 5000 });
    });

    test("settings page shows playback section", async ({ page }) => {
        await page.goto("/settings");

        // Should have Playback section (use first() since multiple elements match)
        await expect(page.locator("text=Playback").first()).toBeVisible({ timeout: 5000 });
    });
});
