import { uninstallHooks } from "./installer.js";

try {
  const result = uninstallHooks();
  if (result.success) {
    console.log("  🍱 Okan hooks removed. See you next time!");
  }
} catch {
  // Don't break npm uninstall
}
