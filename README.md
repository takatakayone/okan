# 🍱 Okan (おかん)

**Your Claude Code is working. Go watch YouTube. Mom will call you back.**

---

You kicked off a big Claude Code task. It's gonna take a while.

You open YouTube. Five minutes later, you realize Claude finished three minutes ago and has been waiting for you to approve a file write.

**Okan fixes this.**

She sits quietly in the corner of your browser. When Claude finishes, she yells. When Claude needs permission, she asks you right there -- no terminal switching needed. Like a Japanese mom who lets you play but always calls you back for dinner.

<!-- TODO: Add demo GIF here -->

## Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed and working
- Chrome browser

## Install

```bash
npm install -g okan-call
```

Then add the [Chrome Extension](#chrome-extension). That's it. No config, no setup, no server to run. Everything is automatic.

## What Happens

1. You run `claude "refactor the entire codebase"`
2. A small **🍱 working...** badge appears in your browser corner
3. You browse freely
4. Claude needs permission? **A card pops up in your browser.** Click OK. Done.
5. Claude finishes? **🍱 "ご飯できたよ！"** -- click Back, you're in your terminal

You never left the browser. You never missed a prompt.

## Features

| | |
|---|---|
| **Working badge** | Small, unobtrusive. Bottom-right corner. You barely notice it. |
| **Done notification** | A card appears. Click "Back" and your terminal gets focus. |
| **Permission forwarding** | Claude asks Y/N? Answer from the browser. No context switch. |
| **Draggable** | Don't like where the card is? Drag it. Position is remembered. |
| **9 languages** | EN, JA, ZH, KO, ES, FR, DE, PT, HI. Auto-detected. |
| **3 mom modes** | Gentle, Classic, or Mom (she escalates if you ignore her) |
| **On/Off toggle** | One click in the extension popup. |
| **Zero config** | Server auto-starts. Extension auto-connects. Hooks auto-configure. |

## Mom Modes

| Mode | When Claude finishes... | Vibe |
|------|------------------------|------|
| **Gentle** | "All done, honey!" | Patient. No rush. |
| **Classic** | "ご飯できたよ！" | The default. |
| **Mom** | "終わったわよ！早く戻りなさい！" | Shakes after 5 seconds. |

Change mode from the extension popup or:

```bash
okan config set mode mom
```

## How It Works

```
Claude Code  -->  hooks  -->  okan-hook  -->  Local Server  -->  Chrome Extension
 (Terminal)                    (CLI)          (localhost)          (Your browser)
```

Everything runs on your machine. No cloud. No accounts. No data sent anywhere.

When Claude Code runs, it triggers hooks. The hooks notify a tiny local server. The server pushes to the Chrome Extension via WebSocket. The extension shows the badge.

When you click "OK" on a permission card, it goes back the same way: Extension --> Server --> Hook --> Claude Code continues.

## Chrome Extension

**Chrome Web Store:** Coming soon.

**Development / Manual install:**
1. Run `npm run build` in this repo
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select `packages/chrome-extension/dist`

## Configuration

```bash
okan config get              # show all
okan config set mode gentle  # change mode
okan config set autoWarp false
```

Config file: `~/.okan/config.json`

## Supported AI Tools

- **Claude Code** -- works out of the box
- Cursor, Aider, and more -- coming soon

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
git clone https://github.com/your-username/okan.git
cd okan
npm install && npm run build
npm test
```

## License

MIT
