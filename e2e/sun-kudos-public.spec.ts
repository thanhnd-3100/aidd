import { test, expect } from "@playwright/test";

test.describe("Sun* Kudos Board (public, unauthenticated)", () => {
  test("should render the kudos board banner on /sun-kudos", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    // Assert board page loaded successfully
    await expect(page).toHaveURL("/sun-kudos");

    // Assert banner/header section exists with title
    const banner = page.locator("header, [data-testid='kudos-banner']").first();
    await expect(banner).toBeVisible();

    // Assert page title or heading contains "Kudos" or similar
    const title = page.locator("h1, h2").filter({
      hasText: /Kudos|kudos/i,
    });
    // At least one title-like element should be visible
    await expect(title).toBeVisible();
  });

  test("should render the kudos feed with a card per seeded kudos", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    // Assert feed container renders
    const feed = page.getByTestId("kudos-feed");
    await expect(feed).toBeVisible();

    // The dev database is seeded (supabase/seeds/dev/001_kudos_dev_seed.sql),
    // so the feed must render cards rather than the empty state. The
    // empty-state branch itself is covered by the kudos-board unit test.
    await expect(feed.getByTestId("kudos-card").first()).toBeVisible();
    await expect(page.getByTestId("kudos-empty-state")).toHaveCount(0);
  });

  test("should show 'Ghi nhận' action button/pill on the board", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    // Assert the "Ghi nhận" button is visible
    const ghinhanButton = page.locator("button, a").filter({
      hasText: /Ghi nhận/i,
    });
    await expect(ghinhanButton).toBeVisible();
  });

  test("should redirect to /login when clicking 'Ghi nhận' while unauthenticated", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    // Click the "Ghi nhận" button
    const ghinhanButton = page.locator("button, a").filter({
      hasText: /Ghi nhận/i,
    });
    await expect(ghinhanButton).toBeVisible();
    await ghinhanButton.click();

    // Assert redirect to /login
    await expect(page).toHaveURL("/login");
  });

  test("should redirect to /login when clicking a heart icon while unauthenticated", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    // The feed is seeded, and the sibling test above already proves it renders
    // kudos cards — so a like button MUST exist. Asserting it unconditionally
    // (rather than guarding with `if (isVisible)`) is deliberate: the guarded
    // form passed with zero assertions run whenever the selector drifted or the
    // seed emptied, which is how this test hid the feature being broken.
    const heartIcon = page.getByTestId("like-button").first();
    await expect(heartIcon).toBeVisible();

    await heartIcon.click();
    await expect(page).toHaveURL("/login");
  });

  // Regression check: verify that the homepage still links to /sun-kudos
  test("regression: home page 'ABOUT KUDOS' button links to /sun-kudos", async ({
    page,
  }) => {
    await page.goto("/");

    // Click ABOUT KUDOS button
    const aboutKudosBtn = page
      .locator("button, a")
      .filter({ hasText: /ABOUT KUDOS|Kudos/i })
      .first();
    await expect(aboutKudosBtn).toBeVisible();
    await aboutKudosBtn.click();

    // Verify navigation to /sun-kudos
    await expect(page).toHaveURL("/sun-kudos");
  });
});
