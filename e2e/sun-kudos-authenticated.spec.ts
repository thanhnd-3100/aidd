import { test, expect } from "@playwright/test";

test.describe("Sun* Kudos Board (authenticated as An)", () => {
  // Smoke test proving the whole auth mechanic works: a real authenticated
  // session (from e2e/auth.setup.ts's storageState) makes the Server
  // Component's `supabase.auth.getUser()` check pass, so "Ghi nhận" opens
  // the composer dialog instead of redirecting to /login. Kept first and
  // executable (not test.fixme) — everything below it is un-fixme'd by
  // phase 05.
  test("clicking 'Ghi nhận' while authenticated opens the composer dialog", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    const ghinhanButton = page.getByTestId("ghi-nhan-button");
    await expect(ghinhanButton).toBeVisible();
    await ghinhanButton.click();

    const composerDialog = page.getByRole("dialog");
    await expect(composerDialog).toBeVisible();

    // Stayed on /sun-kudos rather than being redirected to /login — the
    // one assertion that would fail if the session were not real.
    await expect(page).toHaveURL("/sun-kudos");
  });

  test.fixme(
    "should open composer modal when authenticated user clicks 'Ghi nhận'",
    async ({ page }) => {
      // NOTE: This test requires proper server-side authentication.
      // Playwright's page.route() intercepts browser-side XHR/fetch,
      // but the app's auth check happens in a Next.js Server Component
      // (getUser() reads cookies directly), which page.route() cannot stub.
      // See clarifications.md session 'takumi execution' for details.

      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "test-user-id",
              email: "test@example.com",
              user_metadata: {
                role: "user",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/sun-kudos");

      // Click the "Ghi nhận" button
      const ghinhanButton = page.locator("button, a").filter({
        hasText: /Ghi nhận/i,
      });
      await ghinhanButton.click();

      // Assert composer modal opens
      const composerModal = page.locator(
        "[data-testid='composer-modal'], [role='dialog']"
      ).first();
      await expect(composerModal).toBeVisible({ timeout: 2000 });
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should disable 'Gửi' button until recipient, content, and ≥1 hashtag are filled",
    async ({ page }) => {
      // NOTE: This test requires authenticated session (see above for limitation).

      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "test-user-id",
              email: "test@example.com",
              user_metadata: {
                role: "user",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/sun-kudos");

      // Click the "Ghi nhận" button to open the composer
      const ghinhanButton = page.locator("button, a").filter({
        hasText: /Ghi nhận/i,
      });
      await ghinhanButton.click();

      // Wait for modal to open
      const composerModal = page.locator(
        "[data-testid='composer-modal'], [role='dialog']"
      ).first();
      await expect(composerModal).toBeVisible({ timeout: 2000 });

      // Assert "Gửi" button is initially disabled
      const submitButton = page.locator("button").filter({
        hasText: /Gửi/i,
      });
      await expect(submitButton).toBeDisabled();

      // Fill in recipient (search and select)
      const recipientInput = page.locator(
        "[data-testid='recipient-input'], input[placeholder*='recipient' i], input[placeholder*='người nhận' i]"
      ).first();
      await recipientInput.fill("test");
      await page.waitForTimeout(200);

      // Select first result or assume filled
      const recipientOption = page.locator(
        "[data-testid='recipient-option'], [role='option']"
      ).first();
      if (await recipientOption.isVisible({ timeout: 500 }).catch(() => false)) {
        await recipientOption.click();
      }

      // Button should still be disabled (missing content and hashtag)
      await expect(submitButton).toBeDisabled();

      // Fill content
      const contentInput = page.locator(
        "[data-testid='content-input'], textarea[placeholder*='content' i], textarea[placeholder*='nội dung' i]"
      ).first();
      await contentInput.fill("Great work!");

      // Button should still be disabled (missing hashtag)
      await expect(submitButton).toBeDisabled();

      // Add a hashtag
      const hashtagInput = page.locator(
        "[data-testid='hashtag-input'], input[placeholder*='hashtag' i], input[placeholder*='thẻ' i]"
      ).first();
      await hashtagInput.fill("teamwork");
      await hashtagInput.press("Enter");
      await page.waitForTimeout(200);

      // Now "Gửi" should be enabled
      await expect(submitButton).toBeEnabled();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should close composer modal when 'Hủy' button is clicked without submitting",
    async ({ page }) => {
      // NOTE: This test requires authenticated session (see above for limitation).

      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "test-user-id",
              email: "test@example.com",
              user_metadata: {
                role: "user",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/sun-kudos");

      // Click the "Ghi nhận" button to open the composer
      const ghinhanButton = page.locator("button, a").filter({
        hasText: /Ghi nhận/i,
      });
      await ghinhanButton.click();

      // Wait for modal to open
      const composerModal = page.locator(
        "[data-testid='composer-modal'], [role='dialog']"
      ).first();
      await expect(composerModal).toBeVisible({ timeout: 2000 });

      // Click "Hủy" button
      const cancelButton = page.locator("button").filter({
        hasText: /Hủy/i,
      });
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Assert modal closes
      await expect(composerModal).not.toBeVisible();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should close composer and add new kudos to feed on valid submit",
    async ({ page }) => {
      // NOTE: This test requires authenticated session and backend API integration.
      // See above for server-side auth limitation.

      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "test-user-id",
              email: "test@example.com",
              user_metadata: {
                role: "user",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/sun-kudos");

      // Click the "Ghi nhận" button
      const ghinhanButton = page.locator("button, a").filter({
        hasText: /Ghi nhận/i,
      });
      await ghinhanButton.click();

      // Wait for modal
      const composerModal = page.locator(
        "[data-testid='composer-modal'], [role='dialog']"
      ).first();
      await expect(composerModal).toBeVisible({ timeout: 2000 });

      // Fill form fields
      const recipientInput = page.locator(
        "[data-testid='recipient-input'], input[placeholder*='recipient' i], input[placeholder*='người nhận' i]"
      ).first();
      await recipientInput.fill("Colleague");
      await page.waitForTimeout(200);

      const recipientOption = page.locator(
        "[data-testid='recipient-option'], [role='option']"
      ).first();
      if (await recipientOption.isVisible({ timeout: 500 }).catch(() => false)) {
        await recipientOption.click();
      }

      const contentInput = page.locator(
        "[data-testid='content-input'], textarea[placeholder*='content' i], textarea[placeholder*='nội dung' i]"
      ).first();
      await contentInput.fill("Excellent contribution!");

      const hashtagInput = page.locator(
        "[data-testid='hashtag-input'], input[placeholder*='hashtag' i], input[placeholder*='thẻ' i]"
      ).first();
      await hashtagInput.fill("leadership");
      await hashtagInput.press("Enter");

      // Click submit
      const submitButton = page.locator("button").filter({
        hasText: /Gửi/i,
      });
      await submitButton.click();

      // Assert modal closes
      await expect(composerModal).not.toBeVisible();

      // Assert new kudos card appears in feed (should replace empty state)
      const kudosCard = page.locator(
        "[data-testid='kudos-card'], [class*='card']"
      ).first();
      await expect(kudosCard).toBeVisible({ timeout: 2000 });

      // Assert the content appears in the feed
      const newKudosText = page.locator("text=/Excellent contribution/i");
      await expect(newKudosText).toBeVisible();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should allow liking a kudos authored by another user",
    async ({ page }) => {
      // NOTE: This test requires authenticated session and pre-existing kudos data.
      // See above for server-side auth limitation.

      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "test-user-id",
              email: "test@example.com",
              user_metadata: {
                role: "user",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/sun-kudos");

      // Wait for kudos cards to load (assumes some exist)
      const kudosCard = page.locator(
        "[data-testid='kudos-card'], [class*='card']"
      ).first();
      await expect(kudosCard).toBeVisible({ timeout: 2000 });

      // Click the heart button on the first kudos
      const likeButton = page.locator(
        "[data-testid='like-button'], button[aria-label*='like' i], button[aria-label*='heart' i]"
      ).first();
      const initialLikeCount = await likeButton
        .locator("text=/\\d+/")
        .textContent();

      await likeButton.click();

      // Assert like count increments
      const newLikeCount = await likeButton
        .locator("text=/\\d+/")
        .textContent();
      expect(parseInt(newLikeCount || "0")).toBeGreaterThan(
        parseInt(initialLikeCount || "0")
      );

      // Assert button becomes disabled (can't like again)
      await expect(likeButton).toBeDisabled();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should disable heart button on kudos authored by the current user",
    async ({ page }) => {
      // NOTE: This test requires authenticated session and a kudos authored by the test user.
      // See above for server-side auth limitation.

      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "test-user-id",
              email: "test@example.com",
              user_metadata: {
                role: "user",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/sun-kudos");

      // Wait for kudos cards to load
      const kudosCards = page.locator(
        "[data-testid='kudos-card'], [class*='card']"
      );
      await expect(kudosCards.first()).toBeVisible({ timeout: 2000 });

      // Find a card that shows the current user is the author
      // Look for a card with "by me" or "Tôi" or similar indicator
      const myKudosCard = page.locator(
        "[data-testid='kudos-card'], [class*='card']"
      ).filter({
        has: page.locator("text=/by me|Tôi|By you/i"),
      }).first();

      if (await myKudosCard.isVisible({ timeout: 500 }).catch(() => false)) {
        // Find the heart button on this card
        const likeButton = myKudosCard.locator(
          "[data-testid='like-button'], button[aria-label*='like' i], button[aria-label*='heart' i]"
        ).first();

        // Assert button is disabled
        await expect(likeButton).toBeDisabled();
      }
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );
});
