import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HTTP_URL } from "@okan-ai/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureServerRunning(): Promise<boolean> {
  // Quick health check
  try {
    const res = await fetch(`${HTTP_URL}/api/health`, {
      signal: AbortSignal.timeout(500),
    });
    return res.ok;
  } catch {
    // Not running — start it as a daemon
  }

  try {
    const okanBin = resolve(__dirname, "..", "..", "bin", "okan.js");

    const child = spawn(process.execPath, [okanBin, "start"], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    // Wait for server to be ready (up to 3 seconds)
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`${HTTP_URL}/api/health`, {
          signal: AbortSignal.timeout(300),
        });
        if (res.ok) return true;
      } catch {
        // keep waiting
      }
    }
  } catch {
    // Failed to start server
  }

  return false;
}

/**
 * Generic hook handler.
 * Reads JSON from stdin, POSTs to the Okan server, outputs response to stdout.
 * Auto-starts the server if not running.
 */
export async function handleHook(event: string): Promise<void> {
  // Read stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  const input = Buffer.concat(chunks).toString("utf-8");
  const body: Record<string, unknown> = input.trim() ? JSON.parse(input) : {};

  // Ensure server is running (auto-start if needed)
  const serverReady = await ensureServerRunning();
  if (!serverReady) return; // silent exit

  try {
    const response = await fetch(`${HTTP_URL}/api/${event}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(
        event === "permission-request" ? 290_000 : 9_000,
      ),
    });

    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      if (data.hookSpecificOutput) {
        process.stdout.write(JSON.stringify(data));
      }
    }
  } catch {
    // silent exit
  }
}
