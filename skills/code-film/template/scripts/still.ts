// Grab frames to look at without rendering the film.
//
//   node scripts/still.ts --t 3.2                one frame -> out/stills/t3.200.png
//   node scripts/still.ts --t 1,2.5,4            several
//   node scripts/still.ts --sheet 12             contact sheet of 12 evenly spaced frames
//   node scripts/still.ts --sheet 8 --from 2 --to 6
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { arg, ffmpeg, frame, open } from "./lib.ts";

const dir = "out/stills";
await mkdir(dir, { recursive: true });
const film = await open(1);
const { info } = film;
const page = await film.page();

const sheet = arg("sheet");
if (sheet) {
  const n = Number(sheet);
  const from = Number(arg("from", "0"));
  const to = Number(arg("to", String(info.duration)));
  const tmp = path.join(dir, ".sheet");
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp);
  const times = Array.from({ length: n }, (_, i) => from + ((to - from) * (i + 0.5)) / n);
  for (const [i, t] of times.entries()) {
    await writeFile(path.join(tmp, `${String(i).padStart(3, "0")}.png`), await frame(page, t));
  }
  const cols = Math.ceil(Math.sqrt(n));
  const out = path.join(dir, `sheet-${from}-${to}.png`);
  await ffmpeg([
    "-framerate", "1", "-i", path.join(tmp, "%03d.png"),
    "-vf", `scale=640:-1,tile=${cols}x${Math.ceil(n / cols)}:padding=4`,
    "-frames:v", "1", out,
  ]).done;
  await rm(tmp, { recursive: true, force: true });
  console.log(out);
  console.log(`cells, left to right: ${times.map((t) => t.toFixed(2) + "s").join(" ")}`);
} else {
  for (const t of arg("t", "0")!.split(",").map(Number)) {
    const out = path.join(dir, `t${t.toFixed(3)}.png`);
    await writeFile(out, await frame(page, t));
    console.log(out);
  }
}
await film.close();
