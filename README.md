# 🍱 Okan (おかん)

> She watches your back while you browse.

Okan monitors your AI CLI tasks (like Claude Code) and notifies you in the browser when they finish -- like a Japanese mom calling you back for dinner.

No more alt-tabbing to check if Claude is done. Install Okan, kick off a task, browse freely. She'll let you know.

## Quick Start

```bash
npm install -g okan
```

That's it. Hooks for Claude Code are configured automatically.

Next, install the Chrome Extension:
- **Development:** Load unpacked from `packages/chrome-extension/dist` (see [Contributing](CONTRIBUTING.md))
- **Chrome Web Store:** Coming soon

Now just use Claude Code as usual. Okan works in the background.

## How It Works

```
Claude Code  -->  hooks  -->  okan-hook  -->  Local Server  -->  Chrome Extension
 (Terminal)                    (CLI)          :9393 (WS)          (Browser)
                                             :9394 (HTTP)
```

1. **Claude Code hooks** fire events (task start, permission request, task done)
2. **okan-hook** sends them to the local server (auto-starts if not running)
3. **The server** relays via WebSocket to the Chrome Extension
4. **The extension** shows a badge overlay on whatever page you're browsing

Everything runs locally. No cloud. No accounts. No data leaves your machine.

## Features

- **Working badge** -- small "🍱 working..." in the corner while Claude runs
- **Done notification** -- "🍱 Dinner's ready!" card with a back button
- **Permission forwarding** -- Claude's Y/N prompts appear in your browser. Answer without switching
- **Focus switch** -- click "Back" to auto-focus your terminal
- **Draggable cards** -- drag to reposition, position is remembered
- **Enable/disable toggle** -- one click in the extension popup
- **9 languages** -- EN, JA, ZH, KO, ES, FR, DE, PT, HI (auto-detected from browser)
- **Zero config** -- server auto-starts, extension auto-connects, hooks auto-configure
- **Graceful degradation** -- if the server isn't running, Claude Code works normally

## Modes

Pick the mom that suits you. Change from the extension popup or CLI.

| Mode | Done Message | Style |
|------|-------------|-------|
| **Gentle** | "All done, honey!" | Warm and patient |
| **Classic** | "Dinner's ready!" | The default mom |
| **Mom** | "STOP WATCHING! IT'S DONE!" | Escalates after 5 seconds |

```bash
okan config set mode mom
```

## Configuration

Config lives at `~/.okan/config.json`.

```bash
okan config set mode gentle
okan config set autoWarp false
okan config get
```

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `classic` | `gentle`, `classic`, `mom` |
| `locale` | `auto` | Language (auto-detected, or set manually) |
| `autoWarp` | `true` | Open browser when task starts |
| `warpUrl` | `https://www.youtube.com` | URL to open |

## Development

```bash
git clone https://github.com/your-username/okan.git
cd okan
npm install
npm run build
npm test          # unit tests
npm run test:e2e  # E2E tests (Playwright)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Supported Tools

- Claude Code (built-in)
- More coming (Cursor, Aider, etc.)

## License

MIT
