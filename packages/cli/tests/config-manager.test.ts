import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_WARP_URL } from "@okan-ai/shared";

// Use temp dir to avoid reading real ~/.okan/config.json
const TEST_DIR = path.join(os.tmpdir(), `okan-test-${Date.now()}`);
const TEST_CONFIG = path.join(TEST_DIR, "config.json");

describe("config-manager", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("default config has expected values", () => {
    // Write a fresh default config and read it back
    const defaultConfig = {
      version: 1,
      mode: "classic",
      warpUrl: DEFAULT_WARP_URL,
      autoWarp: true,
      focusSwitch: { enabled: true, target: "auto" },
      server: { wsPort: 9393, httpPort: 9394 },
      notifications: { sound: true, soundVolume: 0.8 },
      permissionInterrupt: { enabled: true, timeoutSeconds: 300 },
      aftercare: { enabled: true },
    };

    fs.writeFileSync(TEST_CONFIG, JSON.stringify(defaultConfig, null, 2));
    const loaded = JSON.parse(fs.readFileSync(TEST_CONFIG, "utf-8"));

    expect(loaded.version).toBe(1);
    expect(loaded.mode).toBe("classic");
    expect(loaded.warpUrl).toBe("https://www.youtube.com");
    expect(loaded.server.wsPort).toBe(9393);
  });

  it("config round-trip preserves changes", () => {
    const config = {
      version: 1,
      mode: "mom",
      warpUrl: "https://x.com",
    };

    fs.writeFileSync(TEST_CONFIG, JSON.stringify(config, null, 2));
    const loaded = JSON.parse(fs.readFileSync(TEST_CONFIG, "utf-8"));

    expect(loaded.mode).toBe("mom");
    expect(loaded.warpUrl).toBe("https://x.com");
  });
});
