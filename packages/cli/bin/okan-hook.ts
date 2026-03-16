#!/usr/bin/env node

import { handleHook } from "../src/hooks/hook-handler.js";

const event = process.argv[2];
if (!event) {
  process.exit(0);
}

handleHook(event).catch(() => {
  // Silent exit on any error
  process.exit(0);
});
