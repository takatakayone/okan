import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "bin/okan": "bin/okan.ts",
    "bin/okan-hook": "bin/okan-hook.ts",
    "postinstall": "src/postinstall.ts",
    "preuninstall": "src/preuninstall.ts",
  },
  format: ["esm"],
  target: "node18",
  platform: "node",
  noExternal: ["@okan-ai/server", "@okan-ai/shared"],
  clean: true,
  splitting: true,
});
