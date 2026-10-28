import { createServer, type ViteDevServer } from "vite";
import { chromium, type Browser, type Page } from "playwright";
import { spawn } from "node:child_process";

import type { Film } from "../src/runtime.ts";

export type FilmInfo = Pick<Film, "width" | "height" | "fps" | "duration" | "frames" | "cues" | "music">;

export function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next === undefined || next.startsWith("--") ? "true" : next;
}

export async function open(scale = 1): Promise<{
  server: ViteDevServer;
  browser: Browser;
  url: string;
  info: FilmInfo;
  page(): Promise<Page>;
  close(): Promise<void>;
}> {
  const server = await createServer({ logLevel: "error", server: { port: 0 } });
  await server.listen();
  const url = `${server.resolvedUrls!.local[0]}?render=1`;
  const browser = await chromium.launch();

  // deviceScaleFactor is per context, so each page gets its own.
  const page = async () => {
    const ctx = await browser.newContext({ deviceScaleFactor: scale });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => console.error("page error:", e.message));
    p.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") console.error(m.text()); });
    await p.goto(url);
    await p.waitForFunction(() => window.__film !== undefined);
    const { width, height } = await p.evaluate(() => ({ width: window.__film.width, height: window.__film.height }));
    await p.setViewportSize({ width, height });
    await p.evaluate(() => window.__film.ready);
    return p;
  };

  const first = await page();
  const info: FilmInfo = await first.evaluate(() => {
    const f = window.__film;
    return { width: f.width, height: f.height, fps: f.fps, duration: f.duration, frames: f.frames, cues: f.cues, music: f.music };
  });
  await first.context().close();

  return {
    server,
    browser,
    url,
    info,
    page,
    close: async () => { await browser.close(); await server.close(); },
  };
}

export async function frame(page: Page, t: number): Promise<Buffer> {
  await page.evaluate((t) => window.__film.seek(t), t);
  return page.screenshot({ type: "png", animations: "disabled", caret: "hide" });
}

export function ffmpeg(args: string[], stdin = false) {
  const proc = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: [stdin ? "pipe" : "ignore", "inherit", "inherit"],
  });
  // A dying ffmpeg shows up first as EPIPE on stdin; let `done` report why it died instead.
  proc.stdin?.on("error", () => {});
  const done = new Promise<void>((resolve, reject) => {
    proc.on("error", reject);
    proc.on("close", (code, signal) => (code === 0
      ? resolve()
      : reject(new Error(`ffmpeg ${signal ? `killed by ${signal}` : `exited ${code}`}: ${args.join(" ")}`))));
  });
  return { proc, done };
}
