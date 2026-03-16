# Contributing to Okan

Thanks for your interest in contributing to Okan. This guide covers everything you need to get started.

## Development Setup

**Prerequisites:**
- Node.js 22+
- npm 10+
- Chrome (for testing the extension)

**Clone and build:**

```bash
git clone https://github.com/your-username/okan.git
cd okan
npm install
npm run build
```

This builds all four packages in dependency order using Turborepo.

**Watch mode (for active development):**

```bash
npm run dev
```

This runs `tsc --watch` across all packages in parallel.

## Project Structure

```
okan/
├── packages/
│   ├── shared/              # @okan-ai/shared
│   │   └── src/
│   │       ├── types.ts     # TypeScript interfaces (state, config, messages)
│   │       ├── constants.ts # Ports, URLs, timing values
│   │       └── personality.ts # Okan mode definitions
│   │
│   ├── server/              # @okan-ai/server
│   │   └── src/
│   │       ├── ws-server.ts   # WebSocket server (localhost:9393)
│   │       ├── http-api.ts    # HTTP REST API (localhost:9394)
│   │       └── browser-launch.ts # Opens URLs cross-platform
│   │
│   ├── cli/                 # okan-ai (published to npm)
│   │   ├── bin/
│   │   │   ├── okan.ts      # Main CLI entry point
│   │   │   └── okan-hook.ts # Hook handler (called by Claude Code)
│   │   └── src/
│   │       ├── installer.ts      # Writes hooks to Claude settings
│   │       └── config-manager.ts # Manages ~/.okan/config.json
│   │
│   └── chrome-extension/    # Chrome Extension (Manifest V3)
│       ├── manifest.json
│       └── src/
│           ├── background/service-worker.ts  # WebSocket client + keepalive
│           ├── content/badge.ts              # Badge overlay (Shadow DOM)
│           └── popup/popup.ts                # Extension popup UI
│
├── tests/
│   └── e2e.test.mjs         # End-to-end test with Playwright
│
├── package.json              # Root workspace config
├── turbo.json                # Turborepo task config
├── tsconfig.base.json        # Shared TypeScript config
└── vitest.config.ts          # Test runner config
```

**Dependency graph:**

```
shared  <--  server  <--  cli
                          chrome-extension (standalone, no npm deps on other packages)
```

The Chrome Extension shares the same WebSocket protocol defined in `shared`, but does not import from it at runtime -- it is built independently with its own TypeScript config.

## Running Tests

**Unit tests:**

```bash
npm test
```

This runs Vitest across all packages. Test files live in `packages/*/tests/**/*.test.ts`.

**End-to-end tests:**

```bash
npm run build
npm run test:e2e
```

The E2E test uses Playwright to launch Chrome with the extension loaded, starts the Okan server, and verifies the full flow: badge injection, state transitions (working, done, permission), and extension connectivity.

Note: E2E tests require a built project (`npm run build` first) and a display (they launch a real Chrome window).

## Loading the Chrome Extension for Development

1. Build the project:
   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in the top-right corner)

4. Click "Load unpacked"

5. Select the `packages/chrome-extension/dist` directory

6. The Okan extension icon should appear in your toolbar

After making changes to extension code, rebuild and click the refresh icon on the extension card in `chrome://extensions/`.

**Tip:** Use `npm run dev` to auto-rebuild on changes. You still need to manually reload the extension in Chrome after each change.

## Making Changes

### Adding a new personality mode

1. Add the mode name to the `OkanMode` type in `packages/shared/src/types.ts`
2. Add the personality definition to `PERSONALITIES` in `packages/shared/src/personality.ts`
3. Add a sound file to `packages/chrome-extension/src/assets/sounds/`

### Adding support for a new AI CLI tool

1. Create a new installer function in `packages/cli/src/installer.ts` (follow the pattern of `installHooks` for Claude)
2. Add a new `--target` option to the `okan setup` command
3. Document the new target in the README

### Modifying the WebSocket protocol

1. Update the message types in `packages/shared/src/types.ts`
2. Update the server handler in `packages/server/src/ws-server.ts`
3. Update the extension handler in `packages/chrome-extension/src/background/service-worker.ts`
4. Rebuild everything: `npm run build`

## Pull Request Guidelines

- **One feature or fix per PR.** Keep PRs focused and reviewable.
- **Write tests.** If you are adding new behavior, add a test in the relevant `packages/*/tests/` directory.
- **Run the full build before submitting:** `npm run build && npm test`
- **Follow existing code style.** The project uses TypeScript strict mode. No lint config yet -- just match what is already there.
- **Describe what and why** in your PR description. Screenshots or recordings are welcome for UI changes.
- **Keep commits clean.** Squash fixup commits before requesting review.

## Reporting Issues

When filing an issue, include:

- Your OS and Node.js version
- Chrome version (for extension issues)
- Steps to reproduce
- Expected vs. actual behavior
- Any relevant terminal output

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
