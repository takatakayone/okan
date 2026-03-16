import { installHooks } from "./installer.js";
import { ensureConfig, getConfigPath } from "./config-manager.js";

// Auto-setup on npm install
try {
  // Step 1: Create ~/.okan/config.json with defaults
  ensureConfig();

  // Step 2: Install hooks into ~/.claude/settings.json
  const result = installHooks();

  if (result.success) {
    console.log("");
    console.log("  🍱 Okan installed!");
    console.log("");
    console.log("  ✓ Config created at " + getConfigPath());
    console.log("  ✓ Claude Code hooks configured");
    console.log("");
    console.log("  Next: Install the Chrome Extension and you're done.");
    console.log("");
  } else {
    // Hook installation failed (e.g., ~/.claude doesn't exist) — not fatal
    console.log("");
    console.log("  🍱 Okan partially installed.");
    console.log("");
    console.log("  ✓ Config created at " + getConfigPath());
    console.log("  ✗ Could not install Claude Code hooks: " + result.message);
    console.log("");
    console.log("  Run `okan setup --target claude` to install hooks manually.");
    console.log("");
  }
} catch (err) {
  // Never break npm install — silently degrade
  console.log("");
  console.log("  🍱 Okan post-install setup skipped.");
  console.log("  Run `okan setup --target claude` to set up manually.");
  console.log("");
}
