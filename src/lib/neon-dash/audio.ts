export type AudioLevels = { master: number; effects: number };
export const defaultLevels: AudioLevels = { master: .65, effects: .7 };
export function readLevels(value?: Partial<AudioLevels>): AudioLevels {
  const volume = (entry: unknown, fallback: number) => typeof entry === "number" && Number.isFinite(entry) ? Math.min(1, Math.max(0, entry)) : fallback;
  return { master: volume(value?.master, defaultLevels.master), effects: volume(value?.effects, defaultLevels.effects) };
}
const notes = { jump: 590, land: 145, slide: 230, coin: 940, hit: 105, button: 450, over: 165, purchase: 660, equip: 530, unlock: 880, reward: 1040, record: 780 };
export type Sound = keyof typeof notes;

export function createAudio() {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let gain = 0;
  return {
    configure(enabled: boolean, levels: AudioLevels) {
      gain = enabled ? levels.master * levels.effects : 0;
      if (context && output) output.gain.setTargetAtTime(gain, context.currentTime, .015);
    },
    async unlock() {
      if (!gain) return;
      if (!context) {
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = gain;
        output.connect(context.destination);
      }
      await context.resume();
    },
    play(cue: Sound) {
      if (!gain || context?.state !== "running" || !output) return;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const now = context.currentTime;
      oscillator.type = cue === "hit" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(notes[cue], now);
      oscillator.frequency.exponentialRampToValueAtTime(notes[cue] * (["coin", "unlock", "reward", "record", "purchase"].includes(cue) ? 1.45 : .64), now + .13);
      envelope.gain.setValueAtTime(.001, now);
      envelope.gain.linearRampToValueAtTime(.12, now + .012);
      envelope.gain.exponentialRampToValueAtTime(.001, now + .15);
      oscillator.connect(envelope).connect(output);
      oscillator.start(now);
      oscillator.stop(now + .16);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    },
    close() {
      if (context) void context.close().catch(() => {});
      context = undefined;
      output = undefined;
    },
  };
}
