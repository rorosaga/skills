// The only place colors, type and motion curves are defined.
// Scenes import from here; they never write a hex value or an ease string inline.

export const color = {
  bg: "#0b0b0f",
  surface: "#16161d",
  line: "#2a2a35",
  text: "#f4f4f6",
  muted: "#8b8b99",
  accent: "#6e7bff",
} as const;

export const font = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

// Named curves, shared with the product UI so motion in the film matches motion in the app.
export const ease = {
  enter: "expo.out",
  exit: "power2.in",
  move: "power3.inOut",
  settle: "back.out(1.4)",
} as const;

export const dur = {
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
} as const;
