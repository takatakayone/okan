import { cpSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Copy static files to dist for Chrome to load
const copies = [
  ["src/popup/popup.html", "dist/popup/popup.html"],
  ["src/styles/badge.css", "dist/styles/badge.css"],
  ["manifest.json", "dist/manifest.json"],
];

for (const [src, dest] of copies) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

// Copy assets directory if it exists
try {
  cpSync("src/assets", "dist/assets", { recursive: true });
} catch {
  mkdirSync("dist/assets/icons", { recursive: true });
  mkdirSync("dist/assets/sounds", { recursive: true });
}

console.log("[okan] Extension assets copied to dist/");
