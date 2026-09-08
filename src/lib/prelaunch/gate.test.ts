/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import {
  shouldGate,
  checkPrelaunchGate,
  parseGateOverride,
  isBeforeLaunchWindow,
} from "./gate";

function buildRequest(url: string) {
  return new NextRequest(new Request(url));
}

describe("parseGateOverride", () => {
  it("maps 'true' to true", () => {
    expect(parseGateOverride("true")).toBe(true);
  });

  it("maps 'false' to false", () => {
    expect(parseGateOverride("false")).toBe(false);
  });

  it("maps unset to undefined", () => {
    expect(parseGateOverride(undefined)).toBeUndefined();
  });

  it("maps any other value to undefined", () => {
    expect(parseGateOverride("")).toBeUndefined();
    expect(parseGateOverride("TRUE")).toBeUndefined();
    expect(parseGateOverride("1")).toBeUndefined();
    expect(parseGateOverride("yes")).toBeUndefined();
  });
});

describe("isBeforeLaunchWindow", () => {
  const eventDatetime = "2026-12-31T00:00:00.000Z";

  it("returns true when now is more than 1h before the event", () => {
    const now = new Date("2026-12-01T00:00:00.000Z");
    expect(isBeforeLaunchWindow(eventDatetime, now)).toBe(true);
  });

  it("returns false when now is within 1h before the event", () => {
    const now = new Date("2026-12-30T23:30:00.000Z");
    expect(isBeforeLaunchWindow(eventDatetime, now)).toBe(false);
  });

  it("returns true when now is 2h before the event (outside the 1h window, would be false under a 24h window)", () => {
    const now = new Date("2026-12-30T22:00:00.000Z");
    expect(isBeforeLaunchWindow(eventDatetime, now)).toBe(true);
  });

  it("returns false when now is exactly 1h before the event", () => {
    const now = new Date("2026-12-30T23:00:00.000Z");
    expect(isBeforeLaunchWindow(eventDatetime, now)).toBe(false);
  });

  it("returns false when now is after the event", () => {
    const now = new Date("2027-01-01T00:00:00.000Z");
    expect(isBeforeLaunchWindow(eventDatetime, now)).toBe(false);
  });

  it("returns false when eventDatetime is missing", () => {
    expect(isBeforeLaunchWindow(undefined, new Date())).toBe(false);
  });

  it("returns false when eventDatetime is unparseable", () => {
    expect(isBeforeLaunchWindow("not-a-date", new Date())).toBe(false);
  });
});

describe("shouldGate", () => {
  const candidatePaths = [
    "/",
    "/login",
    "/todo",
    "/awards-information",
    "/sun-kudos",
    "/admin-dashboard",
    "/auth/callback",
    "/countdown",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/api/whatever",
  ];

  it("returns false for every path when gateOverride is false, regardless of isBeforeLaunchWindow", () => {
    for (const path of candidatePaths) {
      expect(shouldGate(path, false, true)).toBe(false);
      expect(shouldGate(path, false, false)).toBe(false);
    }
  });

  it.each([
    "/",
    "/login",
    "/todo",
    "/awards-information",
    "/sun-kudos",
    "/admin-dashboard",
    "/auth/callback",
  ])(
    "returns true for %s when gateOverride is true, regardless of isBeforeLaunchWindow",
    (path) => {
      expect(shouldGate(path, true, true)).toBe(true);
      expect(shouldGate(path, true, false)).toBe(true);
    }
  );

  it.each([
    "/countdown",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/api/whatever",
  ])("returns false for exempt path %s when gateOverride is true", (path) => {
    expect(shouldGate(path, true, true)).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/todo",
    "/awards-information",
    "/sun-kudos",
    "/admin-dashboard",
    "/auth/callback",
  ])(
    "returns true for %s when gateOverride is undefined and isBeforeLaunchWindow is true",
    (path) => {
      expect(shouldGate(path, undefined, true)).toBe(true);
    }
  );

  it.each([
    "/",
    "/login",
    "/todo",
    "/awards-information",
    "/sun-kudos",
    "/admin-dashboard",
    "/auth/callback",
  ])(
    "returns false for %s when gateOverride is undefined and isBeforeLaunchWindow is false",
    (path) => {
      expect(shouldGate(path, undefined, false)).toBe(false);
    }
  );

  it.each([
    "/countdown",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/api/whatever",
  ])(
    "returns false for exempt path %s when gateOverride is undefined and isBeforeLaunchWindow is true",
    (path) => {
      expect(shouldGate(path, undefined, true)).toBe(false);
    }
  );
});

describe("checkPrelaunchGate", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is unset and EVENT_DATETIME is missing", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;
    delete process.env.EVENT_DATETIME;

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is 'false' even when now is deep in the launch window (regression: current .env.local value)", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "false";
    process.env.EVENT_DATETIME = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("redirects to /countdown for a gated path when PRELAUNCH_GATE_ENABLED is 'true', regardless of date", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";
    delete process.env.EVENT_DATETIME;

    const request = buildRequest("https://app.example.com/todo");
    const response = checkPrelaunchGate(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "https://app.example.com/countdown"
    );
  });

  it("returns null for /countdown itself when PRELAUNCH_GATE_ENABLED is 'true'", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";

    const request = buildRequest("https://app.example.com/countdown");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns null for exempt Next.js internal paths when PRELAUNCH_GATE_ENABLED is 'true'", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";

    const request = buildRequest(
      "https://app.example.com/_next/static/chunk.js"
    );

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("redirects when PRELAUNCH_GATE_ENABLED is unset and now is more than 1h before EVENT_DATETIME", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;
    process.env.EVENT_DATETIME = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const request = buildRequest("https://app.example.com/todo");
    const response = checkPrelaunchGate(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "https://app.example.com/countdown"
    );
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is unset and now is within 1h before EVENT_DATETIME", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;
    process.env.EVENT_DATETIME = new Date(
      Date.now() + 30 * 60 * 1000
    ).toISOString();

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is unset and now is after EVENT_DATETIME", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;
    process.env.EVENT_DATETIME = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is unset and EVENT_DATETIME is invalid", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;
    process.env.EVENT_DATETIME = "not-a-date";

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });
});
