import { WebSocketServer, WebSocket } from "ws";
import { KEEPALIVE_INTERVAL_MS } from "@okan-ai/shared";
import type { ServerMessage, ExtensionMessage } from "@okan-ai/shared";

export class OkanWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandler: ((msg: ExtensionMessage) => void) | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log(`[okan] Extension connected (${this.clients.size} total)`);

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as ExtensionMessage;
          if (msg.type === "pong") return;
          this.messageHandler?.(msg);
        } catch {
          // ignore malformed messages
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(
          `[okan] Extension disconnected (${this.clients.size} total)`,
        );
      });
    });

    this.startKeepalive();
  }

  onMessage(handler: (msg: ExtensionMessage) => void): void {
    this.messageHandler = handler;
  }

  broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  hasConnections(): boolean {
    return this.clients.size > 0;
  }

  private startKeepalive(): void {
    this.keepaliveTimer = setInterval(() => {
      this.broadcast({ type: "ping" });
    }, KEEPALIVE_INTERVAL_MS);
  }

  close(): void {
    if (this.keepaliveTimer) clearInterval(this.keepaliveTimer);
    this.wss.close();
  }
}
