import { mount, type Film } from "./runtime";
import storyboard from "./storyboard";

const stage = document.getElementById("stage")!;
const film = mount(storyboard, stage);
const render = new URLSearchParams(location.search).has("render");

window.__film = film;

if (render) {
  film.ready.then(() => film.seek(0));
} else {
  preview(film);
}

function preview(film: Film) {
  const fit = () => {
    const s = Math.min(innerWidth / film.width, (innerHeight - 48) / film.height);
    stage.style.transform = `translateY(-20px) scale(${s})`;
  };
  addEventListener("resize", fit);
  fit();

  const bar = document.createElement("div");
  bar.id = "scrubber";
  bar.innerHTML = `<button>play</button><input type="range" min="0" step="1"><span></span>`;
  document.body.appendChild(bar);
  const button = bar.querySelector("button")!;
  const range = bar.querySelector("input")!;
  const label = bar.querySelector("span")!;
  range.max = String(film.frames - 1);

  let t = Number(new URLSearchParams(location.hash.slice(1)).get("t") ?? 0);
  let playing = false;
  let last = 0;
  let music: HTMLAudioElement | undefined;

  const show = () => {
    film.seek(t);
    const frame = Math.round(t * film.fps);
    const shot = film.shots.find((s) => t >= s.start && t < s.end)?.name ?? "end";
    range.value = String(frame);
    label.textContent = `${t.toFixed(2)}s  f${frame}  ${shot}`;
    history.replaceState(null, "", `#t=${t.toFixed(3)}`);
  };

  const setPlaying = (on: boolean) => {
    playing = on;
    button.textContent = on ? "pause" : "play";
    if (film.music) {
      music ??= new Audio(`/${film.music.file}`);
      music.volume = film.music.gain ?? 1;
      if (on && t >= film.music.start) {
        music.currentTime = t - film.music.start;
        music.play();
      } else {
        music.pause();
      }
    }
    if (on) {
      if (t >= film.duration) t = 0;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  };

  const tick = (now: number) => {
    if (!playing) return;
    const prev = t;
    t = Math.min(t + (now - last) / 1000, film.duration);
    last = now;
    for (const c of film.cues) {
      if (c.at > prev && c.at <= t) {
        const a = new Audio(`/${c.sound}`);
        a.volume = Math.min(c.gain ?? 1, 1);
        a.play();
      }
    }
    if (film.music && music && music.paused && prev < film.music.start && t >= film.music.start) {
      music.currentTime = t - film.music.start;
      music.play();
    }
    show();
    if (t >= film.duration) setPlaying(false);
    else requestAnimationFrame(tick);
  };

  button.onclick = () => setPlaying(!playing);
  range.oninput = () => { setPlaying(false); t = Number(range.value) / film.fps; show(); };
  addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 1 : 1 / film.fps;
    if (e.key === " ") { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === "ArrowRight") { setPlaying(false); t = Math.min(t + step, film.duration); show(); }
    else if (e.key === "ArrowLeft") { setPlaying(false); t = Math.max(t - step, 0); show(); }
  });

  film.ready.then(show);
}
