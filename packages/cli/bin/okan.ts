#!/usr/bin/env node

import { execSync } from "node:child_process";
import { Command } from "commander";
import { OkanServer } from "@okan-ai/server";

function killPortProcesses(ports: number[]): void {
  for (const port of ports) {
    try {
      const pids = execSync(`lsof -ti:${port}`, { encoding: "utf-8" }).trim();
      if (pids) {
        execSync(`kill -9 ${pids.split("\n").join(" ")}`, { stdio: "ignore" });
      }
    } catch {
      // no process on port
    }
  }
}
import { loadConfig, ensureConfig, saveConfig, getConfigPath } from "../src/config-manager.js";
import { installHooks, uninstallHooks } from "../src/installer.js";

const program = new Command();

program
  .name("okan")
  .description("Your AI task mom - watches your back while you browse")
  .version("0.1.0");

// okan start
program
  .command("start")
  .description("Start the Okan server")
  .action(() => {
    const config = ensureConfig();

    // Kill any existing processes on the ports
    killPortProcesses([config.server.wsPort, config.server.httpPort]);

    console.log("🍱 Okan is watching over you...");
    console.log(`   Mode: ${config.mode}`);
    console.log(`   Warp URL: ${config.warpUrl}`);
    console.log(`   WS: localhost:${config.server.wsPort}`);
    console.log(`   HTTP: localhost:${config.server.httpPort}`);
    console.log("");

    const server = new OkanServer({
      wsPort: config.server.wsPort,
      httpPort: config.server.httpPort,
      mode: config.mode,
      warpUrl: config.warpUrl,
      autoWarp: config.autoWarp,
      focusSwitchTarget: config.focusSwitch.target,
    });

    process.on("SIGINT", () => {
      console.log("\n🍱 Okan is going to sleep. Be good!");
      server.close();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      server.close();
      process.exit(0);
    });
  });

// okan setup
program
  .command("setup")
  .description("Set up Okan hooks for your AI CLI tool")
  .requiredOption("--target <tool>", "Target tool (claude)")
  .action((opts) => {
    if (opts.target !== "claude") {
      console.error(`Unsupported target: ${opts.target}. Currently only "claude" is supported.`);
      process.exit(1);
    }

    ensureConfig();
    const result = installHooks();

    if (result.success) {
      console.log("🍱 Okan setup complete!");
      console.log("");
      console.log("   ✓ Config created at " + getConfigPath());
      console.log("   ✓ Claude Code hooks installed");
      console.log("");
      console.log("   Next steps:");
      console.log("   1. Install the Chrome Extension");
      console.log("   2. Run: okan start");
      console.log("   3. Use Claude Code as usual — Okan will watch over you!");
    } else {
      console.error("Failed:", result.message);
      process.exit(1);
    }
  });

// okan stop
program
  .command("stop")
  .description("Stop the Okan server")
  .action(async () => {
    try {
      const config = loadConfig();
      const res = await fetch(
        `http://localhost:${config.server.httpPort}/api/health`,
      );
      if (res.ok) {
        console.log("🍱 Sending stop signal...");
        // The server will be stopped by the process receiving SIGTERM
        // For now we just check if it's running
        console.log("   Server is running. Use Ctrl+C in the server terminal to stop it.");
      }
    } catch {
      console.log("🍱 Server is not running.");
    }
  });

// okan status
program
  .command("status")
  .description("Show Okan server status")
  .action(async () => {
    const config = loadConfig();
    try {
      const res = await fetch(
        `http://localhost:${config.server.httpPort}/api/status`,
      );
      if (res.ok) {
        const status = (await res.json()) as {
          state: string;
          mode: string;
          extensionConnected: boolean;
        };
        console.log("🍱 Okan Status");
        console.log(`   Server: running`);
        console.log(`   State: ${status.state}`);
        console.log(`   Mode: ${status.mode}`);
        console.log(`   Extension: ${status.extensionConnected ? "connected" : "not connected"}`);
      }
    } catch {
      console.log("🍱 Okan Status");
      console.log("   Server: not running");
    }
  });

// okan config
const configCmd = program
  .command("config")
  .description("Manage Okan configuration");

configCmd
  .command("get [key]")
  .description("Show configuration")
  .action((key) => {
    const config = loadConfig();
    if (key) {
      const value = (config as unknown as Record<string, unknown>)[key];
      if (value !== undefined) {
        console.log(typeof value === "object" ? JSON.stringify(value, null, 2) : value);
      } else {
        console.error(`Unknown config key: ${key}`);
      }
    } else {
      console.log(JSON.stringify(config, null, 2));
    }
  });

configCmd
  .command("set <key> <value>")
  .description("Update configuration")
  .action((key, value) => {
    const config = loadConfig();
    // Handle nested keys later, for now support top-level
    if (key === "mode" && !["gentle", "classic", "mom"].includes(value)) {
      console.error("Invalid mode. Choose: gentle, classic, mom");
      process.exit(1);
    }

    // Parse booleans and numbers from string input
    let parsed: unknown = value;
    if (value === "true") {
      parsed = true;
    } else if (value === "false") {
      parsed = false;
    } else if (value !== "" && !Number.isNaN(Number(value))) {
      parsed = Number(value);
    }

    (config as unknown as Record<string, unknown>)[key] = parsed;
    saveConfig(config);
    console.log(`🍱 Set ${key} = ${JSON.stringify(parsed)}`);
  });

// okan simulate (dev tool)
program
  .command("simulate <event>")
  .description("Simulate a hook event (for development)")
  .action(async (event) => {
    const config = loadConfig();
    const validEvents = ["session-start", "session-end", "notification", "stop", "permission-request"];
    if (!validEvents.includes(event)) {
      console.error(`Invalid event. Choose: ${validEvents.join(", ")}`);
      process.exit(1);
    }

    try {
      const body = event === "permission-request"
        ? { tool_name: "Write", tool_input: { file_path: "/tmp/test.js" } }
        : {};

      const res = await fetch(
        `http://localhost:${config.server.httpPort}/api/${event}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        console.log(`🍱 Simulated: ${event}`);
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.error(`Server returned ${res.status}`);
      }
    } catch {
      console.error("Server not running. Start with: okan start");
    }
  });

// okan uninstall
program
  .command("uninstall")
  .description("Remove Okan hooks and clean up")
  .action(() => {
    const result = uninstallHooks();
    if (result.success) {
      console.log("🍱 Okan hooks removed. See you next time!");
    } else {
      console.error("Failed:", result.message);
    }
  });

program.parse();
