// Synthesizes a short cinematic "ta-DUM": a soft low hit, then a bigger hit
// that blooms into a deep, reverberant chord. Everything is generated with
// the Web Audio API, so the extension ships no audio files.

let ctx = null;
let reverb = null;

function getContext() {
  if (!ctx) {
    ctx = new AudioContext();
    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 2.8, 2.5);
    reverb.connect(ctx.destination);
  }
  return ctx;
}

// Exponentially decaying stereo noise works as a simple hall reverb.
function makeImpulse(ac, seconds, decay) {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

function makeNoise(ac, seconds) {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Routes a node to the speakers dry, plus a send into the reverb.
function connectOut(node, out, wet) {
  node.connect(out);
  const send = ctx.createGain();
  send.gain.value = wet;
  node.connect(send);
  send.connect(reverb);
}

// One timpani/kick-style hit: a pitch-dropping sine plus a muffled noise thump.
function hit(t, { pitch, gain, decay, wet }, out) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch * 2.5, t);
  osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.08);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  osc.connect(env);
  connectOut(env, out, wet);
  osc.start(t);
  osc.stop(t + decay + 0.05);

  const noise = ctx.createBufferSource();
  noise.buffer = makeNoise(ctx, 0.3);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  const nEnv = ctx.createGain();
  nEnv.gain.setValueAtTime(gain * 0.6, t);
  nEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  noise.connect(lp).connect(nEnv);
  connectOut(nEnv, out, wet);
  noise.start(t);
}

// A low, detuned-saw chord whose filter swells open and then closes as it fades.
function bloom(t, out) {
  const root = 36.71; // D1
  const notes = [root, root * 1.5, root * 2, root * 3, root * 4];
  const length = 2.6;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(120, t);
  filter.frequency.exponentialRampToValueAtTime(900, t + 0.35);
  filter.frequency.exponentialRampToValueAtTime(150, t + length);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);

  filter.connect(env);
  connectOut(env, out, 0.45);

  for (const freq of notes) {
    for (const detune of [-9, 9]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length + 0.05);
    }
  }
}

async function playFanfare(volume = 0.8) {
  getContext();
  if (ctx.state === "suspended") await ctx.resume();

  const out = ctx.createGain();
  out.gain.value = volume;
  out.connect(ctx.destination);

  const t = ctx.currentTime + 0.05;
  hit(t, { pitch: 55, gain: 0.6, decay: 0.45, wet: 0.25 }, out);          // "ta"
  hit(t + 0.34, { pitch: 42, gain: 1.0, decay: 1.4, wet: 0.5 }, out);     // "DUM"
  bloom(t + 0.34, out);
}
