import type { User } from "@supabase/supabase-js";
import { getUserRole } from "./get-user-role";

function makeUser(metadata: Record<string, unknown>): Pick<User, "app_metadata"> {
  return { app_metadata: metadata };
}

describe("getUserRole", () => {
  it("defaults to \"user\" when there is no user", () => {
    expect(getUserRole(null)).toBe("user");
  });

  it("defaults to \"user\" when app_metadata has no role", () => {
    expect(getUserRole(makeUser({}))).toBe("user");
  });

  it("defaults to \"user\" when role is an unrecognized value", () => {
    expect(getUserRole(makeUser({ role: "superuser" }))).toBe("user");
  });

  it("returns \"admin\" when app_metadata.role is \"admin\"", () => {
    expect(getUserRole(makeUser({ role: "admin" }))).toBe("admin");
  });

  it("returns \"user\" when app_metadata.role is explicitly \"user\"", () => {
    expect(getUserRole(makeUser({ role: "user" }))).toBe("user");
  });

  it("ignores a role set on user_metadata (client-writable, must not grant privilege)", () => {
    expect(
      getUserRole({ app_metadata: {}, user_metadata: { role: "admin" } } as Pick<
        User,
        "app_metadata"
      >)
    ).toBe("user");
  });
});
