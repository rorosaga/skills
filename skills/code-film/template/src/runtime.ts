import gsap from "gsap";

// Every animated value in the film hangs off one paused master timeline.
// The film's clock is whatever time we seek it to, never wall-clock time,
// which is what makes a frame render identically in preview and in render.
gsap.ticker.lagSmoothing(0);

export type Cue = { at: number; sound: string; gain?: number };

export type Music = {
  file: string;
  // Second in the music file where its biggest lift is.
  dropAt: number;
  // Mark (set by a scene with ctx.mark) the lift should land on.
  alignTo: string;
  gain?: number;
};

export type SceneCtx<P> = {
  root: HTMLElement;
  tl: gsap.core.Timeline;
  duration: number;
  props: P;
  // Place a sound at a time relative to this shot's start.
  cue(sound: string, at: number, gain?: number): void;
  // Name a moment, relative to this shot's start, for music alignment.
  mark(name: string, at: number): void;
  // Register a <video> so seeking the film seeks it frame-accurately.
  video(el: HTMLVideoElement, from?: number): void;
};

export type Scene<P = Record<string, never>> = {
  build(ctx: SceneCtx<P>): void;
};

export type Shot = {
  name: string;
  scene: Scene<any>;
  duration: number;
  props?: unknown;
  // Seconds this shot starts before the previous one ends.
  overlap?: number;
};

export type Storyboard = {
  width: number;
  height: number;
  fps: number;
  shots: Shot[];
  music?: Music;
};

export type Film = {
  width: number;
  height: number;
  fps: number;
  duration: number;
  frames: number;
  cues: Cue[];
  marks: Record<string, number>;
  music?: Music & { start: number };
  shots: { name: string; start: number; end: number }[];
  ready: Promise<void>;
  seek(t: number): Promise<void>;
};

declare global {
  interface Window { __film: Film }
}

type VideoRef = { el: HTMLVideoElement; start: number; end: number; from: number };

export function mount(board: Storyboard, stage: HTMLElement): Film {
  stage.style.width = `${board.width}px`;
  stage.style.height = `${board.height}px`;

  const master = gsap.timeline({ paused: true });
  const cues: Cue[] = [];
  const marks: Record<string, number> = {};
  const videos: VideoRef[] = [];
  const shots: Film["shots"] = [];
  const roots: HTMLElement[] = [];

  let start = 0;
  board.shots.forEach((shot, i) => {
    if (i > 0) start -= shot.overlap ?? 0;
    const shotStart = start;
    const end = shotStart + shot.duration;

    const root = document.createElement("div");
    root.className = "scene";
    root.dataset.shot = shot.name;
    stage.appendChild(root);

    const tl = gsap.timeline();
    shot.scene.build({
      root,
      tl,
      duration: shot.duration,
      props: shot.props ?? {},
      cue: (sound, at, gain) => cues.push({ at: shotStart + at, sound, gain }),
      mark: (name, at) => { marks[name] = shotStart + at; },
      video: (el, from = 0) => videos.push({ el, start: shotStart, end, from }),
    });
    if (tl.duration() > shot.duration + 1e-6) {
      console.warn(`shot "${shot.name}" animates for ${tl.duration().toFixed(2)}s but is ${shot.duration}s long`);
    }

    master.add(tl, shotStart);
    roots.push(root);
    shots.push({ name: shot.name, start: shotStart, end });
    start = end;
  });

  const duration = start;
  master.set({}, {}, duration);
  cues.sort((a, b) => a.at - b.at);

  let music: Film["music"];
  if (board.music) {
    const at = marks[board.music.alignTo];
    if (at === undefined) throw new Error(`music.alignTo "${board.music.alignTo}" is not a mark any scene set`);
    music = { ...board.music, start: at - board.music.dropAt };
  }

  const ready = (async () => {
    await document.fonts.ready;
    await Promise.all([...stage.querySelectorAll("img")].map((img) => img.decode().catch(() => {})));
    await Promise.all(videos.map(({ el }) => el.readyState >= 2
      ? undefined
      : new Promise((r) => el.addEventListener("loadeddata", r, { once: true }))));
  })();

  async function seek(t: number) {
    t = Math.min(Math.max(t, 0), duration);
    master.seek(t, false);
    // Visibility is computed, not tweened: a set() at exactly 0 does not fire on seek(0).
    shots.forEach((s, i) => {
      const last = i === shots.length - 1;
      roots[i].style.visibility = t >= s.start && (t < s.end || (last && t <= s.end)) ? "visible" : "hidden";
    });
    await Promise.all(videos.map(({ el, start, end, from }) => {
      if (t < start || t >= end) return;
      el.pause();
      const target = t - start + from;
      if (Math.abs(el.currentTime - target) < 1e-4) return;
      return new Promise<void>((r) => {
        el.addEventListener("seeked", () => r(), { once: true });
        el.currentTime = target;
      });
    }));
  }

  return {
    width: board.width,
    height: board.height,
    fps: board.fps,
    duration,
    frames: Math.round(duration * board.fps),
    cues,
    marks,
    music,
    shots,
    ready,
    seek,
  };
}
