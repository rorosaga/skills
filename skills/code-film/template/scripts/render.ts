// Render the film: headless Chrome steps the clock one frame at a time and every
// frame goes to ffmpeg. Sound cues are mixed offline against the same clock.
//
//   node scripts/render.ts                      1080p, out/film.mp4
//   node scripts/render.ts --scale 2            4K from the same code
//   node scripts/render.ts --from 2 --to 6      a slice, for checking one shot
//   node scripts/render.ts --workers 6 --out out/cut-3.mp4
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { availableParallelism } from "node:os";
import path from "node:path";
import { arg, ffmpeg, frame, open, type FilmInfo } from "./lib.ts";

const scale = Number(arg("scale", "1"));
const workers = Number(arg("workers", String(Math.max(1, Math.min(6, availableParallelism() - 2)))));
const out = arg("out", "out/film.mp4")!;
const silent = arg("silent") === "true";

const film = await open(scale);
const { info } = film;
const from = Math.round(Number(arg("from", "0")) * info.fps);
const to = Math.min(Math.round(Number(arg("to", String(info.duration))) * info.fps), info.frames);
const total = to - from;

const work = path.join(path.dirname(out), `.render-${path.basename(out, ".mp4")}`);
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });

console.log(`${total} frames at ${info.width * scale}x${info.height * scale} ${info.fps}fps, ${workers} workers`);
const started = Date.now();
let rendered = 0;

// Each worker renders a contiguous range to its own segment, with identical encode
// settings so the segments concatenate without re-encoding.
const size = Math.ceil(total / workers);
const ranges = Array.from({ length: workers }, (_, i) => [from + i * size, Math.min(from + (i + 1) * size, to)])
  .filter(([a, b]) => b > a);

await Promise.all(ranges.map(async ([a, b], i) => {
  const page = await film.page();
  const enc = ffmpeg([
    "-f", "image2pipe", "-framerate", String(info.fps), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p",
    "-r", String(info.fps), path.join(work, `seg-${i}.mp4`),
  ], true);
  for (let f = a; f < b; f++) {
    const png = await frame(page, f / info.fps);
    if (enc.proc.exitCode !== null || enc.proc.signalCode !== null) break;
    if (!enc.proc.stdin!.write(png)) await new Promise((r) => enc.proc.stdin!.once("drain", r));
    rendered++;
    if (rendered % info.fps === 0) process.stdout.write(`\r${rendered}/${total}`);
  }
  enc.proc.stdin!.end();
  await enc.done;
  await page.context().close();
}));
await film.close();
process.stdout.write(`\r${total}/${total} frames in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);

const list = path.join(work, "segments.txt");
await writeFile(list, ranges.map((_, i) => `file 'seg-${i}.mp4'`).join("\n"));
const video = path.join(work, "video.mp4");
await ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", video]).done;

const start = from / info.fps;
const length = total / info.fps;
if (silent || (info.cues.length === 0 && !info.music)) {
  await ffmpeg(["-i", video, "-c", "copy", out]).done;
} else {
  const wav = path.join(work, "mix.wav");
  await mix(info, start, length, wav);
  await ffmpeg(["-i", video, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-t", String(length), out]).done;
}
await rm(work, { recursive: true, force: true });
console.log(`wrote ${out}`);

// One input per distinct sound, split once per cue, each delayed to its frame time.
async function mix(info: FilmInfo, start: number, length: number, wav: string) {
  const asset = (f: string) => {
    const p = path.join("assets", f);
    if (!existsSync(p)) throw new Error(`sound not found: ${p}`);
    return p;
  };
  const cues = info.cues.filter((c) => c.at >= start && c.at < start + length);
  const files = [...new Set(cues.map((c) => c.sound))];
  const inputs = files.flatMap((f) => ["-i", asset(f)]);
  const graph: string[] = [];
  const outs: string[] = [];

  files.forEach((f, i) => {
    const mine = cues.filter((c) => c.sound === f);
    graph.push(`[${i}:a]asplit=${mine.length}${mine.map((_, j) => `[s${i}_${j}]`).join("")}`);
    mine.forEach((c, j) => {
      const ms = Math.round((c.at - start) * 1000);
      graph.push(`[s${i}_${j}]adelay=${ms}:all=1,volume=${c.gain ?? 1}[c${i}_${j}]`);
      outs.push(`[c${i}_${j}]`);
    });
  });

  if (info.music) {
    const m = info.music;
    inputs.push("-i", asset(m.file));
    const offset = start - m.start;
    const shape = offset >= 0
      ? `atrim=start=${offset},asetpts=PTS-STARTPTS`
      : `adelay=${Math.round(-offset * 1000)}:all=1`;
    graph.push(`[${files.length}:a]${shape},volume=${m.gain ?? 1}[music]`);
    outs.push("[music]");
  }

  graph.push(`${outs.join("")}amix=inputs=${outs.length}:normalize=0:dropout_transition=0,`
    + `alimiter=limit=0.95,apad,atrim=end=${length}[mix]`);
  const script = path.join(path.dirname(wav), "mix.filter");
  await writeFile(script, graph.join(";\n"));
  await ffmpeg([...inputs, "-/filter_complex", script, "-map", "[mix]", "-ar", "48000", wav]).done;
}
