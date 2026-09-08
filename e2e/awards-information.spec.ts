import { test, expect } from "@playwright/test";

test.describe("Awards Information Page (e2e-red-first)", () => {
  test("should redirect unauthenticated visitor to /login", async ({ page }) => {
    // Navigate to /awards-information without any auth stub
    // Unauthenticated session should trigger redirect to /login
    await page.goto("/awards-information");

    // Verify the page redirected to /login
    await expect(page).toHaveURL("/login");
  });

  test.fixme(
    "should render hero banner and section title for authenticated user",
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

      // Navigate to /awards-information with authenticated session stub
      await page.goto("/awards-information");

      // Assert hero title "ROOT FURTHER"
      const heroTitle = page.locator("h1, h2").filter({
        hasText: /ROOT FURTHER/i,
      });
      await expect(heroTitle).toBeVisible();

      // Assert hero subtitle "Sun* Annual Award 2025"
      const heroSubtitle = page.locator("h2, h3, p, span").filter({
        hasText: /Sun\*\s+Annual Award\s+2025/i,
      });
      await expect(heroSubtitle).toBeVisible();

      // Assert section title (small text) "Sun* annual awards 2025"
      const smallText = page.locator("p, span, small, div").filter({
        hasText: /Sun\*\s+annual awards\s+2025/i,
      });
      await expect(smallText).toBeVisible();

      // Assert section title (large heading) "Hệ thống giải thưởng SAA 2025"
      const sectionTitle = page.locator("h2, h3").filter({
        hasText: /Hệ thống giải thưởng SAA 2025/,
      });
      await expect(sectionTitle).toBeVisible();
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should render 6-item category navigation with correct order",
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

      await page.goto("/awards-information");

      // Assert all 6 category nav items exist with correct text in order
      const expectedCategories = [
        "Top Talent",
        "Top Project",
        "Top Project Leader",
        "Best Manager",
        "Signature 2025 - Creator",
        "MVP",
      ];

      for (const category of expectedCategories) {
        const navItem = page.locator("button, a, li, div").filter({
          hasText: new RegExp(`^${category}$`, "i"),
        });
        await expect(navItem).toBeVisible();
      }

      // Assert there are exactly 6 navigation items (or at least 6)
      const navItems = page.locator("[data-testid='category-nav-item'], nav a, nav button, [role='navigation'] a, [role='navigation'] button");
      const count = await navItems.count();
      // If data-testid is not used, verify each category can be found
      if (count < 6) {
        for (const category of expectedCategories) {
          const item = page.locator("button, a, div").filter({
            hasText: new RegExp(`^${category}$`, "i"),
          });
          await expect(item.first()).toBeVisible();
        }
      }
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should render all 6 award cards with correct content",
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

      await page.goto("/awards-information");

      // Assert all 6 award sections exist (each has an id matching the category slug)
      const expectedSlugs = [
        "top-talent",
        "top-project",
        "top-project-leader",
        "best-manager",
        "signature-2025-creator",
        "mvp",
      ];

      for (const slug of expectedSlugs) {
        const section = page.locator(`#${slug}`);
        await expect(section).toBeVisible();
      }
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should render Top Talent card with exact quantity and prize text",
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

      await page.goto("/awards-information");

      // Assert Top Talent description (correct Award Information page text, not homepage summary)
      const topTalentDescription = page.locator("p, span, div").filter({
        hasText: /những cá nhân xuất sắc toàn diện/,
      });
      await expect(topTalentDescription).toBeVisible();

      // Assert Top Talent quantity: "Số lượng giải thưởng: 10 Đơn vị"
      const topTalentQuantity = page.locator("p, span, div").filter({
        hasText: /Số lượng giải thưởng:\s*10\s*Đơn vị/,
      });
      await expect(topTalentQuantity).toBeVisible();

      // Assert Top Talent prize: "7.000.000 VNĐ cho mỗi giải thưởng"
      const topTalentPrize = page.locator("p, span, div").filter({
        hasText: /7\.000\.000\s*VNĐ\s*cho mỗi giải thưởng/,
      });
      await expect(topTalentPrize).toBeVisible();
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should render MVP card with exact quantity and prize text",
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

      await page.goto("/awards-information");

      // Assert MVP quantity: "01" or "01 Cá nhân" or similar
      const mvpQuantity = page.locator("p, span, div").filter({
        hasText: /01/,
      });
      // At least one element should show "01"
      await expect(mvpQuantity.first()).toBeVisible();

      // Assert MVP prize: "15.000.000 VNĐ"
      const mvpPrize = page.locator("p, span, div").filter({
        hasText: /15\.000\.000\s*VNĐ/,
      });
      await expect(mvpPrize).toBeVisible();
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should render Sun* Kudos block with Chi tiết link",
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

      await page.goto("/awards-information");

      // Assert Kudos block is visible (using data-testid from existing KudosPromo component)
      const kudosBlock = page.locator("[data-testid='kudos-promo']");
      await expect(kudosBlock).toBeVisible();

      // Assert "Chi tiết" link exists within or near the Kudos block
      const chiTietLink = page.locator("a, button").filter({
        hasText: /Chi tiết/i,
      });
      await expect(chiTietLink).toBeVisible();
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should navigate to /sun-kudos when Chi tiết link is clicked",
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

      await page.goto("/awards-information");

      // Find and click the "Chi tiết" link
      const chiTietLink = page.locator("a, button").filter({
        hasText: /Chi tiết/i,
      });
      await chiTietLink.first().click();

      // Verify navigation to /sun-kudos
      await expect(page).toHaveURL("/sun-kudos");
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should set active state when clicking Top Talent nav item and scroll to section",
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

      await page.goto("/awards-information");

      // Find Top Talent nav item and click it
      const topTalentNav = page.locator("button, a, li, div").filter({
        hasText: /^Top Talent$/i,
      });
      await topTalentNav.first().click();

      // Verify page scrolled to #top-talent section
      // This can be verified by checking if the URL has the hash or by checking scroll position
      const topTalentSection = page.locator("#top-talent");
      // Get the bounding box to verify it's in view (approximately at top of viewport)
      const boundingBox = await topTalentSection.boundingBox();
      expect(boundingBox).toBeTruthy();
      if (boundingBox) {
        // The section should be visible in the viewport (y position should be close to top after scroll)
        expect(boundingBox.y).toBeLessThan(window.innerHeight);
      }

      // Verify the Top Talent nav item is marked as active
      // This could be a class like "active", underline, or gold highlight
      const activeNav = topTalentNav.first();
      // Check for active class or styling attribute
      const classes = await activeNav.getAttribute("class");
      const ariaSelected = await activeNav.getAttribute("aria-selected");
      const ariaPressed = await activeNav.getAttribute("aria-pressed");

      // At least one should indicate active state
      const isActive =
        (classes && /active|selected|current/i.test(classes)) ||
        ariaSelected === "true" ||
        ariaPressed === "true";
      expect(isActive).toBe(true);
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );

  test.fixme(
    "should set active state when clicking MVP nav item and clear previous active",
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

      await page.goto("/awards-information");

      // First click Top Talent to set an initial active state
      const topTalentNav = page.locator("button, a, li, div").filter({
        hasText: /^Top Talent$/i,
      });
      await topTalentNav.first().click();
      await page.waitForTimeout(100); // Small delay to ensure state updates

      // Now click MVP
      const mvpNav = page.locator("button, a, li, div").filter({
        hasText: /^MVP$/i,
      });
      await mvpNav.first().click();
      await page.waitForTimeout(100); // Small delay to ensure state updates

      // Verify MVP section is now in view
      const mvpSection = page.locator("#mvp");
      const mvpBoundingBox = await mvpSection.boundingBox();
      expect(mvpBoundingBox).toBeTruthy();

      // Verify MVP nav item is marked as active
      const activeMvp = mvpNav.first();
      const mvpClasses = await activeMvp.getAttribute("class");
      const mvpAriaSelected = await activeMvp.getAttribute("aria-selected");
      const mvpAriaPressed = await activeMvp.getAttribute("aria-pressed");

      const isMvpActive =
        (mvpClasses && /active|selected|current/i.test(mvpClasses)) ||
        mvpAriaSelected === "true" ||
        mvpAriaPressed === "true";
      expect(isMvpActive).toBe(true);

      // Verify Top Talent is NO LONGER marked as active
      const topTalentClasses = await topTalentNav.first().getAttribute("class");
      const topTalentAriaSelected = await topTalentNav
        .first()
        .getAttribute("aria-selected");
      const topTalentAriaPressed = await topTalentNav
        .first()
        .getAttribute("aria-pressed");

      const isTopTalentStillActive =
        (topTalentClasses && /active|selected|current/i.test(topTalentClasses)) ||
        topTalentAriaSelected === "true" ||
        topTalentAriaPressed === "true";
      expect(isTopTalentStillActive).toBe(false);
    },
    "Supabase auth check runs server-side in Next.js (Node.js context), not in browser context — page.route() cannot intercept server-side auth verification. Same gap as login and home screens (plans/260907-1317-login-screen/clarifications.md, plans/260907-1545-home-screen/clarifications.md). Real coverage via RTL unit tests added to src/components/awards-information/award-information-screen.test.tsx."
  );
});
