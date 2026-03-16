import { exec } from "node:child_process";

export function openUrl(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "linux"
        ? `xdg-open "${url}"`
        : `start "${url}"`;

  exec(cmd, (err) => {
    if (err) console.warn(`Failed to open URL: ${url}`);
  });
}
