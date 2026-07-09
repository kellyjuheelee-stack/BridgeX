import { describe, it, expect } from "vitest";
import { resolveAccess } from "./access";

describe("resolveAccess", () => {
  it("returns anon when there is no user", () => {
    expect(resolveAccess(null, null)).toBe("anon");
  });

  it("returns admin when profile.is_admin is true", () => {
    expect(resolveAccess({ id: "u1" }, { is_admin: true })).toBe("admin");
  });

  it("returns member when user exists but is not admin", () => {
    expect(resolveAccess({ id: "u1" }, { is_admin: false })).toBe("member");
  });

  it("returns member when user exists but profile is missing", () => {
    expect(resolveAccess({ id: "u1" }, null)).toBe("member");
  });
});
