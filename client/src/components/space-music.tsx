import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AmbientEngine {
  gain: GainNode;
  stop: () => void;
  updateScore: (score: number) => void;
}

function createInterstellarAmbient(ctx: AudioContext): AmbientEngine {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);
  master.connect(ctx.destination);

  const reverb = ctx.createConvolver();
  const reverbLen = ctx.sampleRate * 4;
  const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch);
    for (let i = 0; i < reverbLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
    }
  }
  reverb.buffer = reverbBuf;

  const dry = ctx.createGain();
  dry.gain.value = 0.5;
  dry.connect(master);

  const wet = ctx.createGain();
  wet.gain.value = 0.5;
  reverb.connect(wet);
  wet.connect(master);

  const allNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  const organPipe = (freq: number, vol: number, type: OscillatorType = "sine") => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 4 + Math.random() * 2);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.06 + Math.random() * 0.08;
    const lfoG = ctx.createGain();
    lfoG.gain.value = vol * 0.35;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();

    osc.connect(g);
    g.connect(dry);
    g.connect(reverb);
    osc.start();
    allNodes.push(osc, lfo);
    return { osc, gain: g };
  };

  organPipe(55, 0.06, "sine");
  organPipe(55.2, 0.04, "sine");
  organPipe(82.4, 0.05, "sine");
  organPipe(110, 0.045, "sine");
  organPipe(110.3, 0.03, "triangle");
  organPipe(164.8, 0.03, "sine");
  organPipe(220, 0.025, "sine");
  organPipe(220.5, 0.015, "triangle");

  organPipe(329.6, 0.015, "sine");
  organPipe(440, 0.01, "sine");
  organPipe(440.4, 0.008, "triangle");

  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 27.5;
  const subG = ctx.createGain();
  subG.gain.value = 0;
  subG.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 5);
  const subLfo = ctx.createOscillator();
  subLfo.type = "sine";
  subLfo.frequency.value = 0.03;
  const subLfoG = ctx.createGain();
  subLfoG.gain.value = 0.025;
  subLfo.connect(subLfoG);
  subLfoG.connect(subG.gain);
  subLfo.start();
  sub.connect(subG);
  subG.connect(dry);
  sub.start();
  allNodes.push(sub, subLfo);

  const chordNotes = [
    [130.8, 164.8, 196, 261.6],
    [146.8, 174.6, 220, 293.7],
    [164.8, 196, 246.9, 329.6],
    [130.8, 164.8, 196, 261.6],
  ];
  let chordIdx = 0;
  const chordGains: GainNode[] = [];

  chordNotes[0].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g);
    g.connect(dry);
    g.connect(reverb);
    osc.start();
    allNodes.push(osc);
    chordGains.push(g);
  });

  const chordInterval = setInterval(() => {
    chordIdx = (chordIdx + 1) % chordNotes.length;
    const chord = chordNotes[chordIdx];
    const now = ctx.currentTime;

    chordGains.forEach((g, i) => {
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 2);
      g.gain.linearRampToValueAtTime(0.012, now + 4);
      g.gain.linearRampToValueAtTime(0.018, now + 8);
      g.gain.linearRampToValueAtTime(0.012, now + 12);

      const oscNode = allNodes[allNodes.length - chordGains.length + i] as OscillatorNode;
      if (oscNode && oscNode.frequency) {
        oscNode.frequency.setTargetAtTime(chord[i], now + 2, 1.5);
      }
    });
  }, 14000);
  intervals.push(chordInterval);

  const breathInterval = setInterval(() => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.22, now + 4);
    master.gain.linearRampToValueAtTime(0.14, now + 8);
  }, 10000);
  intervals.push(breathInterval);

  const noise = ctx.createBufferSource();
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) {
    nd[i] = (Math.random() * 2 - 1) * 0.006;
  }
  noise.buffer = noiseBuf;
  noise.loop = true;
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = "lowpass";
  nFilter.frequency.value = 250;
  nFilter.Q.value = 0.3;
  noise.connect(nFilter);
  nFilter.connect(dry);
  noise.start();
  allNodes.push(noise);

  const bellInterval = setInterval(() => {
    const now = ctx.currentTime;
    const freq = [523.3, 659.3, 784, 880, 1047][Math.floor(Math.random() * 5)];
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.006, now + 0.3);
    g.gain.linearRampToValueAtTime(0, now + 4);
    osc.connect(g);
    g.connect(reverb);
    osc.start(now);
    osc.stop(now + 5);
  }, 6000 + Math.random() * 4000);
  intervals.push(bellInterval);

  return {
    gain: master,
    stop: () => {
      intervals.forEach(clearInterval);
      allNodes.forEach((n) => { try { n.stop(); } catch {} });
    },
    updateScore: (score: number) => {
      const f = score / 100;
      nFilter.frequency.setTargetAtTime(250 + f * 200, ctx.currentTime, 2);
    },
  };
}

interface SpaceMusicProps {
  score?: number;
}

export function SpaceMusic({ score = 0 }: SpaceMusicProps) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<AmbientEngine | null>(null);

  useEffect(() => {
    if (playing && musicRef.current) {
      musicRef.current.updateScore(score);
    }
  }, [score, playing]);

  const toggle = useCallback(() => {
    if (playing) {
      if (musicRef.current && ctxRef.current) {
        musicRef.current.gain.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1.5);
        const ref = musicRef.current;
        const c = ctxRef.current;
        setTimeout(() => {
          ref.stop();
          c.close();
        }, 1800);
        ctxRef.current = null;
        musicRef.current = null;
      }
      setPlaying(false);
    } else {
      const c = new AudioContext();
      ctxRef.current = c;
      musicRef.current = createInterstellarAmbient(c);
      musicRef.current.updateScore(score);
      setPlaying(true);
    }
  }, [playing, score]);

  return (
    <button
      onClick={toggle}
      className="icon-btn"
      data-testid="button-toggle-music"
      title={playing ? "Mute ambient music" : "Play ambient music"}
    >
      {playing ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
    </button>
  );
}
