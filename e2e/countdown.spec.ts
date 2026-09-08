import { test, expect } from "@playwright/test";

test.describe("Countdown Prelaunch Page (e2e-red-first)", () => {
  test("should render countdown page with background, title, and countdown units", async ({
    page,
  }) => {
    // Navigate to /countdown
    await page.goto("/countdown");

    // Assert page loaded successfully (not 404)
    await expect(page).toHaveURL("/countdown");

    // Assert full-bleed background image/element exists
    const backgroundElement = page.locator(
      "[data-testid='countdown-background'], [class*='background'], [class*='bg-image']"
    ).first();
    await expect(backgroundElement).toBeVisible();

    // Assert title text (locale-aware: VI default or EN)
    const titleElement = page.locator("h1, h2, span").filter({
      hasText: /Sự kiện sẽ bắt đầu sau|Event starts in/i,
    });
    await expect(titleElement).toBeVisible();

    // Assert countdown container and units exist
    const countdownContainer = page.locator(
      "[data-testid='countdown']"
    );
    await expect(countdownContainer).toBeVisible();

    // Assert DAYS unit (label and 2-digit value)
    const daysLabel = page.locator("text=/DAYS|Ngày/i").first();
    await expect(daysLabel).toBeVisible();

    // Assert HOURS unit (label and 2-digit value)
    const hoursLabel = page.locator("text=/HOURS|Giờ/i").first();
    await expect(hoursLabel).toBeVisible();

    // Assert MINUTES unit (label and 2-digit value)
    const minutesLabel = page.locator("text=/MINUTES|Phút/i").first();
    await expect(minutesLabel).toBeVisible();

    // Assert countdown values are present and 2-digit formatted
    // Get all text content and count 2-digit patterns
    const allText = await countdownContainer.textContent();
    if (allText) {
      const twoDigitMatches = allText.match(/\b\d{2}\b/g) || [];
      const foundTwoDigitValues = twoDigitMatches.length;
      // Expect at least 3 two-digit numbers (days, hours, minutes)
      expect(foundTwoDigitValues).toBeGreaterThanOrEqual(3);
    }
  });

  test("should not redirect home page to /countdown when gate is off (default)", async ({
    page,
  }) => {
    // With PRELAUNCH_GATE_ENABLED unset/false (default), home page should load normally
    await page.goto("/");

    // Assert we stay on / (no redirect to /countdown)
    await expect(page).toHaveURL("/");

    // Assert home page content loads (not countdown page)
    const homeTitle = page.locator("h1, h2").filter({
      hasText: /ROOT FURTHER/i,
    });
    await expect(homeTitle).toBeVisible();
  });

  test("should not redirect /login to /countdown when gate is off (default)", async ({
    page,
  }) => {
    // With PRELAUNCH_GATE_ENABLED unset/false (default), login page should load normally
    await page.goto("/login");

    // Assert we stay on /login (no redirect to /countdown)
    await expect(page).toHaveURL("/login");

    // Assert login page content is visible (not countdown page)
    const loginForm = page.locator("form, [class*='login'], [data-testid='login']").first();
    await expect(loginForm).toBeVisible();
  });

  test("should not redirect /todo to /countdown when gate is off (default)", async ({
    page,
  }) => {
    // With PRELAUNCH_GATE_ENABLED unset/false (default), todo page should load normally
    // (or redirect to login if auth is required, but NOT to countdown)
    await page.goto("/todo");

    // Assert we did NOT redirect to /countdown
    const url = page.url();
    expect(url).not.toContain("/countdown");
  });

  test("should not redirect /awards-information to /countdown when gate is off (default)", async ({
    page,
  }) => {
    // With PRELAUNCH_GATE_ENABLED unset/false (default), awards page should load or redirect to login
    // but NOT to /countdown
    await page.goto("/awards-information");

    // Assert we did NOT redirect to /countdown
    const url = page.url();
    expect(url).not.toContain("/countdown");
  });

  test("should not redirect /sun-kudos to /countdown when gate is off (default)", async ({
    page,
  }) => {
    // With PRELAUNCH_GATE_ENABLED unset/false (default), kudos page should load normally
    // but NOT redirect to /countdown
    await page.goto("/sun-kudos");

    // Assert we did NOT redirect to /countdown
    const url = page.url();
    expect(url).not.toContain("/countdown");
  });

  test("should display countdown in English when language is switched to EN", async ({
    page,
  }) => {
    // Navigate to /countdown
    await page.goto("/countdown");

    // If language selector is visible on /countdown, switch to EN and verify title updates
    const languageButton = page
      .locator("header [aria-haspopup='menu']")
      .first();

    // Only test if language button is present
    if (await languageButton.isVisible()) {
      // Click to open language menu
      await languageButton.click();

      // Assert EN option appears
      const enText = page.locator("text=/EN|English/i").first();
      await expect(enText).toBeVisible({ timeout: 2000 });

      // Click EN to switch locale
      await enText.click();

      // Wait for locale switch
      await page.waitForTimeout(500);

      // Verify title updated to English version
      const enTitle = page.locator("h1, h2, span").filter({
        hasText: /Event starts in/i,
      });
      await expect(enTitle).toBeVisible();
    }
  });
});
