import { cookies } from "next/headers";
import getRequestConfigDefault from "./request";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// next-intl/server ships ESM-only build output; the real getRequestConfig()
// just returns the callback for the plugin to invoke per-request, so
// stubbing it the same way avoids dragging the ESM module into Jest's
// CommonJS transform.
jest.mock("next-intl/server", () => ({
  getRequestConfig: (fn: unknown) => fn,
}));

const mockedCookies = jest.mocked(cookies);

function mockLocaleCookie(value: string | undefined) {
  mockedCookies.mockResolvedValue({
    get: jest.fn().mockReturnValue(value === undefined ? undefined : { value }),
    // Test double only needs the `get` surface request.ts reads; the real
    // cookie store type has many unrelated members.
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

// next-intl's getRequestConfig() returns the callback as-is for the plugin
// to invoke per-request; calling it directly here exercises the same logic.
type RequestConfigFn = (params: unknown) => Promise<{
  locale: string;
  messages: Record<string, unknown>;
}>;

describe("i18n request config", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("merges the home section partials under a single `home` key", async () => {
    mockLocaleCookie("vi");

    const config = await (getRequestConfigDefault as unknown as RequestConfigFn)(
      {}
    );

    expect(config.locale).toBe("vi");
    expect(config.messages.home).toEqual(
      expect.objectContaining({
        header: expect.any(Object),
        footer: expect.any(Object),
        hero: expect.any(Object),
        rootFurther: expect.any(Object),
        awards: expect.any(Object),
        kudos: expect.any(Object),
        widget: expect.any(Object),
      })
    );
    expect(config.messages.login).toBeDefined();
  });

  it("falls back to the default locale when the cookie is missing", async () => {
    mockLocaleCookie(undefined);

    const config = await (getRequestConfigDefault as unknown as RequestConfigFn)(
      {}
    );

    expect(config.locale).toBe("vi");
  });

  it("falls back to the default locale when the cookie holds an invalid value", async () => {
    mockLocaleCookie("fr");

    const config = await (getRequestConfigDefault as unknown as RequestConfigFn)(
      {}
    );

    expect(config.locale).toBe("vi");
  });

  it("resolves the en locale and its home messages when requested", async () => {
    mockLocaleCookie("en");

    const config = await (getRequestConfigDefault as unknown as RequestConfigFn)(
      {}
    );

    expect(config.locale).toBe("en");
    expect(config.messages.home).toEqual(
      expect.objectContaining({
        header: expect.any(Object),
        footer: expect.any(Object),
        hero: expect.any(Object),
        rootFurther: expect.any(Object),
        awards: expect.any(Object),
        kudos: expect.any(Object),
        widget: expect.any(Object),
      })
    );
  });
});
