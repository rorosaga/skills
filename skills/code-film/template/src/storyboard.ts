import type { Storyboard } from "./runtime";
import { title } from "./scenes/title";
import { terminal } from "./scenes/terminal";
import { logo } from "./scenes/logo";

// The whole film. Each shot is a few lines of data; scenes hold the craft.
// Change a value here and the preview updates; re-render for the final file.
const storyboard: Storyboard = {
  width: 1920,
  height: 1080,
  fps: 60,
  shots: [
    { name: "intro", scene: title, duration: 2.6, props: { lines: ["Every frame", "is code"] } },
    {
      name: "agent",
      scene: terminal,
      duration: 4.4,
      props: { prompt: "make the logo land on the drop", reply: "Placed the music so its lift hits the logo mark at 7.35s." },
    },
    { name: "outro", scene: logo, duration: 2.5, props: { wordmark: "film" } },
  ],
  // Drop a track in assets/music/ and uncomment. dropAt is the lift, in seconds into the track.
  // music: { file: "music/track.mp3", dropAt: 12.0, alignTo: "logo", gain: 0.6 },
};

export default storyboard;
