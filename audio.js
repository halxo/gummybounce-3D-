(() => {
  'use strict';

  class GummyAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.unlocked = false;
      this.lastSquishTime = 0;
      this.lastStretchTime = 0;
      this.lastBeamTime = 0;

      const unlock = () => {
        this.unlocked = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      };
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('pointerdown', unlock, { once: true, passive: true });
        window.addEventListener('keydown', unlock, { once: true, passive: true });
      }
    }

    ensureContext() {
      if (!this.enabled || !this.unlocked) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
    }

    playBoop(pitchMult = 1) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const base = (235 + Math.random() * 55) * pitchMult;
      osc.frequency.setValueAtTime(base * 0.85, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.48, now + 0.055);
      osc.frequency.exponentialRampToValueAtTime(base, now + 0.25);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(22, now);
      lfoGain.gain.setValueAtTime(36 * pitchMult, now);
      lfoGain.gain.exponentialRampToValueAtTime(2, now + 0.26);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.3);
      lfo.stop(now + 0.3);
    }

    playSquish(intensity = 0.5) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - this.lastSquishTime < 0.045) return;
      this.lastSquishTime = now;

      const clamped = Math.max(0.08, Math.min(1, intensity));
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startFreq = 115 + clamped * 115 + Math.random() * 30;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.55, now + 0.032);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, now + 0.13);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.13 * clamped, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }

    playStretchTick(ratio = 0.5) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - this.lastStretchTime < 0.085) return;
      this.lastStretchTime = now;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const freq = 185 + Math.min(1.3, ratio) * 260;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    }

    playLaunch(power = 0.8) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const p = Math.max(0.2, Math.min(1.2, power));

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(430 + p * 310, now + 0.11);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }

    playGatlingPop() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const base = 260 + Math.random() * 90;
      osc.frequency.setValueAtTime(base * 0.65, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.85, now + 0.045);
      osc.frequency.exponentialRampToValueAtTime(base * 0.9, now + 0.11);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }

    playTrampoline() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.19);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.36);

      lfo.frequency.setValueAtTime(28, now);
      lfoG.gain.setValueAtTime(42, now);
      lfoG.gain.exponentialRampToValueAtTime(3, now + 0.36);
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.19, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.4);
      lfo.stop(now + 0.4);
    }

    playBeamPulse(kind = 'vortex') {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (now - this.lastBeamTime < 0.095) return;
      this.lastBeamTime = now;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (kind === 'cryo') {
        osc.type = 'sine';
        const f = 880 + Math.random() * 520;
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + 0.07);
      } else if (kind === 'puff') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.075);
      } else if (kind === 'magnet') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(165, now + 0.085);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160 + Math.random() * 50, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.085);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    }

    playPopSplit() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [340, 520, 760].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = now + i * 0.03;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.7, t + 0.07);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.16, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    }

    playIceShatter() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [1180, 1560, 1980, 2340].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = now + i * 0.022;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.72, t + 0.12);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.11, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    }

    playSupernova() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [95, 190, 380].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f * 1.8, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.55, now + 0.42);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.16 / (idx + 1), now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
      });
    }

    playJiggleQuake() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [180, 270, 360].forEach((base, idx) => {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(base, now + idx * 0.025);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(19 + idx * 3, now);
        lfoGain.gain.setValueAtTime(32, now);
        lfoGain.gain.exponentialRampToValueAtTime(2, now + 0.42);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.001, now + idx * 0.025);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.025 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.025);
        lfo.start(now);
        osc.stop(now + 0.46);
        lfo.stop(now + 0.46);
      });
    }

    playScore(combo = 1) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const mult = Math.min(1.5, 1 + (combo - 1) * 0.08);
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * mult, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }

    playGreenManHeist(variant = 'green') {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const isRed = variant === 'red';
      const isBlue = variant === 'blue';
      const isPurple = variant === 'purple';
      const notes = isRed
        ? [261.63, 311.13, 392.0, 523.25]
        : isPurple
          ? [246.94, 293.66, 369.99, 493.88]
          : isBlue
            ? [220.0, 261.63, 329.63, 392.0]
            : [196.0, 233.08, 293.66, 277.18];
      const spacing = isRed ? 0.048 : isPurple ? 0.068 : 0.075;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * spacing;
        osc.type = isRed ? 'sawtooth' : (isBlue || isPurple) ? 'triangle' : 'triangle';
        if (isBlue) osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(isRed ? 0.11 : 0.14, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (isRed ? 0.10 : 0.14));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });

      const yoink = ctx.createOscillator();
      const yGain = ctx.createGain();
      const tY = now + notes.length * spacing;
      yoink.type = 'sine';
      yoink.frequency.setValueAtTime(isRed ? 360 : isPurple ? 310 : 280, tY);
      yoink.frequency.exponentialRampToValueAtTime(
        isRed ? 1120 : isPurple ? 990 : isBlue ? 940 : 860,
        tY + (isRed ? 0.13 : 0.18)
      );

      yGain.gain.setValueAtTime(0.001, tY);
      yGain.gain.linearRampToValueAtTime(0.18, tY + 0.018);
      yGain.gain.exponentialRampToValueAtTime(0.001, tY + (isRed ? 0.18 : 0.24));

      yoink.connect(yGain);
      yGain.connect(ctx.destination);
      yoink.start(tY);
      yoink.stop(tY + 0.26);
    }

    playTraitorChomp() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Subtle sneaky gummy gulp + tiny satisfied burp/smirk note
      const gulp = ctx.createOscillator();
      const gain = ctx.createGain();
      gulp.type = 'sine';
      gulp.frequency.setValueAtTime(250, now);
      gulp.frequency.exponentialRampToValueAtTime(115, now + 0.085);
      gulp.frequency.exponentialRampToValueAtTime(320, now + 0.17);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

      gulp.connect(gain);
      gain.connect(ctx.destination);
      gulp.start(now);
      gulp.stop(now + 0.22);
    }

    playWrongSuspect() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [220, 155.56].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.13;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.20);
      });
    }

    playTraitorWin() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const fanfare = [392.0, 493.88, 587.33, 783.99, 987.77];
      fanfare.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.075;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i === fanfare.length - 1 ? 0.52 : 0.24));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }

    playGoldenBlessing() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Shimmering celestial harp / angelic major-9th arpeggio
      const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.068;
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.13, t + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.62);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.65);
      });
    }

    playRedManRepelled() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Snappy comic whack + startled upward cartoon boing!
      const whack = ctx.createOscillator();
      const wGain = ctx.createGain();
      whack.type = 'triangle';
      whack.frequency.setValueAtTime(320, now);
      whack.frequency.exponentialRampToValueAtTime(95, now + 0.075);
      wGain.gain.setValueAtTime(0.001, now);
      wGain.gain.linearRampToValueAtTime(0.22, now + 0.008);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      whack.connect(wGain);
      wGain.connect(ctx.destination);
      whack.start(now);
      whack.stop(now + 0.095);

      const boing = ctx.createOscillator();
      const bGain = ctx.createGain();
      boing.type = 'sine';
      boing.frequency.setValueAtTime(240, now + 0.045);
      boing.frequency.exponentialRampToValueAtTime(680, now + 0.22);
      bGain.gain.setValueAtTime(0.001, now + 0.045);
      bGain.gain.linearRampToValueAtTime(0.16, now + 0.065);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      boing.connect(bGain);
      bGain.connect(ctx.destination);
      boing.start(now + 0.045);
      boing.stop(now + 0.26);
    }

    playYellowManGift() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Sunny cheerful transformation chime!
      [587.33, 739.99, 880.0, 1174.66].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.055;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
      });
    }

    playObtuseBeatdown() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Rapid cartoon brawler punch-thuds + comic slip-away!
      [0, 0.13, 0.26, 0.39, 0.52, 0.66].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + offset;
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        const startF = idx % 2 === 0 ? 185 : 235;
        osc.frequency.setValueAtTime(startF, t);
        osc.frequency.exponentialRampToValueAtTime(58, t + 0.095);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.17, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    }

    playPortalWhoosh() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.28);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    }

    playHeatPop() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Sizzle + popcorn pop
      [0, 0.045, 0.09].forEach((off, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + off;
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(420 + i * 180, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      });
    }

    playFuseChime() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [330, 440, 554.37, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.045;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.18);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }

    playGlueSplat() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    playBumperDing() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const base = 660 + Math.random() * 260;
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.09);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }

    playElectricZap() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    }

    playBossHit() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }

    playBossDefeat() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.075;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    }

    playAchievement() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [659.25, 880, 1174.66, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    }

    playWaveStart() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [293.66, 369.99, 440.0].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.08;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.34);
      });
    }

    playShutter() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.045);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }

  window.GummyApp = window.GummyApp || {};
  window.GummyApp.audio = new GummyAudio();
})();
