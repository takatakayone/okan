import { describe, it, expect } from "vitest";
import { WS_PORT, HTTP_PORT, WS_URL, HTTP_URL, KEEPALIVE_INTERVAL_MS } from "../src/constants.js";

describe("constants", () => {
  it("ports are valid numbers", () => {
    expect(WS_PORT).toBe(9393);
    expect(HTTP_PORT).toBe(9394);
  });

  it("URLs match ports", () => {
    expect(WS_URL).toBe("ws://localhost:9393");
    expect(HTTP_URL).toBe("http://localhost:9394");
  });

  it("keepalive is under 30 seconds (Chrome requirement)", () => {
    expect(KEEPALIVE_INTERVAL_MS).toBeLessThan(30_000);
    expect(KEEPALIVE_INTERVAL_MS).toBeGreaterThan(0);
  });
});
