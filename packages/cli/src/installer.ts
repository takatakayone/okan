import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface HookCommand {
  type: string;
  command: string;
  timeout?: number;
}

interface HookEntry {
  matcher?: string;
  hooks: HookCommand[];
}

const CLAUDE_SETTINGS_PATH = path.join(
  os.homedir(),
  ".claude",
  "settings.json",
);

const OKAN_HOOKS = {
  SessionStart: [
    {
      matcher: "startup|resume",
      hooks: [
        { type: "command", command: "okan-hook session-start", timeout: 10 },
      ],
    },
  ],
  PreToolUse: [
    {
      hooks: [
        { type: "command", command: "okan-hook pre-tool-use", timeout: 5 },
      ],
    },
  ],
  Notification: [
    {
      matcher: "idle_prompt",
      hooks: [
        { type: "command", command: "okan-hook notification", timeout: 10 },
      ],
    },
  ],
  PermissionRequest: [
    {
      hooks: [
        {
          type: "command",
          command: "okan-hook permission-request",
          timeout: 300,
        },
      ],
    },
  ],
  Stop: [
    {
      hooks: [{ type: "command", command: "okan-hook stop", timeout: 10 }],
    },
  ],
  SessionEnd: [
    {
      hooks: [
        { type: "command", command: "okan-hook session-end", timeout: 5 },
      ],
    },
  ],
};

export function installHooks(): { success: boolean; message: string } {
  try {
    let settings: Record<string, unknown> = {};

    if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      const raw = fs.readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
      settings = JSON.parse(raw);
    } else {
      const dir = path.dirname(CLAUDE_SETTINGS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Merge hooks (don't overwrite existing non-Okan hooks)
    const existingHooks = (settings.hooks as Record<string, unknown[]>) ?? {};
    const mergedHooks = { ...existingHooks };

    for (const [event, okanEntries] of Object.entries(OKAN_HOOKS)) {
      const existing = (mergedHooks[event] as HookEntry[]) ?? [];
      // Remove any previous Okan entries
      const filtered = existing.filter(
        (entry) =>
          !entry?.hooks?.some((h) =>
            h?.command?.startsWith("okan-hook"),
          ),
      );
      mergedHooks[event] = [...filtered, ...okanEntries];
    }

    settings.hooks = mergedHooks;

    fs.writeFileSync(
      CLAUDE_SETTINGS_PATH,
      JSON.stringify(settings, null, 2) + "\n",
    );

    return { success: true, message: "Hooks installed successfully" };
  } catch (err) {
    return {
      success: false,
      message: `Failed to install hooks: ${err}`,
    };
  }
}

export function uninstallHooks(): { success: boolean; message: string } {
  try {
    if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      return { success: true, message: "No settings file found, nothing to remove" };
    }

    const raw = fs.readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
    const settings: Record<string, unknown> = JSON.parse(raw);
    const hooks = (settings.hooks as Record<string, unknown[]>) ?? {};

    for (const event of Object.keys(hooks)) {
      hooks[event] = (hooks[event] as HookEntry[]).filter(
        (entry) =>
          !entry?.hooks?.some((h) =>
            h?.command?.startsWith("okan-hook"),
          ),
      );
      if (hooks[event].length === 0) {
        delete hooks[event];
      }
    }

    settings.hooks = hooks;
    fs.writeFileSync(
      CLAUDE_SETTINGS_PATH,
      JSON.stringify(settings, null, 2) + "\n",
    );

    return { success: true, message: "Hooks removed successfully" };
  } catch (err) {
    return { success: false, message: `Failed to remove hooks: ${err}` };
  }
}
