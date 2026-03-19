const WS_URL = "ws://localhost:9393";
const HTTP_API_BASE = "http://localhost:9394";
const RECONNECT_ALARM = "okan-reconnect";
const KEEPALIVE_ALARM = "okan-keepalive";

interface StateChangeMessage {
  type: "state_change";
  state: "idle" | "working" | "waiting_permission" | "done";
}

interface TaskDoneMessage {
  type: "task_done";
  summary: string;
  mode: string;
  locale: string;
}

interface PermissionRequestMessage {
  type: "permission_request";
  id: string;
  question: string;
  tool: string;
}

interface PingMessage {
  type: "ping";
}

type ServerMessage = StateChangeMessage | TaskDoneMessage | PermissionRequestMessage | PingMessage;

let ws: WebSocket | null = null;
let lastState: StateChangeMessage | null = null;
let lastTaskDone: TaskDoneMessage | null = null;
let lastPermission: PermissionRequestMessage | null = null;

// Restore cached state from session storage on service worker wake-up
chrome.storage.session?.get(["lastState", "lastTaskDone", "lastPermission"], (result) => {
  if (result.lastState) lastState = result.lastState as StateChangeMessage;
  if (result.lastTaskDone) lastTaskDone = result.lastTaskDone as TaskDoneMessage;
  if (result.lastPermission) lastPermission = result.lastPermission as PermissionRequestMessage;
});

// --- Connection ---

function connect(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log("[okan] Connected to server");
    chrome.alarms.clear(RECONNECT_ALARM);
    chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.3 });

    const browserLang = (navigator.language || "en").split("-")[0];
    ws!.send(JSON.stringify({
      type: "extension_connected",
      version: chrome.runtime.getManifest().version,
      browserLocale: browserLang,
    }));

    updateBadge("ON", "#4CAF50");
  };

  ws.onmessage = (event) => {
    let msg: ServerMessage;
    try { msg = JSON.parse(event.data as string) as ServerMessage; } catch { return; }

    if (msg.type === "ping") {
      ws?.send(JSON.stringify({ type: "pong" }));
      return;
    }

    // Cache state (persist to session storage for service worker restarts)
    if (msg.type === "state_change") {
      lastState = msg;
      if (msg.state === "idle") { lastTaskDone = null; lastPermission = null; }
      chrome.storage.session?.set({ lastState: msg, ...(msg.state === "idle" ? { lastTaskDone: null, lastPermission: null } : {}) });
    }
    if (msg.type === "task_done") {
      lastTaskDone = msg;
      lastPermission = null;
      chrome.storage.session?.set({ lastTaskDone: msg, lastPermission: null });
    }
    if (msg.type === "permission_request") {
      lastPermission = msg;
      chrome.storage.session?.set({ lastPermission: msg });
    }

    // Forward to all tabs
    broadcastToAllTabs(msg);

    // Update badge icon
    if (msg.type === "state_change") {
      switch (msg.state) {
        case "working": updateBadge("⚡", "#FF9800"); break;
        case "waiting_permission": updateBadge("❓", "#F44336"); break;
        case "done": updateBadge("✅", "#4CAF50"); break;
        default: updateBadge("ON", "#4CAF50");
      }
    }
  };

  ws.onclose = () => {
    console.log("[okan] Disconnected from server");
    ws = null;
    chrome.alarms.clear(KEEPALIVE_ALARM);
    updateBadge("OFF", "#9E9E9E");
    scheduleReconnect();
  };

  ws.onerror = () => {};
}

function broadcastToAllTabs(msg: ServerMessage): void {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url?.match(/^https?:\/\//)) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      }
    }
  });
}

// Send current state to a specific tab (for tab switches)
function sendCurrentStateToTab(tabId: number): void {
  if (lastState) {
    chrome.tabs.sendMessage(tabId, lastState).catch(() => {});
  }
  if (lastTaskDone && lastState?.state === "done") {
    chrome.tabs.sendMessage(tabId, lastTaskDone).catch(() => {});
  }
}

function scheduleReconnect(): void {
  chrome.alarms.create(RECONNECT_ALARM, { delayInMinutes: 0.05 });
}

function updateBadge(text: string, color: string): void {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// --- Alarms ---

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RECONNECT_ALARM) {
    connect();
  } else if (alarm.name === KEEPALIVE_ALARM) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "pong" }));
    } else {
      ws = null;
      connect();
    }
  }
});

// --- Messages from content scripts and popup ---

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  // Toggle from popup → broadcast to all tabs
  if (message.type === "okan_toggle") {
    broadcastToAllTabs(message);
    return;
  }

  // Dismiss → reset server state to idle
  if (message.type === "dismiss") {
    fetch(`${HTTP_API_BASE}/api/session-end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
    lastState = null;
    lastTaskDone = null;
    lastPermission = null;
    chrome.storage.session?.set({ lastState: null, lastTaskDone: null, lastPermission: null });
    return;
  }

  // Permission response / back_to_reality from content script → forward to server
  if (
    ws?.readyState === WebSocket.OPEN &&
    (message.type === "permission_response" || message.type === "back_to_reality")
  ) {
    ws.send(JSON.stringify(message));
  }
});

// --- Send current state to a tab ---

async function syncStateToTab(tabId: number): Promise<void> {
  try {
    const res = await fetch(`${HTTP_API_BASE}/api/status`);
    if (res.ok) {
      const data = (await res.json()) as { state: string };
      if (data.state && data.state !== "idle") {
        // Send the appropriate full message based on state
        if (data.state === "done" && lastTaskDone) {
          chrome.tabs.sendMessage(tabId, lastTaskDone).catch(() => {});
        } else if (data.state === "waiting_permission" && lastPermission) {
          chrome.tabs.sendMessage(tabId, lastPermission).catch(() => {});
        } else {
          chrome.tabs.sendMessage(tabId, { type: "state_change", state: data.state }).catch(() => {});
        }
      }
    }
  } catch {
    // Server not running, use cached messages
    if (lastState && lastState.state !== "idle") {
      if (lastState.state === "done" && lastTaskDone) {
        chrome.tabs.sendMessage(tabId, lastTaskDone).catch(() => {});
      } else if (lastState.state === "waiting_permission" && lastPermission) {
        chrome.tabs.sendMessage(tabId, lastPermission).catch(() => {});
      } else {
        chrome.tabs.sendMessage(tabId, lastState).catch(() => {});
      }
    }
  }
}

// Tab switch
chrome.tabs.onActivated.addListener((activeInfo) => {
  syncStateToTab(activeInfo.tabId);
});

// New tab or page navigation completed
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    syncStateToTab(tabId);
  }
});

// --- Extension install/update: inject content scripts into existing tabs ---

chrome.runtime.onInstalled.addListener(() => {
  connect();
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url?.match(/^https?:\/\//)) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content/badge.js"],
        }).catch(() => {});
      }
    }
  });
});

chrome.runtime.onStartup.addListener(() => connect());

// Connect on every service worker wake-up
connect();

export {};
