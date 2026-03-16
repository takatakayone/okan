import { execSync } from "node:child_process";

export function switchFocusToTerminal(target: "auto" | string): void {
  if (process.platform !== "darwin") {
    console.warn("Focus-switch is currently only supported on macOS");
    return;
  }

  const app = target === "auto" ? detectTerminalApp() : target;

  try {
    execSync(
      `osascript -e 'tell application "${app}" to activate'`,
      { stdio: "ignore" },
    );
  } catch {
    console.warn(`Failed to switch focus to ${app}`);
  }
}

function detectTerminalApp(): string {
  // Check common terminal apps in order of likelihood
  const candidates = [
    "Visual Studio Code",
    "Code",
    "Cursor",
    "Terminal",
    "iTerm2",
    "Warp",
    "Alacritty",
    "kitty",
    "WezTerm",
  ];

  for (const app of candidates) {
    try {
      const result = execSync(
        `osascript -e 'tell application "System Events" to (name of processes) contains "${app}"'`,
        { encoding: "utf-8" },
      ).trim();
      if (result === "true") return app;
    } catch {
      continue;
    }
  }

  return "Terminal";
}
