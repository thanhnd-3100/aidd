import { test, expect } from "@playwright/test";

test.describe("Home Page (e2e-red-first)", () => {
  test("should render all major sections on the homepage", async ({ page }) => {
    // Navigate to home
    await page.goto("/");

    // Assert header/chrome section exists
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Assert hero section with "ROOT FURTHER" title
    const heroTitle = page.locator("h1, h2").filter({
      hasText: /ROOT FURTHER/i,
    });
    await expect(heroTitle).toBeVisible();

    // Assert countdown section exists and displays numeric values
    const countdown = page.locator("[data-testid='countdown']");
    await expect(countdown).toBeVisible();

    // Assert event info section (tagline/subtitle) - target the awards-grid caption specifically using class selector
    const eventInfo = page.locator("[class*='awards-grid'] p, [class*='awards-grid-module'] p").first();
    await expect(eventInfo).toBeVisible();

    // Assert CTA buttons exist for awards and kudos
    const aboutAwardsBtn = page
      .locator("button, a")
      .filter({ hasText: /ABOUT AWARDS/i })
      .first();
    await expect(aboutAwardsBtn).toBeVisible();

    const aboutKudosBtn = page
      .locator("button, a")
      .filter({ hasText: /ABOUT KUDOS/i })
      .first();
    await expect(aboutKudosBtn).toBeVisible();

    // Assert award cards section (at least 6 cards)
    const awardCards = page.locator("[data-testid='award-card']");
    await expect(awardCards).toHaveCount(6);

    // Assert Sun* Kudos promo section
    const kudosPromo = page.locator("[data-testid='kudos-promo']");
    await expect(kudosPromo).toBeVisible();

    // Assert footer
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Assert widget button
    const widgetButton = page.locator("[data-testid='widget-button']");
    await expect(widgetButton).toBeVisible();
  });

  test("should have logo in header that links to home", async ({ page }) => {
    await page.goto("/");

    // Find the logo (Sun* logo in header)
    const logo = page
      .locator("header")
      .locator("a, button")
      .filter({ has: page.locator("img, svg") })
      .first();
    await expect(logo).toBeVisible();

    // Click logo and verify navigation to home
    await logo.click();
    await expect(page).toHaveURL("/");
  });

  test("should display language selector and switch to EN", async ({
    page,
  }) => {
    await page.goto("/");

    // Find language selector button by stable aria attribute (not by text, which changes after switch)
    const languageButton = page
      .locator("header [aria-haspopup='menu']")
      .first();
    await expect(languageButton).toBeVisible();

    // Click to open language menu
    await languageButton.click();

    // Assert EN option appears in menu/dropdown
    const enOption = page
      .locator("[role='menu'], [role='listbox'], ul, div")
      .filter({
        has: page.locator("text=/EN|English|Anh/i"),
      })
      .first();
    await expect(enOption).toBeVisible({ timeout: 2000 });

    // Click EN to switch locale
    const enText = page.locator("text=/EN|English/i").first();
    await enText.click();

    // Wait for locale switch (page should update)
    await page.waitForTimeout(500);

    // Verify language button updated to EN by re-querying it fresh (old locator is stale after text change)
    const updatedLanguageButton = page.locator("header [aria-haspopup='menu']").first();
    await expect(updatedLanguageButton).toContainText(/EN|English/i);
  });

  test("should display countdown with zero-padded two-digit values", async ({
    page,
  }) => {
    await page.goto("/");

    // Find countdown container
    const countdown = page.locator("[data-testid='countdown']");
    await expect(countdown).toBeVisible();

    // Assert three values (days, hours, minutes)
    const countdownValues = countdown.locator("[data-testid='countdown-value']");
    await expect(countdownValues).toHaveCount(3);

    // Check each value is two digits and zero-padded (00-99)
    const values = await countdownValues.allTextContents();
    values.forEach((val) => {
      const trimmed = val.trim();
      expect(trimmed).toMatch(/^\d{2}$/);
    });

    // Assert labels exist
    const daysLabel = countdown.locator(
      "text=/DAYS|Ngày|Days/i"
    );
    const hoursLabel = countdown.locator(
      "text=/HOURS|Giờ|Hours/i"
    );
    const minutesLabel = countdown.locator(
      "text=/MINUTES|Phút|Minutes/i"
    );

    await expect(daysLabel).toBeVisible();
    await expect(hoursLabel).toBeVisible();
    await expect(minutesLabel).toBeVisible();
  });

  test("should navigate to awards-information on ABOUT AWARDS click", async ({
    page,
  }) => {
    await page.goto("/");

    // Click ABOUT AWARDS button
    const aboutAwardsBtn = page
      .locator("button, a")
      .filter({ hasText: /ABOUT AWARDS|Awards/i })
      .first();
    await aboutAwardsBtn.click();

    // Verify navigation to /awards-information
    await expect(page).toHaveURL("/awards-information");
  });

  test("should navigate to sun-kudos on ABOUT KUDOS click", async ({
    page,
  }) => {
    await page.goto("/");

    // Click ABOUT KUDOS button
    const aboutKudosBtn = page
      .locator("button, a")
      .filter({ hasText: /ABOUT KUDOS|Kudos/i })
      .first();
    await aboutKudosBtn.click();

    // Verify navigation to /sun-kudos
    await expect(page).toHaveURL("/sun-kudos");
  });

  test("should navigate to award-information with anchor on award card click", async ({
    page,
  }) => {
    await page.goto("/");

    // Click first award card
    const awardCard = page.locator("[data-testid='award-card']").first();
    await expect(awardCard).toBeVisible();

    // Get the award slug from the card's data attribute or aria-label
    const awardSlug =
      (await awardCard.getAttribute("data-award-slug")) ||
      (await awardCard.getAttribute("aria-label"));

    await awardCard.click();

    // Verify navigation to /awards-information with anchor
    if (awardSlug) {
      await expect(page).toHaveURL(`/awards-information#${awardSlug}`);
    } else {
      // At minimum, verify navigation to /awards-information page
      await expect(page).toHaveURL(/\/awards-information/);
    }
  });

  test("should hide notification bell and account icon when not authenticated", async ({
    page,
  }) => {
    // Do NOT stub auth — visit as anonymous user
    await page.goto("/");

    // Assert notification bell is NOT visible
    const notificationBell = page.locator("[data-testid='notification-bell']");
    await expect(notificationBell).not.toBeVisible();

    // Assert account icon/menu is NOT visible
    const accountIcon = page.locator("[data-testid='account-icon']");
    await expect(accountIcon).not.toBeVisible();
  });

  test.fixme(
    "should show notification bell when authenticated",
    async ({ page }) => {
      // BEFORE navigation, set up stub for /auth/v1/user endpoint
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

      // Navigate to home with authenticated session stub
      await page.goto("/");

      // Assert notification bell IS visible
      const notificationBell = page.locator("[data-testid='notification-bell']");
      await expect(notificationBell).toBeVisible();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should open placeholder panel when notification bell is clicked",
    async ({ page }) => {
      // Stub authenticated session
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

      await page.goto("/");

      // Click notification bell
      const notificationBell = page.locator("[data-testid='notification-bell']");
      await notificationBell.click();

      // Assert placeholder panel opens
      const notificationPanel = page.locator("[data-testid='notification-panel']");
      await expect(notificationPanel).toBeVisible({ timeout: 2000 });

      // Assert placeholder message "No notifications yet"
      const panelText = notificationPanel.locator(
        "text=/No notifications yet|Coming soon/i"
      );
      await expect(panelText).toBeVisible();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should show account menu with Profile and Sign out for regular user",
    async ({ page }) => {
      // Stub authenticated session with role=user
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

      await page.goto("/");

      // Click account icon/menu button
      const accountIcon = page.locator("[data-testid='account-icon']");
      await expect(accountIcon).toBeVisible();
      await accountIcon.click();

      // Assert menu opens with Profile option
      const profileOption = page
        .locator("[role='menu'], ul, div")
        .filter({
          has: page.locator("text=/Profile|My Profile/i"),
        })
        .first();
      await expect(profileOption).toBeVisible({ timeout: 2000 });

      // Assert Sign out option
      const signOutOption = page.locator("text=/Sign out|Đăng xuất/i");
      await expect(signOutOption).toBeVisible();

      // Assert Admin Dashboard does NOT appear for non-admin user
      const adminOption = page.locator("text=/Admin Dashboard/i");
      await expect(adminOption).not.toBeVisible();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test.fixme(
    "should show Admin Dashboard in account menu for admin user",
    async ({ page }) => {
      // Stub authenticated session with role=admin
      await page.route(/auth\/v1\/user/, async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              id: "admin-user-id",
              email: "admin@example.com",
              user_metadata: {
                role: "admin",
              },
              created_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/");

      // Click account icon/menu button
      const accountIcon = page.locator("[data-testid='account-icon']");
      await expect(accountIcon).toBeVisible();
      await accountIcon.click();

      // Assert Admin Dashboard option IS visible
      const adminOption = page.locator("text=/Admin Dashboard/i");
      await expect(adminOption).toBeVisible({ timeout: 2000 });

      // Also assert Profile and Sign out are still there
      const profileOption = page.locator("text=/Profile|My Profile/i");
      await expect(profileOption).toBeVisible();

      const signOutOption = page.locator("text=/Sign out|Đăng xuất/i");
      await expect(signOutOption).toBeVisible();
    },
    "Auth check runs server-side (Next.js Supabase call), page.route() intercepts browser requests only — clarifications.md session 'takumi execution'"
  );

  test("should open placeholder menu when widget button is clicked", async ({
    page,
  }) => {
    await page.goto("/");

    // Find and click widget button
    const widgetButton = page.locator("[data-testid='widget-button']");
    await expect(widgetButton).toBeVisible();
    await widgetButton.click();

    // Assert placeholder menu opens
    const widgetMenu = page.locator("[data-testid='widget-menu']");
    await expect(widgetMenu).toBeVisible({ timeout: 2000 });

    // Assert placeholder message "Coming soon"
    const menuText = widgetMenu.locator("text=/Coming soon|No actions|Placeholder/i");
    await expect(menuText).toBeVisible();
  });

  test("should render footer with logo, links, and copyright", async ({
    page,
  }) => {
    await page.goto("/");

    // Assert footer is visible
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Assert logo/branding in footer (image or svg)
    const footerLogo = footer.locator("img, svg").first();
    await expect(footerLogo).toBeVisible();

    // Assert copyright text (e.g., "© 2025" or "Sun* © 2025")
    const copyrightText = footer.getByText(/©.*2025|Sun.*2025/i);
    await expect(copyrightText).toBeVisible();

    // Assert at least one navigation link in footer
    const footerLink = footer.locator("a").first();
    await expect(footerLink).toBeVisible();
  });
});
