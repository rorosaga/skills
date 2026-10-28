import { defineConfig } from "vite";

// assets/ is served at the root, so a cue's "sfx/key.wav" resolves in preview and in the mix alike.
export default defineConfig({
  publicDir: "assets",
  server: { port: 5199 },
});
