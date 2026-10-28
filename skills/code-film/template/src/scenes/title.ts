import type { Scene } from "../runtime";
import { color, dur, ease, font } from "../brand";

export type TitleProps = { lines: string[] };

// Headline that rises in word by word, holds, then lifts out.
export const title: Scene<TitleProps> = {
  build({ root, tl, duration, props, cue }) {
    root.style.cssText = `background:${color.bg};display:grid;place-items:center;`;
    const h = document.createElement("h1");
    h.style.cssText = `font:600 112px/1.05 ${font.sans};color:${color.text};letter-spacing:-0.04em;text-align:center;`;
    root.appendChild(h);

    const words: HTMLElement[] = [];
    props.lines.forEach((line, i) => {
      if (i > 0) h.appendChild(document.createElement("br"));
      line.split(" ").forEach((w) => {
        const mask = document.createElement("span");
        mask.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding:0 0.12em;";
        const word = document.createElement("span");
        word.style.cssText = "display:inline-block;";
        word.textContent = w;
        mask.appendChild(word);
        h.appendChild(mask);
        words.push(word);
      });
    });

    tl.from(words, { yPercent: 110, duration: dur.slow, ease: ease.enter, stagger: 0.06 }, 0.1);
    words.forEach((_, i) => cue("sfx/tick.wav", 0.1 + i * 0.06, 0.35));
    tl.to(words, { yPercent: -110, duration: dur.base, ease: ease.exit, stagger: 0.03 }, duration - dur.base - 0.1);
  },
};
