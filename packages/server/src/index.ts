import {
  WS_PORT,
  HTTP_PORT,
  PERMISSION_TIMEOUT_MS,
  SUPPORTED_LOCALES,
  getStrings,
} from "@okan-ai/shared";
import type {
  OkanMode,
  ExtensionMessage,
  PermissionResponseOutput,
  Locale,
} from "@okan-ai/shared";
import { OkanWebSocketServer } from "./ws-server.js";
import { OkanHttpApi } from "./http-api.js";
import { SessionState } from "./state.js";
import { switchFocusToTerminal } from "./focus-switch.js";
import { openUrl } from "./browser-launch.js";

export interface OkanServerOptions {
  wsPort?: number;
  httpPort?: number;
  mode?: OkanMode;
  locale?: Locale;
  warpUrl?: string;
  autoWarp?: boolean;
  focusSwitchTarget?: "auto" | string;
  onConfigChange?: (key: string, value: string) => void;
}

export class OkanServer {
  private ws: OkanWebSocketServer;
  private http: OkanHttpApi;
  private state: SessionState;
  private mode: OkanMode;
  private locale: Locale;
  private localeSetByUser = false;
  private warpUrl: string;
  private autoWarp: boolean;
  private focusSwitchTarget: "auto" | string;
  private onConfigChange?: (key: string, value: string) => void;

  // Pending permission requests: id → { resolve }
  private pendingPermissions: Map<
    string,
    { resolve: (output: PermissionResponseOutput) => void; timer: ReturnType<typeof setTimeout> }
  > = new Map();

  constructor(options: OkanServerOptions = {}) {
    this.mode = options.mode ?? "classic";
    this.locale = options.locale ?? "en";
    this.warpUrl = options.warpUrl ?? "https://www.youtube.com";
    this.autoWarp = options.autoWarp ?? true;
    this.focusSwitchTarget = options.focusSwitchTarget ?? "auto";
    this.onConfigChange = options.onConfigChange;

    this.state = new SessionState();
    this.ws = new OkanWebSocketServer(options.wsPort ?? WS_PORT);
    this.http = new OkanHttpApi(options.httpPort ?? HTTP_PORT);

    this.setupStateListeners();
    this.setupWsHandlers();
    this.setupHttpRoutes();

    console.log(`[okan] Server started (mode: ${this.mode})`);
  }

  private setupStateListeners(): void {
    this.state.onChange((newState) => {
      this.ws.broadcast({ type: "state_change", state: newState });
    });
  }

