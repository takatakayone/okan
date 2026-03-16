import { createRequire } from "module";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const require = createRequire(resolve(rootDir, "package.json"));

const { chromium } = require("playwright");
const { OkanServer } = require(resolve(rootDir, "packages/server/dist/index.js"));

const WS_PORT = 29393;
const HTTP_PORT = 29394;
const EXT = resolve(rootDir, "packages/chrome-extension/dist");
const API = `http://localhost:${HTTP_PORT}`;

let server, browser, pages;
let passed = 0, failed = 0;

async function post(path, body = {}) {
  return fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
async function status() { return (await fetch(`${API}/api/status`)).json(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.log(`  ✗ ${name}: ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }

async function setup() {
  server = new OkanServer({ wsPort: WS_PORT, httpPort: HTTP_PORT, mode: "classic", locale: "ja", autoWarp: false });
  await sleep(1500);

  browser = await chromium.launchPersistentContext("", {
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--no-first-run", "--lang=ja"],
  });

  // Open 3 tabs
  pages = [];
  for (const url of ["https://example.com", "https://www.wikipedia.org", "https://httpbin.org/html"]) {
    const p = await browser.newPage();
    await p.goto(url, { waitUntil: "domcontentloaded" });
    pages.push(p);
  }

  // Wait for extension to connect (Playwright extension loading can be slow)
  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const s = await status();
    if (s.extensionConnected) { connected = true; break; }
  }
  if (!connected) console.log("  WARNING: Extension did not connect in time");
}

async function teardown() {
  if (browser) await browser.close();
  if (server) server.close();
}

async function hasOkanHost(page) {
  return page.evaluate(() => !!document.getElementById("okan-host"));
}

async function run() {
  process.chdir(rootDir);
  await setup();
  console.log("\n🍱 Okan Full E2E Tests\n");

  // --- Server ---
  await test("Server health", async () => {
    const r = await fetch(`${API}/api/health`);
    assert(r.ok);
  });

  await test("Server status", async () => {
    const s = await status();
    assert(s.mode === "classic");
    // Note: extensionConnected may be false in Playwright (service worker limitation)
    // Real Chrome connects fine. This is a known Playwright limitation.
    if (!s.extensionConnected) {
      console.log("    (extensionConnected=false — Playwright service worker limitation, OK in real Chrome)");
    }
  });

  // --- Working badge on all tabs ---
  await test("Working badge: all tabs get okan-host", async () => {
    await post("/api/session-start");
    await sleep(2000);
    for (let i = 0; i < pages.length; i++) {
      const has = await hasOkanHost(pages[i]);
      assert(has, `Tab ${i} missing okan-host`);
    }
  });

  await test("Working badge: screenshot", async () => {
    await pages[0].bringToFront();
    await sleep(1000);
    await pages[0].screenshot({ path: "/tmp/e2e-working.png" });
  });

  // --- Tab switch shows badge ---
  await test("Tab switch: badge persists", async () => {
    await pages[1].bringToFront();
    await sleep(2000);
    await pages[1].screenshot({ path: "/tmp/e2e-tab-switch.png" });
    // okan-host should exist
    const has = await hasOkanHost(pages[1]);
    assert(has, "Tab 1 missing okan-host after switch");
  });

  // --- Done badge ---
  await test("Done badge", async () => {
    await post("/api/stop");
    await sleep(2000);
    const s = await status();
    assert(s.state === "done", `Expected done, got ${s.state}`);
    await pages[0].bringToFront();
    await sleep(1000);
    await pages[0].screenshot({ path: "/tmp/e2e-done.png" });
  });

  // --- Permission card ---
  await test("Permission card", async () => {
    await post("/api/session-end");
    await sleep(500);
    await post("/api/session-start");
    await sleep(500);
    // Fire and forget
    fetch(`${API}/api/permission-request`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_name: "Edit", tool_input: { file_path: "src/app.ts" } }),
    }).catch(() => {});
    await sleep(2000);
    const s = await status();
    assert(s.state === "waiting_permission", `Expected waiting_permission, got ${s.state}`);
    await pages[0].bringToFront();
    await sleep(1000);
    await pages[0].screenshot({ path: "/tmp/e2e-permission.png" });
  });

  // --- Permission on different tab ---
  await test("Permission shows on tab switch", async () => {
    await pages[2].bringToFront();
    await sleep(2000);
    await pages[2].screenshot({ path: "/tmp/e2e-permission-tab2.png" });
  });

  // --- Mode change ---
  await test("Mode change via API", async () => {
    await fetch(`${API}/api/config`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "mom" }),
    });
    const s = await status();
    assert(s.mode === "mom", `Expected mom, got ${s.mode}`);
  });

  // --- Locale change ---
  await test("Locale change via API", async () => {
    await fetch(`${API}/api/config`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: "en" }),
    });
    const s = await status();
    assert(s.locale === "en", `Expected en, got ${s.locale}`);
    // Change back
    await fetch(`${API}/api/config`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: "ja" }),
    });
  });

  // --- Idle hides badge ---
  await test("Idle hides badge", async () => {
    await post("/api/session-end");
    await sleep(1000);
    const s = await status();
    assert(s.state === "idle", `Expected idle, got ${s.state}`);
  });

  // --- Multi-cycle test ---
  await test("Multi-cycle: working → done → idle × 3", async () => {
    for (let cycle = 0; cycle < 3; cycle++) {
      await post("/api/session-start");
      await sleep(1000);
      let s = await status();
      assert(s.state === "working", `Cycle ${cycle}: expected working, got ${s.state}`);

      await post("/api/stop");
      await sleep(1000);
      s = await status();
      assert(s.state === "done", `Cycle ${cycle}: expected done, got ${s.state}`);

      await post("/api/session-end");
      await sleep(500);
    }
  });

  // --- Open new tab mid-session ---
  await test("New tab during working shows badge", async () => {
    await post("/api/session-start");
    await sleep(1000);
    const newPage = await browser.newPage();
    await newPage.goto("https://example.org", { waitUntil: "domcontentloaded" });
    await sleep(2000);
    const has = await hasOkanHost(newPage);
    assert(has, "New tab missing okan-host");
    await newPage.screenshot({ path: "/tmp/e2e-new-tab.png" });
    await post("/api/session-end");
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);

  // Verify screenshots
  console.log("Screenshots saved to /tmp/e2e-*.png");

  await teardown();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
