export type BeepOptions = {
  durationMs?: number;
  frequencyHz?: number;
  type?: OscillatorType;
  gain?: number;
};

export type AmbientKind = 'ocean' | 'rain' | 'forest' | 'waterfall';

export type AmbientHandle = {
  stop: () => void;
};

export type AmbientOptions = {
  musicBed?: boolean;
  musicLevel?: number;
};

let audioContext: AudioContext | null = null;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error('Web Audio API is not supported in this environment.');
    }
    audioContext = new AudioContextCtor();
  }
  return audioContext;
}

export async function beep(options: BeepOptions = {}): Promise<void> {
  const {
    durationMs = 120,
    frequencyHz = 660,
    type = 'sine',
    gain = 0.04,
  } = options;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequencyHz;

  g.gain.value = gain;

  osc.connect(g);
  g.connect(ctx.destination);

  const now = ctx.currentTime;
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const durationSeconds = 2;
  const buffer = ctx.createBuffer(1, sampleRate * durationSeconds, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

export async function startAmbient(kind: AmbientKind = 'ocean', options: AmbientOptions = {}): Promise<AmbientHandle> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Master
  const master = ctx.createGain();
  master.gain.value = 0.0;
  master.connect(ctx.destination);

  // Base noise
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.0;

  // Filters to shape the noise into different "natural" ambiences.
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = kind === 'rain' ? 1200 : 600;
  low.Q.value = 0.7;

  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = kind === 'forest' ? 800 : 300;
  band.Q.value = 0.8;

  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = kind === 'ocean' ? 60 : 180;
  high.Q.value = 0.7;

  // Slow modulation to mimic waves / wind swells.
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = kind === 'ocean' ? 0.12 : 0.25;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = kind === 'ocean' ? 140 : 90;
  lfo.connect(lfoGain);
  lfoGain.connect(low.frequency);

  noise.connect(high);
  high.connect(low);
  low.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(master);

  // Optional gentle "tone bed" (very quiet), helps feel more musical.
  const tone = ctx.createOscillator();
  tone.type = 'sine';
  tone.frequency.value = kind === 'forest' ? 196 : 164.81; // G3 / E3-ish
  const toneGain = ctx.createGain();
  toneGain.gain.value = 0.0;
  tone.connect(toneGain);
  toneGain.connect(master);

  // Optional soft chord pad for meditation (still synthesized, no files).
  const chordOscs: OscillatorNode[] = [];
  const chordGains: GainNode[] = [];
  if (options.musicBed) {
    const freqs = [261.63, 329.63, 392.0]; // C major triad
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.0;
      osc.connect(g);
      g.connect(master);
      chordOscs.push(osc);
      chordGains.push(g);
    }
  }

  const now = ctx.currentTime;
  // Set levels per ambience kind.
  const baseNoise = kind === 'rain' ? 0.04 : kind === 'waterfall' ? 0.045 : 0.03;
  const baseTone = kind === 'rain' ? 0.003 : 0.006;
  const baseChord = options.musicBed ? (options.musicLevel ?? 0.012) : 0.0;
  noiseGain.gain.setValueAtTime(0.0, now);
  toneGain.gain.setValueAtTime(0.0, now);
  master.gain.setValueAtTime(0.0, now);
  noiseGain.gain.linearRampToValueAtTime(baseNoise, now + 0.8);
  toneGain.gain.linearRampToValueAtTime(baseTone, now + 1.2);
  master.gain.linearRampToValueAtTime(options.musicBed ? 0.32 : 0.25, now + 0.6);

  if (options.musicBed) {
    for (const g of chordGains) {
      g.gain.setValueAtTime(0.0, now);
      g.gain.linearRampToValueAtTime(baseChord, now + 1.5);
    }
  }

  noise.start(now);
  lfo.start(now);
  tone.start(now);
  for (const osc of chordOscs) {
    osc.start(now);
  }

  const stop = () => {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.0, t + 0.5);
    try {
      noise.stop(t + 0.55);
      lfo.stop(t + 0.55);
      tone.stop(t + 0.55);
      for (const osc of chordOscs) {
        osc.stop(t + 0.55);
      }
    } catch {
      // ignore
    }
  };

  return { stop };
}
