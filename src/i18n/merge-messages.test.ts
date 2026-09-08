import { deepMergeMessages } from "./merge-messages";

describe("deepMergeMessages", () => {
  it("merges disjoint top-level keys from multiple sources", () => {
    const result = deepMergeMessages(
      { login: { title: "Login" } },
      { home: { chrome: { title: "Home" } } }
    );

    expect(result).toEqual({
      login: { title: "Login" },
      home: { chrome: { title: "Home" } },
    });
  });

  it("deep-merges nested objects sharing a top-level key", () => {
    const result = deepMergeMessages(
      { home: { chrome: { title: "Chrome" } } },
      { home: { hero: { title: "Hero" } } }
    );

    expect(result).toEqual({
      home: {
        chrome: { title: "Chrome" },
        hero: { title: "Hero" },
      },
    });
  });

  it("lets a later source's leaf value win on conflict", () => {
    const result = deepMergeMessages(
      { home: { chrome: { title: "Old" } } },
      { home: { chrome: { title: "New" } } }
    );

    expect(result).toEqual({ home: { chrome: { title: "New" } } });
  });

  it("returns an empty object when given no sources", () => {
    expect(deepMergeMessages()).toEqual({});
  });

  it("warns on a leaf-level collision between two sources", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = deepMergeMessages(
      { home: { chrome: { title: "Old" } } },
      { home: { chrome: { title: "New" } } }
    );

    expect(result).toEqual({ home: { chrome: { title: "New" } } });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("home.chrome.title")
    );

    warnSpy.mockRestore();
  });

  it("does not warn when a leaf value is identical across sources", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    deepMergeMessages(
      { home: { chrome: { title: "Same" } } },
      { home: { chrome: { title: "Same" } } }
    );

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("does not warn when merging disjoint or nested-object keys", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    deepMergeMessages(
      { login: { title: "Login" } },
      { home: { chrome: { title: "Home" } } }
    );

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
