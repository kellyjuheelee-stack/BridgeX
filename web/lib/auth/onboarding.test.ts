import { describe, it, expect } from "vitest";
import { isOnboarded } from "./onboarding";

describe("isOnboarded", () => {
  it("returns false when profile is null", () => {
    expect(isOnboarded(null)).toBe(false);
  });
  it("returns false when onboarded_at is null", () => {
    expect(isOnboarded({ onboarded_at: null })).toBe(false);
  });
  it("returns true when onboarded_at has a timestamp", () => {
    expect(isOnboarded({ onboarded_at: "2026-07-17T00:00:00Z" })).toBe(true);
  });
});