  private setupWsHandlers(): void {
    this.ws.onMessage((msg: ExtensionMessage) => {
      switch (msg.type) {
        case "permission_response": {
          const pending = this.pendingPermissions.get(msg.id);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingPermissions.delete(msg.id);
            pending.resolve({
              hookSpecificOutput: {
                hookEventName: "PermissionRequest",
                decision: {
                  behavior: msg.decision,
                  ...(msg.decision === "deny"
                    ? { message: "User denied from browser" }
                    : {}),
                },
              },
            });
            this.state.transition("working");
          }
          break;
        }
        case "back_to_reality":
          switchFocusToTerminal(this.focusSwitchTarget);
          this.printAftercare();
          this.state.transition("idle");
          break;
        case "extension_connected": {
          console.log(`[okan] Extension v${msg.version} connected`);
          // Auto-detect locale from browser on first connection
          const extMsg = msg as ExtensionMessage & { browserLocale?: string };
          const browserLocale = extMsg.browserLocale;
          if (browserLocale && !this.localeSetByUser) {
            if (SUPPORTED_LOCALES.includes(browserLocale as Locale)) {
              this.locale = browserLocale as Locale;
              console.log(`[okan] Locale auto-detected: ${this.locale}`);
            }
          }
          // Send current state to newly connected extension
          this.ws.broadcast({ type: "state_change", state: this.state.state });
          break;
        }
      }
    });
  }

  private setupHttpRoutes(): void {
    // Session start
    this.http.route("POST", "/api/session-start", (_body, res) => {
      this.state.transition("working");

      if (this.autoWarp) {
        openUrl(this.warpUrl);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    // Pre tool use — keeps state as "working" while Claude is active
    this.http.route("POST", "/api/pre-tool-use", (_body, res) => {
      if (this.state.state === "idle" || this.state.state === "done") {
        if (this.state.state === "done") {
          this.state.transition("idle");
        }
        this.state.transition("working");
      }
      this.state.incrementToolUse();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    // Session end
    this.http.route("POST", "/api/session-end", (_body, res) => {
      this.state.transition("idle");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    // Notification (idle_prompt = done)
    this.http.route("POST", "/api/notification", (_body, res) => {
      if (this.state.state === "working" || this.state.state === "idle") {
        this.state.transition("working");
        this.state.transition("done");
        this.broadcastDone();
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    // Stop
    this.http.route("POST", "/api/stop", (_body, res) => {
      if (this.state.state !== "done") {
        if (this.state.state === "idle") {
          this.state.transition("working");
        }
        this.state.transition("done");
        this.broadcastDone();
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    // Permission request (BLOCKING - waits for extension response)
    this.http.route("POST", "/api/permission-request", (body, res) => {
      const id = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toolName = String(body.tool_name ?? "unknown");
      const toolInput = (body.tool_input ?? {}) as Record<string, unknown>;

      const s = getStrings(this.locale);
      const filePath = typeof toolInput.file_path === "string" ? toolInput.file_path : undefined;
      const command = typeof toolInput.command === "string" ? toolInput.command : undefined;
      const description = typeof toolInput.description === "string" ? toolInput.description : undefined;

      let label: string;
      switch (toolName) {
        case "Write": label = s.permWrite; break;
        case "Edit": label = s.permEdit; break;
        case "Bash": label = s.permBash; break;
        case "Read": label = s.permRead; break;
        default: label = s.permDefault; break;
      }
      const detail = filePath ?? command ?? description ?? toolName;
      const question = `${label}: ${detail}`;

      this.state.transition("waiting_permission");
      this.ws.broadcast({ type: "permission_request", id, question, tool: toolName });

      // Wait for extension response or timeout
      const promise = new Promise<PermissionResponseOutput>((resolve) => {
        const timer = setTimeout(() => {
          this.pendingPermissions.delete(id);
          this.state.transition("working");
          // Timeout: return nothing, let Claude show default prompt
          resolve({
            hookSpecificOutput: {
              hookEventName: "PermissionRequest",
              decision: { behavior: "allow" },
            },
          });
        }, PERMISSION_TIMEOUT_MS - 10_000); // 10s buffer before Claude's own timeout

        this.pendingPermissions.set(id, { resolve, timer });
      });

      promise.then((output) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(output));
      });
    });

    // Config update (mode/locale change from popup)
    this.http.route("POST", "/api/config", (body, res) => {
      const VALID_MODES: OkanMode[] = ["gentle", "classic", "mom"];
      if (body.mode && VALID_MODES.includes(body.mode as OkanMode)) {
        this.mode = body.mode as OkanMode;
        this.onConfigChange?.("mode", this.mode);
        console.log(`[okan] Mode changed to: ${this.mode}`);
      }
      if (body.locale && SUPPORTED_LOCALES.includes(body.locale as Locale)) {
        this.locale = body.locale as Locale;
        this.localeSetByUser = true;
        this.onConfigChange?.("locale", this.locale);
        console.log(`[okan] Locale changed to: ${this.locale}`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, mode: this.mode, locale: this.locale }));
    });

    // Status
    this.http.route("GET", "/api/status", (_body, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          state: this.state.state,
          mode: this.mode,
          locale: this.locale,
          extensionConnected: this.ws.hasConnections(),
          sessionDuration: this.state.getSessionDuration(),
          toolUseCount: this.state.toolUseCount,
        }),
      );
    });
  }

  private broadcastDone(): void {
    const s = getStrings(this.locale);
    const doneText = this.mode === "gentle" ? s.doneGentle
      : this.mode === "mom" ? s.doneMom
      : s.doneClassic;
    this.ws.broadcast({
      type: "task_done",
      summary: doneText,
      mode: this.mode,
      locale: this.locale,
    });
  }

  private printAftercare(): void {
    const s = getStrings(this.locale);
    const duration = this.state.getSessionDuration();
    const minutes = Math.round(duration / 60_000);
    const timeStr = minutes < 1 ? s.aftercareUnderOneMin : `${minutes}${s.aftercareMinutes}`;
    const greeting = this.mode === "gentle" ? s.aftercareGentle
      : this.mode === "mom" ? s.aftercareMom
      : s.aftercareClassic;

    console.log("");
    console.log(`  🍱 ${greeting}`);
    console.log(`     ${s.aftercareWorkedFor} ${timeStr}.`);
    console.log("");
  }

  close(): void {
    // Clean up pending permissions
    for (const [, pending] of this.pendingPermissions) {
      clearTimeout(pending.timer);
    }
    this.pendingPermissions.clear();

    this.ws.close();
    this.http.close();
    console.log("[okan] Server stopped");
  }
}

// Allow direct execution
if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts")) {
  const server = new OkanServer();

  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.close();
    process.exit(0);
  });
}
