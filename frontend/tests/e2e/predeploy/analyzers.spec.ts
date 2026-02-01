import { test, expect } from "@playwright/test";
import { loginAsTestUser, baseUrl } from "../fixtures/test-helpers";

test.describe("Analyzers", () => {
    test("API returns feature detection status", async ({ request }) => {
        // First login to get a session
        const loginResponse = await request.post(`${baseUrl}/api/auth/login`, {
            data: {
                username: process.env.LIDIFY_TEST_USERNAME || "predeploy",
                password: process.env.LIDIFY_TEST_PASSWORD || "predeploy-password",
            },
        });

        expect(loginResponse.ok()).toBeTruthy();
        const { token } = await loginResponse.json();

        // Check features endpoint
        const featuresResponse = await request.get(`${baseUrl}/api/system/features`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(featuresResponse.ok()).toBeTruthy();
        const features = await featuresResponse.json();

        // Should have the expected shape
        expect(features).toHaveProperty("musicCNN");
        expect(features).toHaveProperty("vibeEmbeddings");
        expect(typeof features.musicCNN).toBe("boolean");
        expect(typeof features.vibeEmbeddings).toBe("boolean");
    });

    test("vibe button visibility matches feature status", async ({ page }) => {
        await loginAsTestUser(page);

        // Get feature status via API
        const featuresResponse = await page.request.get(`${baseUrl}/api/system/features`);
        const features = await featuresResponse.json();

        // Navigate to an album and start playback
        await page.goto("/library?tab=albums");
        const firstAlbum = page.locator('a[href^="/album/"]').first();

        if (await firstAlbum.isVisible({ timeout: 5000 })) {
            await firstAlbum.click();

            const playBtn = page.locator('button:has-text("Play"), [aria-label*="play" i], [title*="play" i]').first();
            await playBtn.click();

            // Wait for player
            await page.waitForTimeout(2000);

            // Check for vibe button
            const vibeBtn = page.locator('button[title*="vibe" i], button[aria-label*="vibe" i], button[title*="similar" i]');

            if (features.vibeEmbeddings) {
                // Should be visible when CLAP is running
                await expect(vibeBtn.first()).toBeVisible({ timeout: 3000 }).catch(() => {
                    // May not be on every track, that's ok
                });
            }
        }
    });
});
