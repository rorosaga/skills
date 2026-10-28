# Film

A motion-graphics film written as code. `src/storyboard.ts` is the film; `src/scenes/` holds the craft; `npm run dev` previews it, `npm run render` writes `out/film.mp4`.

@TASTE.md

- Before any change, re-read TASTE.md. Every review note becomes a rule there, generalized beyond the shot it was about.
- After a change, look at it: `node scripts/still.ts --sheet 12 --from <a> --to <b>` and read the PNG before saying it is done.
- Colors, fonts, eases and durations come from `src/brand.ts` only.
- Nothing in a scene may read wall-clock time. All motion goes on `ctx.tl`; text is derived from a tweened number.
