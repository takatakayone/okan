// --- State ---

export type OkanState = "idle" | "working" | "waiting_permission" | "done";

export type OkanMode = "gentle" | "classic" | "mom";

// --- Config ---

export interface OkanConfig {
  version: number;
  mode: OkanMode;
  locale: string;
  warpUrl: string;
  autoWarp: boolean;
  focusSwitch: {
    enabled: boolean;
    target: "auto" | string;
  };
  server: {
    wsPort: number;
    httpPort: number;
  };
  notifications: {
    sound: boolean;
    soundVolume: number;
  };
  permissionInterrupt: {
    enabled: boolean;
    timeoutSeconds: number;
  };
  aftercare: {
    enabled: boolean;
  };
}

// --- Server → Extension (WebSocket) ---

export type ServerMessage =
  | { type: "state_change"; state: OkanState }
  | { type: "permission_request"; id: string; question: string; tool: string }
  | { type: "task_done"; summary: string; mode: OkanMode; locale: string }
  | { type: "ping" };

// --- Extension → Server (WebSocket) ---

export type ExtensionMessage =
  | { type: "permission_response"; id: string; decision: "allow" | "deny" }
  | { type: "back_to_reality" }
  | { type: "extension_connected"; version: string }
  | { type: "pong" };

// --- Hook → Server (HTTP) ---

export interface HookPayload {
  event: string;
  data?: Record<string, unknown>;
}

export interface PermissionRequestPayload {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface PermissionResponseOutput {
  hookSpecificOutput: {
    hookEventName: "PermissionRequest";
    decision: {
      behavior: "allow" | "deny";
      message?: string;
    };
  };
}
