// ===================================================================
//  Mor'ia AUDIO ENGINE — 100% procedural (Web Audio API)
//  No external files needed. Generates all SFX and music at runtime.
// ===================================================================

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  public muted = false;
  public musicVolume = 0.35;
  public sfxVolume = 0.6;
  private noiseBuffer: AudioBuffer | null = null;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      // Pre-generate white noise buffer for percussive sounds
      const bufferSize = this.ctx.sampleRate * 1;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    } catch (e) {
      console.warn('Audio not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.8;
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  // ===== CORE SYNTHESIS HELPERS =====
  private tone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 1, when = 0, detune = 0) {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private sweep(fromFreq: number, toFreq: number, duration: number, type: OscillatorType = 'sine', vol = 1, when = 0) {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), t + duration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private noise(duration: number, vol = 1, filterFreq = 1000, when = 0, type: BiquadFilterType = 'lowpass') {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer || this.muted) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration + 0.05);
  }

  // ===== SFX LIBRARY =====
  hit() { this.noise(0.12, 0.5, 800); this.tone(140, 0.1, 'square', 0.25); }
  hitCrit() { this.noise(0.18, 0.7, 1200); this.tone(220, 0.15, 'square', 0.4); this.sweep(400, 100, 0.2, 'sawtooth', 0.3); }
  arrow() { this.sweep(1200, 400, 0.15, 'triangle', 0.4); }
  meleeSwing() { this.noise(0.08, 0.2, 500); this.sweep(300, 150, 0.1, 'triangle', 0.2); }

  spellCast(color: string) {
    // Color-based pitch
    const isHigh = color.includes('f4e04d') || color.includes('fff');
    const base = isHigh ? 660 : 330;
    this.tone(base, 0.15, 'sine', 0.3);
    this.tone(base * 1.5, 0.25, 'sine', 0.2, 0.05);
    this.tone(base * 2, 0.3, 'sine', 0.15, 0.1);
  }
  spellHit(color: string) {
    const isFire = color.includes('ff6a00') || color.includes('ff3300');
    const isIce = color.includes('9bd4ff') || color.includes('4ad0ff');
    if (isFire) { this.noise(0.2, 0.5, 600); this.sweep(200, 50, 0.25, 'sawtooth', 0.3); }
    else if (isIce) { this.tone(1400, 0.2, 'triangle', 0.3); this.tone(1800, 0.15, 'sine', 0.2, 0.05); }
    else { this.sweep(800, 200, 0.2, 'sawtooth', 0.35); }
  }
  heal() {
    this.tone(523, 0.12, 'sine', 0.3);
    this.tone(659, 0.12, 'sine', 0.3, 0.08);
    this.tone(784, 0.25, 'sine', 0.3, 0.16);
  }
  potion() { this.sweep(200, 500, 0.15, 'sine', 0.3); this.noise(0.1, 0.15, 2000); }
  levelUp() {
    this.tone(523, 0.12, 'triangle', 0.4);
    this.tone(659, 0.12, 'triangle', 0.4, 0.1);
    this.tone(784, 0.12, 'triangle', 0.4, 0.2);
    this.tone(1047, 0.4, 'triangle', 0.5, 0.3);
  }
  loot() { this.tone(880, 0.08, 'sine', 0.3); this.tone(1320, 0.15, 'sine', 0.3, 0.06); }
  uiClick() { this.tone(600, 0.04, 'square', 0.15); }
  uiHover() { this.tone(900, 0.02, 'sine', 0.08); }
  death() { this.sweep(400, 50, 0.8, 'sawtooth', 0.5); this.noise(0.5, 0.3, 300); }
  teleport() { this.sweep(200, 2000, 0.3, 'sine', 0.3); this.sweep(2000, 400, 0.3, 'sine', 0.2, 0.2); }
  pickup() { this.tone(700, 0.06, 'sine', 0.25); this.tone(1000, 0.1, 'sine', 0.25, 0.04); }
  boss() { this.tone(80, 1.2, 'sawtooth', 0.5); this.tone(60, 1.2, 'sawtooth', 0.4); this.noise(1.0, 0.2, 200); }
  damage() { this.noise(0.1, 0.35, 500); this.tone(100, 0.08, 'square', 0.2); }

  // ===== AMBIENT MUSIC (procedural) =====
  // A scale-based ambient pad that loops, creating MMO atmosphere
  private musicScale = [220, 246.94, 293.66, 329.63, 369.99, 440, 493.88]; // A minor pentatonic-ish
  private musicStep = 0;

  startMusic(biome: string = 'plains') {
    this.stopMusic();
    if (!this.ctx || !this.musicGain || this.muted) return;
    // Adjust scale/timing per biome
    if (biome === 'snow') this.musicScale = [261.63, 311.13, 349.23, 392, 466.16, 523.25]; // cold
    else if (biome === 'shadow' || biome === 'swamp') this.musicScale = [164.81, 196, 220, 246.94, 293.66, 329.63]; // dark
    else if (biome === 'desert') this.musicScale = [220, 246.94, 277.18, 329.63, 369.99, 415.30]; // exotic
    else this.musicScale = [220, 246.94, 293.66, 329.63, 369.99, 440, 493.88]; // default

    const interval = biome === 'shadow' ? 1400 : biome === 'snow' ? 1800 : 1100;
    const playNote = () => {
      if (!this.ctx || !this.musicGain || this.muted) return;
      const t = this.ctx.currentTime;
      // Melody note
      const noteIdx = this.musicStep % this.musicScale.length;
      const freq = this.musicScale[noteIdx];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + interval / 1000 + 0.3);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + interval / 1000 + 0.5);

      // Bass drone every 4 steps
      if (this.musicStep % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bgain = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.value = freq / 4;
        bgain.gain.setValueAtTime(0, t);
        bgain.gain.linearRampToValueAtTime(0.25, t + 0.5);
        bgain.gain.exponentialRampToValueAtTime(0.0001, t + interval / 1000 * 4);
        bass.connect(bgain);
        bgain.connect(this.musicGain);
        bass.start(t);
        bass.stop(t + interval / 1000 * 4 + 0.5);
      }
      this.musicStep++;
      this.musicStep += Math.floor(Math.random() * 2); // slight randomness
    };
    playNote();
    this.musicTimer = window.setInterval(playNote, interval);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}

export const audio = new AudioEngine();
