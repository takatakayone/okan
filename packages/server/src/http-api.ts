import http from "node:http";

type RouteHandler = (
  body: Record<string, unknown>,
  res: http.ServerResponse,
) => void;

export class OkanHttpApi {
  private server: http.Server;
  private routes: Map<string, RouteHandler> = new Map();

  constructor(port: number) {
    this.server = http.createServer((req, res) => {
      // CORS for local dev
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "GET" && req.url === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      if (req.method === "GET" && req.url === "/api/status") {
        const handler = this.routes.get("GET /api/status");
        if (handler) {
          handler({}, res);
          return;
        }
      }

      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          const handler = this.routes.get(`POST ${req.url}`);
          if (!handler) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "not found" }));
            return;
          }

          try {
            const parsed: Record<string, unknown> = body ? JSON.parse(body) : {};
            handler(parsed, res);
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "invalid json" }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    this.server.listen(port, () => {
      console.log(`[okan] HTTP API listening on port ${port}`);
    });
  }

  route(method: "GET" | "POST", path: string, handler: RouteHandler): void {
    this.routes.set(`${method} ${path}`, handler);
  }

  close(): void {
    this.server.close();
  }
}
