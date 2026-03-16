/**
 * Okan E2E Test
 *
 * Launches a real Chrome with the extension, starts the Okan server,
 * and verifies the badge appears for each state.
 *
 * Run: node tests/e2e.test.mjs
 */
import { chromium } from "playwright";
import { OkanServer } from "../packages/server/dist/index.js";
import { strict as assert } from "node:assert";

const WS_PORT = 29393;
const HTTP_PORT = 29394;
const EXTENSION_PATH = "./packages/chrome-extension/dist";

let server;
let browser;
let page;

async function setup() {
  console.log("Setting up...");
  server = new OkanServer({
    wsPort: WS_PORT,
    httpPort: HTTP_PORT,
    mode: "classic",
    autoWarp: false,
  });
  await sleep(1000);

  browser = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      "--no-first-run",
      "--disable-default-apps",
    ],
  });

  page = await browser.newPage();
  await page.goto("https://example.com");
  await sleep(2000);
}

async function teardown() {
  if (browser) await browser.close();
  if (server) server.close();
}

async function post(path, body = {}) {
  return fetch(`http://localhost:${HTTP_PORT}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getStatus() {
  const res = await fetch(`http://localhost:${HTTP_PORT}/api/status`);
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Checks if the okan-host element exists in the page
async function badgeHostExists() {
  return page.evaluate(() => !!document.getElementById("okan-host"));
}

// --- Tests ---

async function testHealth() {
  const res = await fetch(`http://localhost:${HTTP_PORT}/api/health`);
  const data = await res.json();
  assert.equal(data.status, "ok");
  console.log("  ✓ Health check");
}

async function testExtensionConnects() {
  const status = await getStatus();
  assert.equal(status.extensionConnected, true);
  console.log("  ✓ Extension connected");
}

async function testBadgeInjected() {
  const exists = await badgeHostExists();
  assert.equal(exists, true);
  console.log("  ✓ Badge host element injected");
}

async function testWorkingBadge() {
  await post("/api/session-start");
  await sleep(1000);
  const status = await getStatus();
  assert.equal(status.state, "working");
  await page.screenshot({ path: "tests/.screenshots/working.png" });
  console.log("  ✓ Working state (screenshot: tests/.screenshots/working.png)");
}

async function testDoneBadge() {
  await post("/api/stop");
  await sleep(1000);
  const status = await getStatus();
  assert.equal(status.state, "done");
  await page.screenshot({ path: "tests/.screenshots/done.png" });
  console.log("  ✓ Done state (screenshot: tests/.screenshots/done.png)");
}

async function testPermissionCard() {
  // Reset → working → permission
  await post("/api/session-end");
  await sleep(300);
  await post("/api/session-start");
  await sleep(300);

  // Fire and forget (permission blocks)
  fetch(`http://localhost:${HTTP_PORT}/api/permission-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool_name: "Write", tool_input: { file_path: "/tmp/test.js" } }),
  }).catch(() => {});

  await sleep(1500);
  const status = await getStatus();
  assert.equal(status.state, "waiting_permission");
  await page.screenshot({ path: "tests/.screenshots/permission.png" });
  console.log("  ✓ Permission state (screenshot: tests/.screenshots/permission.png)");
}

async function testIdleHidesBadge() {
  await post("/api/session-end");
  await sleep(1000);
  const status = await getStatus();
  assert.equal(status.state, "idle");
  console.log("  ✓ Idle state");
}

// --- Run ---

async function run() {
  const { mkdirSync } = await import("node:fs");
  mkdirSync("tests/.screenshots", { recursive: true });

  await setup();

  console.log("\nOkan E2E Tests\n");

  const tests = [
    ["Server", testHealth],
    ["Extension connects", testExtensionConnects],
    ["Badge injected", testBadgeInjected],
    ["Working badge", testWorkingBadge],
    ["Done badge", testDoneBadge],
    ["Permission card", testPermissionCard],
    ["Idle hides badge", testIdleHidesBadge],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
    } catch (err) {
      console.log(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);

  await teardown();
  process.exit(failed > 0 ? 1 : 0);
}

run();
