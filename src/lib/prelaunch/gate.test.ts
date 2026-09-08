/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { shouldGate, checkPrelaunchGate } from "./gate";

function buildRequest(url: string) {
  return new NextRequest(new Request(url));
}

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

  it("returns false for every path when disabled", () => {
    for (const path of candidatePaths) {
      expect(shouldGate(path, false)).toBe(false);
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
  ])("returns true for %s when enabled", (path) => {
    expect(shouldGate(path, true)).toBe(true);
  });

  it.each([
    "/countdown",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/api/whatever",
  ])("returns false for exempt path %s when enabled", (path) => {
    expect(shouldGate(path, true)).toBe(false);
  });
});

describe("checkPrelaunchGate", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is unset", () => {
    delete process.env.PRELAUNCH_GATE_ENABLED;

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns null when PRELAUNCH_GATE_ENABLED is 'false'", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "false";

    const request = buildRequest("https://app.example.com/todo");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns a redirect to /countdown for a gated path when enabled", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";

    const request = buildRequest("https://app.example.com/todo");
    const response = checkPrelaunchGate(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "https://app.example.com/countdown"
    );
  });

  it("returns null for /countdown itself when enabled", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";

    const request = buildRequest("https://app.example.com/countdown");

    expect(checkPrelaunchGate(request)).toBeNull();
  });

  it("returns null for exempt Next.js internal paths when enabled", () => {
    process.env.PRELAUNCH_GATE_ENABLED = "true";

    const request = buildRequest(
      "https://app.example.com/_next/static/chunk.js"
    );

    expect(checkPrelaunchGate(request)).toBeNull();
  });
});
