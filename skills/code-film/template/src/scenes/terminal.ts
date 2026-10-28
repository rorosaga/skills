import type { Scene } from "../runtime";
import { color, dur, ease, font } from "../brand";

export type TerminalProps = { prompt: string; reply: string };

// A prompt is typed, then an agent streams its reply. Sound follows the text:
// one key press per typed character, a soft tick per streamed word.
export const terminal: Scene<TerminalProps> = {
  build({ root, tl, duration, props, cue }) {
    root.style.cssText = `background:${color.bg};display:grid;place-items:center;`;
    const card = document.createElement("div");
    card.style.cssText = `width:1100px;padding:48px 56px;border-radius:20px;background:${color.surface};border:1px solid ${color.line};font:400 30px/1.6 ${font.mono};color:${color.text};`;
    const ask = document.createElement("div");
    const answer = document.createElement("div");
    answer.style.cssText = `color:${color.muted};margin-top:24px;min-height:4.8em;`;
    card.append(ask, answer);
    root.appendChild(card);

    tl.from(card, { y: 40, autoAlpha: 0, duration: dur.base, ease: ease.enter }, 0);

    // Text is a function of time: an object's numeric field is tweened and onUpdate
    // derives the string, so any frame can be rendered in isolation.
    const typeStart = 0.5;
    const perChar = 0.045;
    const typed = { n: 0 };
    tl.to(typed, {
      n: props.prompt.length,
      duration: props.prompt.length * perChar,
      ease: "none",
      onUpdate: () => { ask.textContent = "› " + props.prompt.slice(0, Math.round(typed.n)); },
    }, typeStart);
    for (let i = 0; i < props.prompt.length; i++) {
      if (props.prompt[i] !== " ") cue("sfx/key.wav", typeStart + i * perChar, 0.5);
    }

    const words = props.reply.split(" ");
    const streamStart = typeStart + props.prompt.length * perChar + 0.4;
    const perWord = 0.07;
    const streamed = { n: 0 };
    tl.to(streamed, {
      n: words.length,
      duration: words.length * perWord,
      ease: "none",
      onUpdate: () => { answer.textContent = words.slice(0, Math.round(streamed.n)).join(" "); },
    }, streamStart);
    words.forEach((_, i) => cue("sfx/tick.wav", streamStart + i * perWord, 0.2));

    tl.to(card, { scale: 0.96, autoAlpha: 0, duration: dur.base, ease: ease.exit }, duration - dur.base);
  },
};
