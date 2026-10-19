/**
 * Web Audio API procedural sound synthesizer for Tetris
 * Fully self-contained, 0 external audio assets required
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private bgmMuted: boolean = true; // Off by default so user isn't startled, toggleable via UI
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  // BGM sequencer state
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private bgmNoteIndex: number = 0;

  constructor() {
    // Read user audio preferences from localStorage if available
    try {
      const savedSfx = localStorage.getItem('tetris_sfx_muted');
      if (savedSfx !== null) this.sfxMuted = savedSfx === 'true';
      const savedBgm = localStorage.getItem('tetris_bgm_muted');
      if (savedBgm !== null) this.bgmMuted = savedBgm === 'true';
    } catch {
      // Ignore localStorage errors
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.6, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : 0.18, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public getBgmMuted(): boolean {
    return this.bgmMuted;
  }

  public toggleSfx(): boolean {
    this.sfxMuted = !this.sfxMuted;
    try {
      localStorage.setItem('tetris_sfx_muted', String(this.sfxMuted));
    } catch {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.sfxMuted;
  }

  public toggleBgm(): boolean {
    this.initContext();
    this.bgmMuted = !this.bgmMuted;
    try {
      localStorage.setItem('tetris_bgm_muted', String(this.bgmMuted));
    } catch {}
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : 0.18, this.ctx.currentTime);
    }
    if (!this.bgmMuted && !this.isBgmPlaying) {
      this.startBgm();
    } else if (this.bgmMuted && this.isBgmPlaying) {
      this.stopBgm();
    }
    return this.bgmMuted;
  }

  // Play subtle move click
  public playMove() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Play rotation chirp
  public playRotate() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Play hold switch sound
  public playHold() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(680, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Play soft drop tick
  public playSoftDrop() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Play hard drop impact
  public playHardDrop() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Bass punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);

    // Click snap
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    clickGain.gain.setValueAtTime(0.15, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain);

    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  }

  // Play line clear chime (scales up pitch with combo)
  public playLineClear(lines: number, combo: number = 0) {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const comboPitchFactor = Math.min(1 + combo * 0.06, 1.6);

    if (lines === 4) {
      // TETRIS! Glorious 4-note chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq * comboPitchFactor, now + i * 0.06);

        noteGain.gain.setValueAtTime(0.25, now + i * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);

        noteOsc.connect(noteGain);
        noteGain.connect(this.sfxGain);

        noteOsc.start(now + i * 0.06);
        noteOsc.stop(now + i * 0.06 + 0.38);
      });
    } else {
      // 1-3 lines clear
      const baseFreqs = [440, 554.37, 659.25]; // A4, C#5, E5
      const noteCount = Math.min(lines, 3);
      for (let i = 0; i < noteCount; i++) {
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(baseFreqs[i] * comboPitchFactor, now + i * 0.05);

        noteGain.gain.setValueAtTime(0.18, now + i * 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22);

        noteOsc.connect(noteGain);
        noteGain.connect(this.sfxGain);

        noteOsc.start(now + i * 0.05);
        noteOsc.stop(now + i * 0.05 + 0.25);
      }
    }
  }

  // Play Level Up fanfare
  public playLevelUp() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  // Play Game Over descending sweep
  public playGameOver() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.7);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.78);
  }

  // Play victory chime (Sprint 40 lines / Ultra)
  public playVictory() {
    if (this.sfxMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.22, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
  }

  // Synthesized Korobeiniki (Classic Tetris A-Theme) sequencer
  // Notes: [freq, duration in 16th notes]
  private static readonly THEME_MELODY: [number, number][] = [
    [659.25, 2], // E5
    [493.88, 1], // B4
    [523.25, 1], // C5
    [587.33, 2], // D5
    [523.25, 1], // C5
    [493.88, 1], // B4
    [440.00, 2], // A4
    [440.00, 1], // A4
    [523.25, 1], // C5
    [659.25, 2], // E5
    [587.33, 1], // D5
    [523.25, 1], // C5
    [493.88, 3], // B4
    [523.25, 1], // C5
    [587.33, 2], // D5
    [659.25, 2], // E5
    [523.25, 2], // C5
    [440.00, 2], // A4
    [440.00, 2], // A4
    [0, 2],      // rest

    [587.33, 3], // D5
    [698.46, 1], // F5
    [880.00, 2], // A5
    [783.99, 1], // G5
    [698.46, 1], // F5
    [659.25, 3], // E5
    [523.25, 1], // C5
    [659.25, 2], // E5
    [587.33, 1], // D5
    [523.25, 1], // C5
    [493.88, 2], // B4
    [493.88, 1], // B4
    [523.25, 1], // C5
    [587.33, 2], // D5
    [659.25, 2], // E5
    [523.25, 2], // C5
    [440.00, 2], // A4
    [440.00, 2], // A4
    [0, 2],      // rest
  ];

  public startBgm() {
    if (this.bgmMuted) return;
    this.initContext();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.bgmNoteIndex = 0;
    this.scheduleNextBgmNote();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleNextBgmNote() {
    if (!this.isBgmPlaying || this.bgmMuted || !this.ctx || !this.bgmGain) return;

    const [freq, durationUnits] = SoundManager.THEME_MELODY[this.bgmNoteIndex];
    const unitMs = 125; // 120 BPM 16th note ~ 125ms
    const noteDurationSec = (durationUnits * unitMs * 0.85) / 1000;
    const stepDurationMs = durationUnits * unitMs;

    if (freq > 0) {
      const now = this.ctx.currentTime;
      // Lead melodic oscillator (pulse-like square wave)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDurationSec);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + noteDurationSec + 0.02);

      // Subtle warm sub-bass oscillator
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(freq * 0.5, now);
      bassGain.gain.setValueAtTime(0.04, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + noteDurationSec);
      bassOsc.connect(bassGain);
      bassGain.connect(this.bgmGain);
      bassOsc.start(now);
      bassOsc.stop(now + noteDurationSec + 0.02);
    }

    this.bgmNoteIndex = (this.bgmNoteIndex + 1) % SoundManager.THEME_MELODY.length;
    this.bgmTimer = window.setTimeout(() => {
      this.scheduleNextBgmNote();
    }, stepDurationMs);
  }
}

export const soundManager = new SoundManager();
