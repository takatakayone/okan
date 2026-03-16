import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_WARP_URL, WS_PORT, HTTP_PORT } from "@okan-ai/shared";
import type { OkanConfig } from "@okan-ai/shared";

const CONFIG_PATH = path.join(os.homedir(), CONFIG_DIR, CONFIG_FILE);

const DEFAULT_CONFIG: OkanConfig = {
  version: 1,
  mode: "classic",
  locale: "auto",
  warpUrl: DEFAULT_WARP_URL,
  autoWarp: true,
  focusSwitch: {
    enabled: true,
    target: "auto",
  },
  server: {
    wsPort: WS_PORT,
    httpPort: HTTP_PORT,
  },
  notifications: {
    sound: true,
    soundVolume: 0.8,
  },
  permissionInterrupt: {
    enabled: true,
    timeoutSeconds: 300,
  },
  aftercare: {
    enabled: true,
  },
};

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): OkanConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: OkanConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

export function ensureConfig(): OkanConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    saveConfig(DEFAULT_CONFIG);
  }
  return loadConfig();
}
