---
name: code-film
description: Make a motion-graphics video entirely in code (TypeScript scenes animated with GSAP in a browser, rendered frame by frame to MP4 with Playwright and ffmpeg, with sound cues mixed in sync) and refine it through design-crit notes that become lasting rules. Use it when someone wants a product launch film, feature announcement video, promo, animated explainer, social clip, logo sting or UI walkthrough animation, says "like After Effects but in code", or wants HTML/CSS/GSAP rendered to video. Use it even if they only say "make a video for our launch" with no footage. Not for cutting or editing existing camera footage; use video-use for that.
---

# Code film

Every frame is code: a storyboard file of shots, each shot a TypeScript scene that builds plain DOM and animates it on one GSAP timeline. The browser previews it live and scrubbable. Headless Chrome steps the clock one frame at a time, hands each frame to ffmpeg, and sound cues are mixed offline against the same clock. 1080p and 4K come from the same code.

Source: [Emil Widlund's thread](https://x.com/emilwidlund/status/2115213417539879300) on how he, as the only designer at Polar, makes their launch films. A 1:30 film took him about 2 hours and about 60 prompts. His point: changes become cheap (swapping content is one constant and a re-render), and the work is directing taste, not writing instructions.

## Start a film

```bash
cp -R ~/.claude/skills/code-film/template <project>/film
cd <project>/film
npm install
npx playwright install chromium-headless-shell
npm run dev            # preview at http://localhost:5199
```

The template is a working three-shot film with sound. Render it once (`npm run render`) to prove the toolchain, then replace its shots.

| Path | What it is |
|---|---|
| `src/storyboard.ts` | The film: size, fps, an ordered list of shots (`name`, `scene`, `duration`, `props`, optional `overlap`), optional music |
| `src/scenes/*.ts` | One scene per kind of shot. `build(ctx)` makes DOM in `ctx.root` and adds tweens to `ctx.tl` |
| `src/brand.ts` | Every color, font, ease and duration. Scenes import from here and nowhere else |
| `src/runtime.ts` | Builds the master timeline, computes shot visibility, seeks videos, exposes `window.__film` |
| `TASTE.md` | Rules written from review notes. The project's `CLAUDE.md` imports it, so the rules persist across sessions |
| `references/` | Clips, stills and sketches to borrow taste from |
| `assets/sfx`, `assets/music` | Sounds, served at `/` in preview and read by the mixer |
| `scripts/still.ts` | Single frames or a contact sheet, without rendering the film |
| `scripts/render.ts` | The final MP4 |

Preview keys: space plays with sound, arrows step one frame, shift+arrows step one second. The URL keeps `#t=` so a reload stays on the same frame.

## How to work

1. **Get taste before writing code.** Ask for references: a clip whose pacing they like, the product's UI, brand colors and type, and ideally a rough storyboard sketch (one reply to the thread found that paper sketches were the only way to get usable layouts). For a reference clip, use the `watch` skill and write down cut lengths, hold times, how text enters and leaves, and where sound sits, in `references/notes.md`. Fill `src/brand.ts` from the product's real tokens, including its easing curves, so the film moves like the product.
2. **Write the storyboard first**, as data: shot names, durations, the copy each shot carries. Agree on it before building scenes. Content belongs in props, not inside scenes, so swapping copy later is one edit.
3. **Build scenes.** Reuse one scene for many shots via props. Keep each scene's timeline within its `duration`; the runtime warns when it doesn't.
4. **Look before you show.** After every change, `node scripts/still.ts --sheet 12 --from <a> --to <b>` and read the PNG; for timing, `--t 3.20,3.25,3.30`. Don't say a change is done until you have seen it.
5. **Run the crit loop.** The user reviews like a design crit ("this feels like someone clicking a button", "no whooshes", "never invent a color"). For each note: fix the shot, then add a rule to `TASTE.md` worded so it applies to future shots too, quoting the note. Re-read `TASTE.md` before every change. A note the user has to give twice means the rule was missing or too narrow.
6. **Render.** `npm run render` for 1080p; `-- --scale 2` for 4K; `-- --from 4 --to 9` to check one passage with its sound. On a 14-core Mac the starter renders at about 65 frames/s at 1080p.

## Hard rules

These break renders silently. Everything else is taste.

1. **Nothing reads wall-clock time.** No `Date.now`, `performance.now`, `setTimeout`, `setInterval`, `requestAnimationFrame`, CSS `transition` or `@keyframes`, autoplaying `<video>`, Lottie or GIFs on their own clocks, inside a scene. Preview would look right and the render would not. All motion is a tween on `ctx.tl`.
2. **State is a function of time.** Typed or streamed text, counters and progress are a tweened number whose `onUpdate` derives the DOM (see `scenes/terminal.ts`), so any frame renders correctly when seeked to directly, including backwards.
3. **Randomness is seeded** and drawn once in `build`, never per frame.
4. **Video goes through `ctx.video(el, from)`** with `muted` and `preload="auto"`; the runtime seeks it and waits for `seeked` each frame. Its audio, if wanted, is a cue.
5. **Fonts and images are local** (`assets/fonts` with `@font-face`), so a render never depends on the network. The runtime waits for `document.fonts.ready` and image decode before frame 0.
6. **Shot visibility belongs to the runtime.** Scenes animate their content in and out but never toggle their own root's visibility.
7. **Colors, fonts, eases and durations come from `brand.ts`.** If one is missing, ask; don't invent it.

## Sound

Scenes place cues; they never play audio. `ctx.cue("sfx/key.wav", at, gain)` puts a sound at a time relative to the shot. Tie cues to what happens on screen: a key press per typed character, a tick per streamed word, a tap when something lands. The template's `sfx` files are generated sine blips that prove the pipeline. Replace them with real recordings (short, trimmed to the transient, 48 kHz WAV).

Music aligns to a moment rather than to zero: a scene calls `ctx.mark("logo", t)`, and the storyboard's `music: { file, dropAt, alignTo: "logo" }` starts the track so its biggest lift (`dropAt`, in seconds into the track) lands on that mark. Find `dropAt` by listening, or with `ffmpeg -i track.mp3 -af "ebur128" -f null -` and looking for the loudness jump. The mixer limits the sum to avoid clipping. Sliced renders (`--from`) keep music and cues in sync.

## Other tools

- **Remotion**: the same idea in React, with a larger ecosystem, Lambda rendering and a studio UI. Choose it when the team already writes React or needs cloud rendering at scale; check its company license.
- **HyperFrames**: HTML and GSAP rendered to MP4, close to this template, suggested in the thread's replies.

Use this template when you want no framework between you and the DOM, and want the whole pipeline in a few hundred lines you can read and change.
