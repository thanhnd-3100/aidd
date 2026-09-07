import { getOAuthErrorMessage } from "./oauth-messages";

describe("getOAuthErrorMessage", () => {
  it("returns the oauth_failed code unchanged for a recognized error", () => {
    expect(getOAuthErrorMessage("oauth_failed")).toBe("oauth_failed");
  });

  it("returns null for an unrecognized error code", () => {
    expect(getOAuthErrorMessage("some_other_code")).toBeNull();
  });

  it("returns null when no error code is present", () => {
    expect(getOAuthErrorMessage(null)).toBeNull();
    expect(getOAuthErrorMessage(undefined)).toBeNull();
  });
});
