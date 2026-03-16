import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OkanServer } from "../src/index.js";
import WebSocket from "ws";

describe("OkanServer", () => {
  let server: OkanServer;
  const WS_PORT = 19393; // Use different ports for tests
  const HTTP_PORT = 19394;

  beforeAll(() => {
    server = new OkanServer({
      wsPort: WS_PORT,
      httpPort: HTTP_PORT,
      mode: "classic",
      autoWarp: false, // Don't open browser in tests
    });
  });

  afterAll(() => {
    server.close();
  });

  it("health endpoint returns ok", async () => {
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/health`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data).toEqual({ status: "ok" });
  });

  it("status returns idle initially", async () => {
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/status`);
    const data = (await res.json()) as { state: string; mode: string };
    expect(data.state).toBe("idle");
    expect(data.mode).toBe("classic");
  });

  it("session-start transitions to working", async () => {
    await fetch(`http://localhost:${HTTP_PORT}/api/session-start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/status`);
    const data = (await res.json()) as { state: string };
    expect(data.state).toBe("working");
  });

  it("stop transitions to done", async () => {
    await fetch(`http://localhost:${HTTP_PORT}/api/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/status`);
    const data = (await res.json()) as { state: string };
    expect(data.state).toBe("done");
  });

  it("session-end transitions to idle", async () => {
    await fetch(`http://localhost:${HTTP_PORT}/api/session-end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/status`);
    const data = (await res.json()) as { state: string };
    expect(data.state).toBe("idle");
  });

  it("WebSocket client receives state changes", async () => {
    const messages: Array<{ type: string; state?: string }> = [];

    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise<void>((resolve) => ws.on("open", resolve));

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type !== "ping") messages.push(msg);
    });

    // Trigger state changes
    await fetch(`http://localhost:${HTTP_PORT}/api/session-start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    await new Promise((r) => setTimeout(r, 100));

    await fetch(`http://localhost:${HTTP_PORT}/api/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    await new Promise((r) => setTimeout(r, 100));

    ws.close();

    expect(messages.some((m) => m.type === "state_change" && m.state === "working")).toBe(true);
    expect(messages.some((m) => m.type === "task_done")).toBe(true);
  });

  it("permission-request sends to WebSocket and waits for response", async () => {
    // Reset state
    await fetch(`http://localhost:${HTTP_PORT}/api/session-end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    await fetch(`http://localhost:${HTTP_PORT}/api/session-start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    await new Promise<void>((resolve) => ws.on("open", resolve));

    // Listen for permission request and auto-respond
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "permission_request") {
        ws.send(
          JSON.stringify({
            type: "permission_response",
            id: msg.id,
            decision: "allow",
          }),
        );
      }
    });

    // Send permission request (this blocks until WS response)
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/permission-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_name: "Write", tool_input: { file_path: "/tmp/test.js" } }),
    });

    const data = (await res.json()) as {
      hookSpecificOutput: { decision: { behavior: string } };
    };
    expect(data.hookSpecificOutput.decision.behavior).toBe("allow");

    ws.close();
  });

  it("returns 404 for unknown routes", async () => {
    const res = await fetch(`http://localhost:${HTTP_PORT}/api/nonexistent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(404);
  });
});
