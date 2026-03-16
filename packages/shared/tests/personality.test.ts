import { describe, it, expect } from "vitest";
import { PERSONALITIES } from "../src/personality.js";

describe("PERSONALITIES", () => {
  it("has all three modes defined", () => {
    expect(PERSONALITIES).toHaveProperty("gentle");
    expect(PERSONALITIES).toHaveProperty("classic");
    expect(PERSONALITIES).toHaveProperty("mom");
  });

  it("each mode has required fields", () => {
    for (const mode of Object.values(PERSONALITIES)) {
      expect(mode).toHaveProperty("name");
      expect(mode).toHaveProperty("workingText");
      expect(mode).toHaveProperty("permissionPrefix");
      expect(mode).toHaveProperty("doneText");
      expect(mode).toHaveProperty("aftercareGreeting");
      expect(mode).toHaveProperty("soundFile");
      expect(mode).toHaveProperty("pulseIntensity");
    }
  });

  it("mom has escalation", () => {
    expect(PERSONALITIES.mom.escalateAfterMs).toBe(5_000);
    expect(PERSONALITIES.gentle.escalateAfterMs).toBeNull();
    expect(PERSONALITIES.classic.escalateAfterMs).toBeNull();
  });
});
