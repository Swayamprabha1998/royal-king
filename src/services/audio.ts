// Web Audio API Synthesizer for Royal Rescue: Aqua Match

class AudioService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggle(state?: boolean) {
    this.enabled = state !== undefined ? state : !this.enabled;
    return this.enabled;
  }

  public isEnabled() {
    return this.enabled;
  }

  // Play a simple pop sound for normal candy clicks/selections
  public playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Play a bubble pop sound when matching candies
  public playMatch(isComboCount: number = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const baseFreq = 200 + isComboCount * 50;
    const count = Math.min(3, 1 + isComboCount);

    for (let i = 0; i < count; i++) {
      const delay = i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq + i * 100, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2 + i * 100, this.ctx.currentTime + delay + 0.12);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.12);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.12);
    }
  }

  // Play a bright metallic clink sound for collecting coins
  public playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Play two notes in quick succession (arpeggio)
    const playNote = (freq: number, startDelay: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startDelay);
      
      gain.gain.setValueAtTime(0.1, now + startDelay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + 0.25);

      osc.start(now + startDelay);
      osc.stop(now + startDelay + 0.25);
    };

    playNote(987.77, 0); // B5
    playNote(1318.51, 0.08); // E6
  }

  // Play a metallic turning/clanking sound for valves
  public playValve() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    // Frequency sweeps down, mimicking a crank turn
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.2);

    // Apply lowpass filter to make it sound clunky and metallic
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    
    osc.disconnect(gain);
    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Play a squishy organic splash sound for clearing algae
  public playAlgaeClear() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  // Danger alert sound when water is critically high
  public playDangerAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.15);
    osc.frequency.linearRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Play a major chord arpeggio for victory
  public playVictory() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

    notes.forEach((freq, idx) => {
      const delay = idx * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  }

  // ⚡ Lightning B — electric crackle + rising zap
  public playLightning() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Noise burst (crackle)
    const bufSize = ctx.sampleRate * 0.06;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 2400;
    nFilter.Q.value = 0.8;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(nFilter); nFilter.connect(nGain); nGain.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.06);

    // Three rising zap tones
    [0, 0.08, 0.18].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300 + i * 200, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1800 + i * 400, now + delay + 0.14);
      g.gain.setValueAtTime(0.12, now + delay);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.16);
      osc.start(now + delay); osc.stop(now + delay + 0.18);
    });
  }

  // ↔ Blast Row C — sequential whoosh sweep
  public playBlastRow() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Swoosh: filtered noise sweep
    const bufSize = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noise.connect(filter); filter.connect(g); g.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.5);

    // Pop series (domino hits)
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.055;
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.connect(og); og.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500 + i * 60, now + delay);
      osc.frequency.exponentialRampToValueAtTime(200, now + delay + 0.08);
      og.gain.setValueAtTime(0.08, now + delay);
      og.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
      osc.start(now + delay); osc.stop(now + delay + 0.1);
    }
  }

  // ↕ Blast Col A — deep bass thump + rising beam
  public playBlastCol() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Bass thump
    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.connect(subG); subG.connect(ctx.destination);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    subG.gain.setValueAtTime(0.22, now);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    sub.start(now); sub.stop(now + 0.22);

    // Rising laser beam tone
    const beam = ctx.createOscillator();
    const beamG = ctx.createGain();
    beam.connect(beamG); beamG.connect(ctx.destination);
    beam.type = 'square';
    beam.frequency.setValueAtTime(180, now + 0.05);
    beam.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
    beamG.gain.setValueAtTime(0.08, now + 0.05);
    beamG.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    beam.start(now + 0.05); beam.stop(now + 0.44);
  }

  // 💣 Bomb A — explosion thud + debris crackle
  public playBomb() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Deep explosion thud
    const bufSize = ctx.sampleRate * 0.6;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.18));
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, now);
    lowpass.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    noise.connect(lowpass); lowpass.connect(g); g.connect(ctx.destination);
    noise.start(now); noise.stop(now + 0.6);

    // Impact punch
    const punch = ctx.createOscillator();
    const pg = ctx.createGain();
    punch.connect(pg); pg.connect(ctx.destination);
    punch.type = 'sine';
    punch.frequency.setValueAtTime(120, now);
    punch.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    pg.gain.setValueAtTime(0.28, now);
    pg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    punch.start(now); punch.stop(now + 0.14);

    // High debris crackle
    const bufSize2 = ctx.sampleRate * 0.25;
    const buf2 = ctx.createBuffer(1, bufSize2, ctx.sampleRate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < bufSize2; i++) d2[i] = Math.random() * 2 - 1;
    const noise2 = ctx.createBufferSource();
    noise2.buffer = buf2;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.06, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise2.connect(hp); hp.connect(g2); g2.connect(ctx.destination);
    noise2.start(now + 0.05); noise2.stop(now + 0.3);
  }

  // 💧 Valve Drain — water rushing through pipes + bubble gurgles + descending drain tone
  public playValveDrain() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Layer 1: Water rush — lowpass-filtered noise sweeping high → low (1.6s)
    const rushSize = Math.floor(ctx.sampleRate * 1.6);
    const rushBuf = ctx.createBuffer(1, rushSize, ctx.sampleRate);
    const rushData = rushBuf.getChannelData(0);
    for (let i = 0; i < rushSize; i++) rushData[i] = Math.random() * 2 - 1;
    const rush = ctx.createBufferSource();
    rush.buffer = rushBuf;
    const rushFilter = ctx.createBiquadFilter();
    rushFilter.type = 'lowpass';
    rushFilter.frequency.setValueAtTime(1800, now);
    rushFilter.frequency.exponentialRampToValueAtTime(280, now + 1.4);
    const rushGain = ctx.createGain();
    rushGain.gain.setValueAtTime(0.0, now);
    rushGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    rushGain.gain.setValueAtTime(0.18, now + 1.0);
    rushGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    rush.connect(rushFilter);
    rushFilter.connect(rushGain);
    rushGain.connect(ctx.destination);
    rush.start(now);
    rush.stop(now + 1.6);

    // Layer 2: Bubble gurgles — 8 staggered low-frequency pops
    for (let i = 0; i < 8; i++) {
      const delay = 0.05 + i * 0.17;
      const freq = 55 + Math.random() * 80; // 55–135 Hz
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + delay + 0.1);
      g.gain.setValueAtTime(0.12, now + delay);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
      osc.start(now + delay);
      osc.stop(now + delay + 0.13);
    }

    // Layer 3: Descending drain tone — 400 Hz → 50 Hz glide over 1.4s with slight wobble
    const drain = ctx.createOscillator();
    const drainG = ctx.createGain();
    drain.connect(drainG);
    drainG.connect(ctx.destination);
    drain.type = 'triangle';
    drain.frequency.setValueAtTime(400, now + 0.1);
    drain.frequency.exponentialRampToValueAtTime(50, now + 1.4);
    drainG.gain.setValueAtTime(0.0, now);
    drainG.gain.linearRampToValueAtTime(0.09, now + 0.15);
    drainG.gain.setValueAtTime(0.09, now + 1.0);
    drainG.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    drain.start(now);
    drain.stop(now + 1.5);
  }

  // Play a descending minor chord for defeat
  public playDefeat() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [293.66, 261.63, 220.00, 196.00]; // D4, C4, A3, G3

    notes.forEach((freq, idx) => {
      const delay = idx * 0.15;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + delay);

      // Low pass to make it sound dark
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now + delay);

      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0.08, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

      osc.start(now + delay);
      osc.stop(now + delay + 0.5);
    });
  }
}

export const gameAudio = new AudioService();
