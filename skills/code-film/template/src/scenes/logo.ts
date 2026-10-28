import type { Scene } from "../runtime";
import { color, dur, ease, font } from "../brand";

export type LogoProps = { wordmark: string };

// End card. Sets the "logo" mark the music's biggest lift is aligned to.
export const logo: Scene<LogoProps> = {
  build({ root, tl, props, cue, mark }) {
    root.style.cssText = `background:${color.bg};display:grid;place-items:center;`;
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:28px;";
    const glyph = document.createElement("div");
    glyph.style.cssText = `width:96px;height:96px;border-radius:28px;background:${color.accent};`;
    const word = document.createElement("div");
    word.style.cssText = `font:600 96px/1 ${font.sans};color:${color.text};letter-spacing:-0.04em;`;
    word.textContent = props.wordmark;
    row.append(glyph, word);
    root.appendChild(row);

    const hit = 0.35;
    tl.from(glyph, { scale: 0, rotate: -90, duration: dur.slow, ease: ease.settle }, hit);
    tl.from(word, { x: -40, autoAlpha: 0, duration: dur.slow, ease: ease.enter }, hit + 0.12);
    mark("logo", hit);
    cue("sfx/tap.wav", hit, 0.8);
  },
};
