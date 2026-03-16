import { describe, it, expect, beforeEach } from "vitest";
import { SessionState } from "../src/state.js";

describe("SessionState", () => {
  let state: SessionState;

  beforeEach(() => {
    state = new SessionState();
  });

  it("starts in idle", () => {
    expect(state.state).toBe("idle");
  });

  it("transitions idle → working", () => {
    state.transition("working");
    expect(state.state).toBe("working");
  });

  it("transitions working → done", () => {
    state.transition("working");
    state.transition("done");
    expect(state.state).toBe("done");
  });

  it("transitions working → waiting_permission → working", () => {
    state.transition("working");
    state.transition("waiting_permission");
    expect(state.state).toBe("waiting_permission");
    state.transition("working");
    expect(state.state).toBe("working");
  });

  it("transitions done → idle", () => {
    state.transition("working");
    state.transition("done");
    state.transition("idle");
    expect(state.state).toBe("idle");
  });

  it("allows idle → done (for simulate/late signals)", () => {
    state.transition("done");
    expect(state.state).toBe("done");
  });

  it("ignores same-state transition", () => {
    state.transition("working");
    state.transition("working");
    expect(state.state).toBe("working");
  });

  it("tracks session start time", () => {
    expect(state.startedAt).toBeNull();
    state.transition("working");
    expect(state.startedAt).toBeTypeOf("number");
  });

  it("resets start time on idle", () => {
    state.transition("working");
    state.transition("done");
    state.transition("idle");
    expect(state.startedAt).toBeNull();
  });

  it("tracks tool use count", () => {
    expect(state.toolUseCount).toBe(0);
    state.incrementToolUse();
    state.incrementToolUse();
    expect(state.toolUseCount).toBe(2);
  });

  it("resets tool count on new session", () => {
    state.transition("working");
    state.incrementToolUse();
    state.transition("done");
    state.transition("idle");
    state.transition("working");
    expect(state.toolUseCount).toBe(0);
  });

  it("calls onChange listeners", () => {
    const states: string[] = [];
    state.onChange((s) => states.push(s));
    state.transition("working");
    state.transition("done");
    expect(states).toEqual(["working", "done"]);
  });

  it("getSessionDuration returns elapsed time", async () => {
    state.transition("working");
    await new Promise((r) => setTimeout(r, 50));
    expect(state.getSessionDuration()).toBeGreaterThan(0);
  });

  it("getSessionDuration returns 0 when idle", () => {
    expect(state.getSessionDuration()).toBe(0);
  });

  it("reset clears everything", () => {
    state.transition("working");
    state.incrementToolUse();
    state.reset();
    expect(state.state).toBe("idle");
    expect(state.startedAt).toBeNull();
    expect(state.toolUseCount).toBe(0);
  });
});
