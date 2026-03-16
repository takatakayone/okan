# Okan (おかん)

> She watches your back while you watch YouTube.

Okan is an open-source tool that monitors your AI CLI tasks (like Claude Code) and notifies you in the browser when they finish -- like a Japanese mom calling you back for dinner.

No more alt-tabbing every 30 seconds to check if Claude is done. Install Okan, kick off a task, and go browse freely. She'll let you know.

## What is Okan?

AI CLI tools like Claude Code can run for minutes at a time. You want to browse the web while waiting, but you also don't want to miss the moment it finishes -- or worse, miss a permission prompt that blocks everything.

Okan solves this with three things:

- **A tiny badge** in the corner of your browser that says "working..." while your task runs
- **A notification card** that pops up saying "Dinner's ready!" when the task finishes
- **Permission forwarding** so you can answer Claude's Y/N questions right from the browser

No context switching. No missed prompts. Just a mom keeping an eye on things.

## Quick Start

**1. Install the CLI**

```bash
npm install -g okan-ai
```

**2. Set up hooks for Claude Code**

```bash
okan setup --target claude
```

This auto-configures Claude Code's hooks. No manual editing needed.

**3. Install the Chrome Extension**

Load the extension from the Chrome Web Store (coming soon), or load it unpacked for development (see [Contributing](CONTRIBUTING.md)).

**4. Done.** There is no step 4.

The server auto-starts when Claude Code triggers a hook. The extension connects automatically. Toggle Okan on/off from the extension popup anytime.

## How It Works

```
+--------------+             +-----------+       HTTP        +--------------+  WebSocket   +------------------+
|  Claude Code |  <- hooks ->| okan-hook |  --------------> | Local Server | <----------> | Chrome Extension |
|  (Terminal)  |             |  (CLI)    |                  | :9393 (WS)   |              |  (Browser)       |
|              |             |           |                  | :9394 (HTTP) |              |                  |
+--------------+             +-----------+                  +--------------+              +------------------+
```

1. **Claude Code hooks** fire events (task start, permission request, task done) to the `okan-hook` CLI
2. **okan-hook** sends HTTP requests to the local Okan server
3. **The server** relays messages over WebSocket to the Chrome Extension
4. **The extension** renders a badge overlay on whatever page you're browsing

Everything runs locally. No cloud. No accounts. No data leaves your machine.

## Features

**Task Monitoring**
- Shows a small "working..." badge in the corner of your browser while Claude Code is running
- Badge stays out of your way -- small, semi-transparent, bottom-right corner

**Completion Notification**
- When Claude finishes, the badge changes to "Dinner's ready!" with a gentle pulse animation
- Click "Back" to auto-focus your terminal -- right back where you left off

**Permission Forwarding**
- When Claude asks for permission (Y/N), a card appears in your browser
- Answer right there -- no need to switch back to the terminal
- Card is draggable; position is remembered across sessions

**Auto-Warp**
- When a task starts, Okan can automatically open your browser to a URL of your choice (default: YouTube)
- Configurable or disable it entirely

**Zero Configuration**
- `okan setup --target claude` handles everything
- Server starts automatically when needed
- Extension connects on its own
- Graceful degradation: if the server isn't running, Claude Code works normally

## Okan Modes

Okan has personality. Pick the mom that suits you.

| Mode | Done Message | Pulse | Vibe |
|------|-------------|-------|------|
| `gentle` | "All done, honey!" | Slow | Warm and patient |
| `classic` | "Dinner's ready!" | Normal | The default mom |
| `asian_mom` | "STOP WATCHING! WORK IS DONE!" | Intense (escalates after 5s) | You know this mom |

Set your mode:

```bash
okan config set mode asian_mom
```

## Configuration

Configuration lives at `~/.okan/config.json`. You can edit it directly or use the CLI:

```bash
okan config set mode gentle
okan config set warpUrl "https://news.ycombinator.com"
okan config set autoWarp false
okan config get
```

Key options:

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `classic` | Personality mode: `gentle`, `classic`, `asian_mom` |
| `warpUrl` | `https://www.youtube.com` | URL to open when a task starts |
| `autoWarp` | `true` | Auto-open browser on task start |
| `server.wsPort` | `9393` | WebSocket port |
| `server.httpPort` | `9394` | HTTP API port |
| `notifications.sound` | `true` | Play sound on task completion |
| `notifications.soundVolume` | `0.8` | Sound volume (0-1) |
| `permissionInterrupt.enabled` | `true` | Forward permission requests to browser |
| `permissionInterrupt.timeoutSeconds` | `300` | How long to wait for a response before falling back |

## CLI Commands

| Command | Description |
|---------|-------------|
| `okan setup --target claude` | Configure Claude Code hooks |
| `okan start` | Start the Okan server |
| `okan stop` | Stop the server |
| `okan status` | Show current state |
| `okan config set <key> <value>` | Change a setting |
| `okan config get [key]` | View settings |
| `okan simulate <event>` | Simulate events for development |
| `okan uninstall` | Remove all hooks |

## Development

Okan is a monorepo with four packages:

| Package | Description |
|---------|-------------|
| `packages/shared` | Shared types, constants, and personality definitions |
| `packages/server` | WebSocket + HTTP server that bridges terminal and browser |
| `packages/cli` | CLI tool (`okan` commands) and hook handler (`okan-hook`) |
| `packages/chrome-extension` | Manifest V3 Chrome Extension with badge overlay |

```bash
git clone https://github.com/your-username/okan.git
cd okan
npm install
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

## Roadmap

- [x] Claude Code support
- [ ] Chrome Web Store release
- [ ] Cursor, Aider, and other AI CLI tools
- [ ] Firefox Extension
- [ ] Slack/Discord notification fallback
- [ ] Community personality presets
- [ ] Session history

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT -- see [LICENSE](LICENSE).
